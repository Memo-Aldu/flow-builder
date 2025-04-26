from typing import List
from uuid import UUID
from venv import logger

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.services import workflows as svc
from shared.db import get_session
from shared.models import (
    User,
    WorkflowCreate,
    WorkflowRead,
    WorkflowUpdate,
    WorkflowPublish,
    WorkflowStatus,
)

router = APIRouter(tags=["Workflows"])


async def _current_user(
    db: AsyncSession = Depends(get_session),
    info: dict = Depends(verify_clerk_token),
) -> User:
    user = await get_local_user_by_clerk_id(db, info["sub"])
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.get("", response_model=List[WorkflowRead])
async def list_workflows(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    sort: svc.SortField = Query(svc.SortField.CREATED_AT),
    order: svc.SortOrder = Query(svc.SortOrder.DESC),
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> List[svc.Workflow]:
    """List all workflows for the current user"""
    logger.info(f"Listing workflows for user: {user.id}")
    return await svc.list_user_workflows(
        db, user.id, page=page, limit=limit, sort=sort, order=order
    )


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    """Get a specific workflow by ID"""
    wf = await svc.get_user_workflow(db, user.id, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return wf


@router.post("", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    data: WorkflowCreate,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    wf = await svc.create_workflow(db, user.id, data)
    await svc.create_initial_version(db, wf, created_by=user.username or str(user.id))
    return wf


@router.patch("/{workflow_id}", response_model=WorkflowRead)
async def update_workflow(
    workflow_id: UUID,
    data: WorkflowUpdate,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    """Update a specific workflow by ID"""
    wf = await _require_workflow(db, user.id, workflow_id)
    if wf.status != WorkflowStatus.DRAFT and _has_non_status_changes(data):
        raise HTTPException(400, "Only status/cron can be changed in non‑draft")
    updated = await svc.patch_workflow(db, wf, data)
    return updated


@router.patch("/{workflow_id}/publish", response_model=WorkflowRead)
async def publish_workflow(
    workflow_id: UUID,
    req: WorkflowPublish,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    """Publish a workflow"""
    wf = await _require_workflow(db, user.id, workflow_id)
    updated = await svc.publish_workflow(db, wf, req)
    return updated


@router.patch("/{workflow_id}/unpublish", response_model=WorkflowRead)
async def unpublish_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    """Unpublish a workflow"""
    wf = await _require_workflow(db, user.id, workflow_id)
    updated = await svc.unpublish_workflow(db, wf)
    return updated


@router.patch("/{workflow_id}/unschedule", response_model=WorkflowRead)
async def unschedule_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    """Unschedule a workflow"""
    wf = await _require_workflow(db, user.id, workflow_id)
    updated = await svc.unschedule_workflow(db, wf)
    return updated


@router.patch("/{workflow_id}/rollback", response_model=WorkflowRead)
async def rollback_workflow(
    workflow_id: UUID,
    version_id: UUID = Query(...),
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    """Rollback a workflow to a specific version"""
    wf = await _require_workflow(db, user.id, workflow_id)
    updated = await svc.rollback_workflow(db, wf, version_id)
    return updated


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> None:
    """Delete a specific workflow by ID"""
    wf = await _require_workflow(db, user.id, workflow_id)
    await svc.delete_workflow(db, wf)


async def _require_workflow(
    db: AsyncSession, user_id: UUID, workflow_id: UUID
) -> svc.Workflow:
    """Get a workflow by ID and user ID"""
    wf = await svc.get_user_workflow(db, user_id, workflow_id)
    if not wf:
        raise HTTPException(404, "Workflow not found")
    return wf


def _has_non_status_changes(data: WorkflowUpdate) -> bool:
    keys = set(data.model_dump(exclude_unset=True).keys())
    allowed = {"status", "cron"}
    return not keys.issubset(allowed)
