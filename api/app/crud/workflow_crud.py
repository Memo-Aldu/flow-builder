from uuid import UUID
from typing import List

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    Workflow,
    WorkflowCreate,
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


async def get_workflows_for_user(
    session: AsyncSession, user_id: UUID
) -> List[Workflow]:
    """Return all workflows owned by a specific user."""
    stmt = select(Workflow).where(Workflow.user_id == user_id)
    result = await session.execute(stmt)
    return [workflow for workflow in result.scalars().all()]


async def delete_workflow(session: AsyncSession, workflow: Workflow) -> None:
    """Delete a workflow from the DB."""
    await session.delete(workflow)
    await session.commit()
