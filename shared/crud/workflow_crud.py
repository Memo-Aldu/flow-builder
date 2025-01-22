from uuid import UUID
from typing import Optional
from datetime import datetime

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    Workflow,
    WorkflowUpdate,
)


async def get_workflow_by_id_and_user(
    session: AsyncSession, workflow_id: UUID, user_id: UUID
) -> Optional[Workflow]:
    """Fetch a workflow by ID, ensuring it belongs to the given user."""
    stmt = select(Workflow).where(
        Workflow.id == workflow_id, Workflow.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def update_workflow(
    session: AsyncSession, existing_workflow: Workflow, workflow_updates: WorkflowUpdate
) -> Workflow:
    """Apply partial updates to a workflow instance and save."""
    update_data = workflow_updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(existing_workflow, field, value)
    existing_workflow.updated_at = datetime.now()
    session.add(existing_workflow)
    await session.commit()
    await session.refresh(existing_workflow)
    return existing_workflow
