from logging import Logger
from turtle import up
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
from api.app.routers import logger
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
    WorkflowPublish,
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

    logger.info(f"Getting workflows for user {local_user.id}")
    workflows = await get_workflows_for_user(
        session, local_user.id, page, limit, sort, order
    )
    return workflows


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

    logger.info(f"Getting workflow {workflow_id} for user {local_user.id}")
    return workflow


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

    logger.info(f"Creating workflow for user {local_user.id}")
    new_workflow = await create_workflow(session, local_user.id, workflow_in)
    if not new_workflow:
        raise HTTPException(status_code=400, detail="Workflow creation failed")
    workflow_version = await create_new_workflow_version(
        session,
        new_workflow.id,
        local_user.username or str(local_user.id),
        WorkflowVersionCreate(
            is_active=True,
            version_number=-1,
            definition={},
            execution_plan=[],
        ),
    )
    if not workflow_version:
        raise HTTPException(status_code=400, detail="Workflow version creation failed")
    new_workflow.active_version_id = workflow_version.id
    new_workflow.active_version = workflow_version
    return new_workflow


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

    if (
        workflow.status != WorkflowStatus.DRAFT
        and len(workflow_in.model_dump(exclude_unset=True)) > 1
        and workflow_in.status is None
        and workflow_in.cron is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Only status can be updated for non-draft workflows",
        )

    if workflow_in.credits_cost and workflow_in.credits_cost < 0:
        raise HTTPException(status_code=400, detail="Credits cost cannot be negative")

    updated = await update_workflow(session, workflow, workflow_in)
    logger.info("Updating workflow %s for user %s", workflow_id, local_user.id)
    return updated


@router.patch("/{workflow_id}/publish", response_model=WorkflowRead)
async def publish_workflow(
    workflow_id: UUID,
    publish_request: WorkflowPublish,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Publish a workflow"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.status != WorkflowStatus.DRAFT:
        raise HTTPException(
            status_code=400, detail="Only draft workflows can be published"
        )

    if not workflow.active_version:
        raise HTTPException(
            status_code=400, detail="Workflow does not have an active version"
        )

    if (
        not publish_request
        or not publish_request.definition
        or not publish_request.execution_plan
        or not publish_request.credits_cost
    ):
        raise HTTPException(
            status_code=400,
            detail="Definition, execution plan and credits cost must be provided",
        )

    logger.info(f"Updating active version for workflow {workflow_id}")
    updated = await update_workflow(
        session,
        workflow,
        WorkflowUpdate(
            status=WorkflowStatus.PUBLISHED,
            credits_cost=publish_request.credits_cost,
            definition=publish_request.definition,
            execution_plan=publish_request.execution_plan,
        ),
    )
    logger.info(f"Published workflow {workflow_id} for user {local_user.id}")
    return updated


@router.patch("/{workflow_id}/unpublish", response_model=WorkflowRead)
async def unpublish_workflow(
    workflow_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Unpublish a workflow"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.status != WorkflowStatus.PUBLISHED:
        raise HTTPException(
            status_code=400, detail="Only published workflows can be unpublished"
        )
    if workflow.active_version:
        workflow.active_version.execution_plan = []

    logger.info(f"Unpublishing workflow {workflow_id} for user {local_user.id}")
    return await update_workflow(
        session, workflow, WorkflowUpdate(credits_cost=0, status=WorkflowStatus.DRAFT)
    )


@router.patch("/{workflow_id}/unschedule", response_model=WorkflowRead)
async def unschedule_workflow(
    workflow_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> Workflow:
    """Unschedule a workflow"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(session, workflow_id, local_user.id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if workflow.status != WorkflowStatus.PUBLISHED:
        raise HTTPException(
            status_code=400, detail="Only published workflows can be unscheduled"
        )

    if workflow.cron:
        workflow.cron = None
        workflow.next_run_at = None

    logger.info(f"Unscheduling workflow {workflow_id} for user {local_user.id}")
    return await update_workflow(session, workflow, WorkflowUpdate())


@router.patch("/{workflow_id}/rollback", response_model=WorkflowRead)
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

    if version_id == workflow.active_version_id:
        raise HTTPException(
            status_code=400, detail="Cannot rollback to the current active version"
        )

    if workflow.active_version:
        workflow.active_version.is_active = False

    version.is_active = True
    workflow.active_version_id = version_id
    logger.info(f"Rolling back workflow {workflow_id} to version {version_id}")
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
    logger.info(f"Deleting workflow {workflow_id} for user {local_user.id}")
    await delete_workflow(session, workflow)
