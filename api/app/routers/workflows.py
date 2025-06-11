from typing import List
from uuid import UUID
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.auth import verify_user_or_guest, get_current_user_from_auth
from api.app.services import workflows as svc
from api.app.middleware.hybrid_rate_limit import workflows_rate_limit, check_hybrid_rate_limit
from shared.db import get_session
from shared.models import (
    User,
    WorkflowCreate,
    WorkflowRead,
    WorkflowUpdate,
    WorkflowPublish,
    WorkflowStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Workflows"])


async def _current_user(
    db: AsyncSession = Depends(get_session),
    auth_data = Depends(verify_user_or_guest),
) -> User:
    return await get_current_user_from_auth(auth_data, db)


@router.get("", response_model=List[WorkflowRead])
@workflows_rate_limit
async def list_workflows(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    sort: svc.SortField = Query(svc.SortField.CREATED_AT),
    order: svc.SortOrder = Query(svc.SortOrder.DESC),
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> List[svc.Workflow]:
    """List all workflows for the current user"""
    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, db, user)

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
@workflows_rate_limit
async def create_workflow(
    request: Request,
    data: WorkflowCreate,
    db: AsyncSession = Depends(get_session),
    user=Depends(_current_user),
) -> svc.Workflow:
    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, db, user)

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
    allowed = {"status", "cron", "next_run_at"}
    return not keys.issubset(allowed)
