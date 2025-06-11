from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_user_or_guest, get_current_user_from_auth
from api.app.middleware.hybrid_rate_limit import default_rate_limit, check_hybrid_rate_limit
from api.app.crud.workflow_version_crud import (
    SortField,
    SortOrder,
    create_new_workflow_version,
    get_workflow_version_by_version,
    get_workflow_versions_by_workflow_id,
)
from shared.crud.workflow_crud import get_workflow_by_id_and_user
from shared.crud.workflow_version_crud import get_workflow_version_by_id
from shared.db import get_session
from shared.models import WorkflowVersion, WorkflowVersionCreate, WorkflowVersionRead


router = APIRouter(tags=["WorkflowVersions"])


@router.get(
    "/{workflow_id}/versions/number/{version_num}",
    response_model=WorkflowVersionRead,
)
@default_rate_limit
async def get_version_by_number(
    request: Request,
    workflow_id: UUID,
    version_num: int,
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> WorkflowVersionRead:
    """Get a specific workflow version by ID"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    workflow_version = await get_workflow_version_by_version(
        session, workflow_id, version_num
    )
    if not workflow_version:
        raise HTTPException(status_code=404, detail="Workflow version not found")
    logger.info("Get workflow version by number: %s", workflow_version.version_number)
    return WorkflowVersionRead.model_validate(workflow_version)


@router.get("/{workflow_id}/versions/{version_id}", response_model=WorkflowVersionRead)
@default_rate_limit
async def get_version_by_id(
    request: Request,
    workflow_id: UUID,
    version_id: UUID,
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> WorkflowVersionRead:
    """Get a specific workflow version by ID"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    workflow_version = await get_workflow_version_by_id(
        session, workflow_id, version_id
    )
    if not workflow_version:
        raise HTTPException(status_code=404, detail="Workflow version not found")
    logger.info("Get workflow version by ID: %s", version_id)
    return WorkflowVersionRead.model_validate(workflow_version)


@router.get("/{workflow_id}/versions", response_model=List[WorkflowVersionRead])
@default_rate_limit
async def list_versions(
    request: Request,
    workflow_id: UUID,
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.VERSION_NUMBER, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[WorkflowVersionRead]:
    """Get all versions for a given workflow"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    workflow_versions = await get_workflow_versions_by_workflow_id(
        session, workflow_id, page, limit, sort, order
    )
    logger.info("Getting versions for workflow %s", workflow_id)
    return [
        WorkflowVersionRead.model_validate(workflow_version)
        for workflow_version in workflow_versions
    ]


@router.post(
    "/{workflow_id}/versions",
    response_model=WorkflowVersionRead,
    status_code=201,
)
@default_rate_limit
async def create_version(
    request: Request,
    workflow_id: UUID,
    version_in: WorkflowVersionCreate,
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> WorkflowVersionRead:
    """
    Create a new version for a workflow and mark it as the active version.
    """
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    workflow = await get_workflow_by_id_and_user(session, workflow_id, user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    new_version = await create_new_workflow_version(
        session=session,
        workflow_id=workflow_id,
        workflow_version=WorkflowVersion(
            **version_in.model_dump(exclude_unset=True),
            created_by=user.username or str(user.id),
            parent_version_id=workflow.active_version_id,
            workflow_id=workflow_id,
        ),
    )

    if not new_version:
        raise HTTPException(status_code=400, detail="Failed to create version")

    if workflow.active_version and workflow.active_version.id != new_version.id:
        workflow.active_version.is_active = False
        session.add(workflow.active_version)

    workflow.active_version_id = new_version.id
    session.add(workflow)
    await session.commit()
    logger.info(
        "Created new workflow version: %s for workflow %s",
        new_version.version_number,
        workflow_id
    )

    return WorkflowVersionRead.model_validate(new_version)
