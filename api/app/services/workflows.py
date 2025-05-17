from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from shared.cron import get_next_run_date
from shared.models import (
    Workflow,
    WorkflowStatus,
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowPublish,
    WorkflowVersion,
)


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    NAME = "name"
    STATUS = "status"
    CREDITS_COST = "credits_cost"
    LAST_RUN_AT = "last_run_at"
    NEXT_RUN_AT = "next_run_at"


async def list_user_workflows(
    db: AsyncSession,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
) -> List[Workflow]:
    stmt = (
        select(Workflow)
        .where(Workflow.user_id == user_id)
        .order_by(
            getattr(Workflow, sort).desc()
            if order == SortOrder.DESC
            else getattr(Workflow, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_user_workflow(
    db: AsyncSession, user_id: UUID, workflow_id: UUID, *, eager=True
) -> Optional[Workflow]:
    stmt = select(Workflow).where(
        Workflow.id == workflow_id, Workflow.user_id == user_id
    )
    if eager:
        stmt = stmt.options(selectinload(Workflow.active_version))  # type: ignore
    res = await db.execute(stmt)
    return res.scalars().first()


async def create_workflow(
    db: AsyncSession, user_id: UUID, data: WorkflowCreate
) -> Workflow:
    wf = Workflow(user_id=user_id, **data.model_dump())
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    return wf


async def create_initial_version(
    db: AsyncSession, workflow: Workflow, created_by: str
) -> WorkflowVersion:
    version = WorkflowVersion(
        workflow_id=workflow.id,
        version_number=1,
        definition={},
        execution_plan=[],
        created_by=created_by,
        is_active=True,
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)

    workflow.active_version_id = version.id
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    return version


async def patch_workflow(
    db: AsyncSession, wf: Workflow, data: WorkflowUpdate
) -> Workflow:
    updates = data.model_dump(exclude_unset=True)

    if "cron" in updates and updates["cron"] != wf.cron:
        wf.next_run_at = get_next_run_date(updates["cron"])

    if wf.active_version:
        for field in ("definition", "execution_plan"):
            if field in updates:
                setattr(wf.active_version, field, updates.pop(field))

    for k, v in updates.items():
        setattr(wf, k, v)

    wf.updated_at = datetime.now()
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    if wf.active_version:
        await db.refresh(wf.active_version)
    return wf


async def publish_workflow(
    db: AsyncSession, wf: Workflow, req: WorkflowPublish
) -> Workflow:
    if wf.status != WorkflowStatus.DRAFT:
        raise ValueError("Only draft workflows can be published")

    if not wf.active_version:
        raise ValueError("Workflow has no active version")

    await patch_workflow(
        db,
        wf,
        WorkflowUpdate(
            status=WorkflowStatus.PUBLISHED,
            credits_cost=req.credits_cost,
            definition=req.definition,
            execution_plan=req.execution_plan,
        ),
    )
    return wf


async def unpublish_workflow(db: AsyncSession, wf: Workflow) -> Workflow:
    if wf.status != WorkflowStatus.PUBLISHED:
        raise ValueError("Workflow is not published")

    if wf.active_version:
        wf.active_version.execution_plan = []

    await patch_workflow(
        db, wf, WorkflowUpdate(status=WorkflowStatus.DRAFT, credits_cost=0)
    )
    return wf


async def unschedule_workflow(db: AsyncSession, wf: Workflow) -> Workflow:
    wf.cron = None
    wf.next_run_at = None
    await patch_workflow(db, wf, WorkflowUpdate())
    return wf


async def rollback_workflow(
    db: AsyncSession, wf: Workflow, version_id: UUID
) -> Workflow:
    if wf.status != WorkflowStatus.DRAFT:
        raise ValueError("Only draft workflows can be rolled back")

    if version_id == wf.active_version_id:
        raise ValueError("Already active")

    # deactivate old, activate new
    if wf.active_version:
        wf.active_version.is_active = False
    new_ver: WorkflowVersion | None = await db.get(WorkflowVersion, version_id)
    if not new_ver or new_ver.workflow_id != wf.id:
        raise ValueError("Version not found")
    new_ver.is_active = True
    wf.active_version_id = version_id

    db.add_all([wf, new_ver])
    await db.commit()
    await db.refresh(wf)
    return wf


async def delete_workflow(db: AsyncSession, wf: Workflow) -> None:
    await db.delete(wf)
    await db.commit()
