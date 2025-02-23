from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession


from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.workflow_crud import (
    SortField,
    SortOrder,
    create_workflow,
    get_workflows_for_user,
    delete_workflow,
)
from api.app.crud.workflow_version_crud import create_new_workflow_version
from shared.crud.workflow_version_crud import get_workflow_version_by_id
from shared.db import get_session
from shared.crud.workflow_crud import (
    get_workflow_by_id_and_user,
    update_workflow,
)
from shared.models import (
    Workflow,
    WorkflowCreate,
    WorkflowRead,
    WorkflowStatus,
    WorkflowUpdate,
    WorkflowVersionCreate,
)


router = APIRouter(tags=["Workflows"])


@router.get("", response_model=List[WorkflowRead])
async def list_workflows_endpoint(
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.CREATED_AT, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[Workflow]:
    """Get all workflows for a given user"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflows = await get_workflows_for_user(
        session, local_user.id, page, limit, sort, order
    )
    return workflows


@router.post("", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
async def create_workflow_endpoint(
    workflow_in: WorkflowCreate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Create a new workflow"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_workflow = await create_workflow(session, local_user.id, workflow_in)
    return new_workflow


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow_endpoint(
    workflow_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Get a workflow by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")
    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.patch("/{workflow_id}", response_model=WorkflowRead)
async def update_workflow_endpoint(
    workflow_id: UUID,
    workflow_in: WorkflowUpdate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Update a workflow by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.status != WorkflowStatus.DRAFT:
        raise HTTPException(
            status_code=400, detail="Only draft workflows can be updated"
        )

    definition = workflow_in.definition or {}
    execution_plan = workflow_in.execution_plan or []

    new_version = await create_new_workflow_version(
        session,
        workflow_id,
        local_user.id,
        WorkflowVersionCreate(
            version_number=-1,
            definition=definition,
            execution_plan=execution_plan,
        ),
    )

    if not new_version:
        raise HTTPException(status_code=500, detail="Failed to create new version")
    workflow_in.active_version_id = new_version.id
    # remove the definition and execution plan from the update
    workflow_in.definition = None
    workflow_in.execution_plan = None
    updated = await update_workflow(session, workflow, workflow_in)
    return updated


@router.patch("/workflows/{workflow_id}/rollback", response_model=WorkflowRead)
async def rollback_version(
    workflow_id: UUID,
    version_id: UUID = Query(..., description="Version ID to rollback to"),
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Rollback a workflow to a previous version"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.status != WorkflowStatus.DRAFT:
        raise HTTPException(
            status_code=400, detail="Only draft workflows can be updated"
        )

    version = await get_workflow_version_by_id(session, workflow_id, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Workflow version not found")

    workflow.version_id = version_id
    updated = await update_workflow(session, workflow, WorkflowUpdate())
    return updated


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow_endpoint(
    workflow_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a workflow by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    await delete_workflow(session, workflow)
