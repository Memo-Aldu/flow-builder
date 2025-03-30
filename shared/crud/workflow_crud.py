from uuid import UUID
from typing import Optional
from datetime import datetime

from pytz import timezone
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from shared.cron import get_next_run_date
from shared.models import (
    Workflow,
    WorkflowStatus,
    WorkflowUpdate,
)


async def get_workflow_by_id_and_user(
    session: AsyncSession, workflow_id: UUID, user_id: UUID
) -> Optional[Workflow]:
    """Fetch a workflow by ID, ensuring it belongs to the given user."""
    stmt = (
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.user_id == user_id)
        .options(selectinload(Workflow.active_version))  # type: ignore
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def update_workflow(
    session: AsyncSession, existing_workflow: Workflow, workflow_updates: WorkflowUpdate
) -> Workflow:
    """Apply partial updates to a workflow instance and save."""
    update_data = workflow_updates.model_dump(exclude_unset=True)

    if (
        update_data.get("cron") is not None
        and update_data.get("cron") != existing_workflow.cron
    ):
        try:
            next_run_date = get_next_run_date(update_data["cron"])
        except ValueError as e:
            raise ValueError("Invalid cron expression") from e
        update_data["next_run_at"] = next_run_date

    changed = False
    if existing_workflow.active_version is not None:
        if update_data.get("definition") is not None:
            changed = True
            existing_workflow.active_version.definition = update_data["definition"]
        if update_data.get("execution_plan") is not None:
            changed = True
            existing_workflow.active_version.execution_plan = update_data[
                "execution_plan"
            ]

    update_data = workflow_updates.model_dump(
        exclude_unset=True, exclude={"definition", "execution_plan"}
    )

    for field, value in update_data.items():
        setattr(existing_workflow, field, value)
    existing_workflow.updated_at = datetime.now()
    session.add(existing_workflow)

    if changed:
        session.add(existing_workflow.active_version)
    await session.commit()
    await session.refresh(existing_workflow)
    await session.refresh(existing_workflow.active_version)
    return existing_workflow


async def get_due_workflows(session: AsyncSession) -> list[Workflow]:
    """Retrieve all workflows that are scheduled and next_run_at <= now()."""
    stmt = select(Workflow).where(
        Workflow.cron is not None,
        Workflow.status == WorkflowStatus.PUBLISHED,
        Workflow.next_run_at is not None
        and Workflow.next_run_at <= datetime.now(tz=timezone("UTC")),
    )
    result = await session.execute(stmt)
    workflows = [workflow for workflow in result.scalars().all()]
    return workflows
