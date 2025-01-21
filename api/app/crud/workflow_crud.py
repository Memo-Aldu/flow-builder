from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Workflow,
    WorkflowCreate,
    WorkflowUpdate,
)


async def create_workflow(
    session: AsyncSession, user_id: UUID, workflow_data: WorkflowCreate
) -> Workflow:
    """Create a new workflow tied to a specific local user ID."""
    new_workflow = Workflow(user_id=user_id, **workflow_data.model_dump())
    session.add(new_workflow)
    await session.commit()
    await session.refresh(new_workflow)
    return new_workflow


async def get_workflow_by_id_and_user(
    session: AsyncSession, workflow_id: UUID, user_id: UUID
) -> Optional[Workflow]:
    """Fetch a workflow by ID, ensuring it belongs to the given user."""
    stmt = select(Workflow).where(
        Workflow.id == workflow_id, Workflow.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def list_workflows_for_user(
    session: AsyncSession, user_id: UUID
) -> List[Workflow]:
    """Return all workflows owned by a specific user."""
    stmt = select(Workflow).where(Workflow.user_id == user_id)
    result = await session.execute(stmt)
    return [workflow for workflow in result.scalars().all()]


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


async def delete_workflow(session: AsyncSession, workflow: Workflow) -> None:
    """Delete a workflow from the DB."""
    await session.delete(workflow)
    await session.commit()
