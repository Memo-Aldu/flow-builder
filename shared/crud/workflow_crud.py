from uuid import UUID
from typing import Optional
from datetime import datetime

from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from shared.cron import get_next_run_date
from shared.models import (
    Workflow,
    WorkflowUpdate,
)


async def get_workflow_by_id_and_user(
    session: AsyncSession, workflow_id: UUID, user_id: UUID
) -> Optional[Workflow]:
    """Fetch a workflow by ID, ensuring it belongs to the given user."""
    stmt = (
        select(Workflow).where(Workflow.id == workflow_id, Workflow.user_id == user_id)
        # Pass the relationship name as a string
        .options(selectinload(Workflow.active_version))  # type: ignore
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def update_workflow(
    session: AsyncSession, existing_workflow: Workflow, workflow_updates: WorkflowUpdate
) -> Workflow:
    """Apply partial updates to a workflow instance and save."""
    update_data = workflow_updates.model_dump(
        exclude_unset=True, exclude={"definition", "execution_plan"}
    )
    print(update_data.get("cron"), existing_workflow.cron)

    if (
        update_data.get("cron") is not None
        and update_data.get("cron") != existing_workflow.cron
    ):
        try:
            next_run_date = get_next_run_date(update_data["cron"])
            print("next date", next_run_date)
        except ValueError as e:
            raise ValueError("Invalid cron expression") from e
        update_data["next_run_at"] = next_run_date

    for field, value in update_data.items():
        setattr(existing_workflow, field, value)
    existing_workflow.updated_at = datetime.now()
    session.add(existing_workflow)
    await session.commit()
    await session.refresh(existing_workflow)
    return existing_workflow
