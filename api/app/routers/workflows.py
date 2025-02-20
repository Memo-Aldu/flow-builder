from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession


from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.workflow_crud import (
    create_workflow,
    get_workflows_for_user,
    delete_workflow,
)
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
)


router = APIRouter(tags=["Workflows"])


@router.get("", response_model=List[WorkflowRead])
async def list_workflows_endpoint(
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> List[Workflow]:
    """Get all workflows for a given user"""
    # TODO: Add pagination
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflows = await get_workflows_for_user(session, local_user.id)
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

    updated = await update_workflow(session, workflow, workflow_in)
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
