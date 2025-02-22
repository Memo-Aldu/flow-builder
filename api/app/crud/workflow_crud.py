from enum import Enum
from uuid import UUID
from typing import List

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    Workflow,
    WorkflowCreate,
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
    session: AsyncSession,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
) -> List[Workflow]:
    """Return all workflows owned by a specific user."""
    stmt = (
        select(Workflow)
        .where(Workflow.user_id == user_id)
        .order_by(
            getattr(Workflow, sort).desc()
            if order == "desc"
            else getattr(Workflow, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [workflow for workflow in result.scalars().all()]


async def delete_workflow(session: AsyncSession, workflow: Workflow) -> None:
    """Delete a workflow from the DB."""
    await session.delete(workflow)
    await session.commit()
