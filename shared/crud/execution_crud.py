from uuid import UUID
from typing import Optional
from datetime import datetime

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    WorkflowExecution,
    WorkflowExecutionCreate,
    WorkflowExecutionUpdate,
)


async def get_execution_by_id_and_user(
    session: AsyncSession, execution_id: UUID, user_id: UUID
) -> Optional[WorkflowExecution]:
    stmt = select(WorkflowExecution).where(
        WorkflowExecution.id == execution_id, WorkflowExecution.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def update_execution(
    session: AsyncSession,
    execution: WorkflowExecution,
    exec_updates: WorkflowExecutionUpdate,
) -> WorkflowExecution:
    """Apply partial updates to an execution."""
    update_data = exec_updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(execution, field, value)
    execution.updated_at = datetime.now()
    session.add(execution)
    await session.commit()
    await session.refresh(execution)
    return execution


async def create_execution(
    session: AsyncSession, user_id: UUID, exec_data: WorkflowExecutionCreate
) -> WorkflowExecution:
    """Create a new workflow execution record."""
    new_execution = WorkflowExecution(**exec_data.model_dump(), user_id=user_id)
    session.add(new_execution)
    await session.commit()
    await session.refresh(new_execution)
    return new_execution
