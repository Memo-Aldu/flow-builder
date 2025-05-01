from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
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
async def get_version_by_number(
    workflow_id: UUID,
    version_num: int,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowVersionRead:
    """Get a specific workflow version by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow_version = await get_workflow_version_by_version(
        session, workflow_id, version_num
    )
    if not workflow_version:
        raise HTTPException(status_code=404, detail="Workflow version not found")
    logger.info(f"Get workflow version by number: {workflow_version.version_number}")
    return WorkflowVersionRead.model_validate(workflow_version)


@router.get("/{workflow_id}/versions/{version_id}", response_model=WorkflowVersionRead)
async def get_version_by_id(
    workflow_id: UUID,
    version_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowVersionRead:
    """Get a specific workflow version by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow_version = await get_workflow_version_by_id(
        session, workflow_id, version_id
    )
    if not workflow_version:
        raise HTTPException(status_code=404, detail="Workflow version not found")
    logger.info(f"Get workflow version by ID: {version_id}")
    return WorkflowVersionRead.model_validate(workflow_version)


@router.get("/{workflow_id}/versions", response_model=List[WorkflowVersionRead])
async def list_versions(
    workflow_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.VERSION_NUMBER, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[WorkflowVersionRead]:
    """Get all versions for a given workflow"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow_versions = await get_workflow_versions_by_workflow_id(
        session, workflow_id, page, limit, sort, order
    )
    logger.info(f"Getting versions for workflow {workflow_id}")
    return [
        WorkflowVersionRead.model_validate(workflow_version)
        for workflow_version in workflow_versions
    ]


@router.post(
    "/{workflow_id}/versions",
    response_model=WorkflowVersionRead,
    status_code=201,
)
async def create_version(
    workflow_id: UUID,
    version_in: WorkflowVersionCreate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowVersionRead:
    """
    Create a new version for a workflow and mark it as the active version.
    """
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    new_version = await create_new_workflow_version(
        session=session,
        workflow_id=workflow_id,
        workflow_version=WorkflowVersion(
            **version_in.model_dump(exclude_unset=True),
            created_by=local_user.username or str(local_user.id),
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
        f"Created new workflow version: {new_version.version_number} for workflow {workflow_id}"
    )

    return WorkflowVersionRead.model_validate(new_version)
