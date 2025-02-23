from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession


from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.workflow_version_crud import (
    SortField,
    SortOrder,
    get_workflow_version_by_version,
    get_workflow_versions_by_workflow_id,
)
from shared.crud.workflow_version_crud import get_workflow_version_by_id
from shared.db import get_session
from shared.models import WorkflowVersionCreate, WorkflowVersionRead


router = APIRouter(tags=["Workflow Versions"])


@router.get(
    "/workflows/{workflow_id}/versions/{version_num}",
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

    return WorkflowVersionRead.model_validate(workflow_version)


@router.get(
    "/workflows/{workflow_id}/versions/{version_id}", response_model=WorkflowVersionRead
)
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

    return WorkflowVersionRead.model_validate(workflow_version)


@router.get(
    "/workflows/{workflow_id}/versions", response_model=List[WorkflowVersionRead]
)
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
    return [
        WorkflowVersionRead.model_validate(workflow_version)
        for workflow_version in workflow_versions
    ]
