from uuid import UUID
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from shared.models import (
    WorkflowExecution,
    WorkflowExecutionCreate,
)


async def create_execution(
    session: AsyncSession, user_id: UUID, exec_data: WorkflowExecutionCreate
) -> WorkflowExecution:
    """Create a new workflow execution record."""
    new_execution = WorkflowExecution(**exec_data.model_dump(), user_id=user_id)
    session.add(new_execution)
    await session.commit()
    await session.refresh(new_execution)
    return new_execution


async def list_executions_for_user(
    session: AsyncSession, user_id: UUID
) -> List[WorkflowExecution]:
    stmt = select(WorkflowExecution).where(WorkflowExecution.user_id == user_id)
    result = await session.execute(stmt)
    return [execution for execution in result.scalars().all()]


async def delete_execution(session: AsyncSession, execution: WorkflowExecution) -> None:
    await session.delete(execution)
    await session.commit()
