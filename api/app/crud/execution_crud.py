from enum import Enum
from uuid import UUID
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from shared.models import (
    WorkflowExecution,
    WorkflowExecutionCreate,
)


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    STARTED_AT = "started_at"
    COMPLETED_AT = "completed_at"
    CREDITS_CONSUMED = "credits_consumed"
    STATUS = "status"
    TRIGGER = "trigger"


async def create_execution(
    session: AsyncSession, user_id: UUID, exec_data: WorkflowExecutionCreate
) -> WorkflowExecution:
    """Create a new workflow execution record."""
    new_execution = WorkflowExecution(**exec_data.model_dump(), user_id=user_id)
    session.add(new_execution)
    await session.commit()
    await session.refresh(new_execution)
    return new_execution


async def get_executions_for_user(
    session: AsyncSession,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
) -> List[WorkflowExecution]:
    """Retrieve all executions for a given user."""
    stmt = (
        select(WorkflowExecution)
        .where(WorkflowExecution.user_id == user_id)
        .order_by(
            getattr(WorkflowExecution, sort._value_).desc()
            if order == "desc"
            else getattr(WorkflowExecution, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [execution for execution in result.scalars().all()]


async def get_executions_by_workflow_id_and_user(
    session: AsyncSession,
    workflow_id: UUID,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: str = "created_at",
    order: str = "desc",
) -> List[WorkflowExecution]:
    """Retrieve all executions for a given workflow and user."""
    stmt = (
        select(WorkflowExecution)
        .where(
            WorkflowExecution.workflow_id == workflow_id,
            WorkflowExecution.user_id == user_id,
        )
        .order_by(
            getattr(WorkflowExecution, sort).desc()
            if order == "desc"
            else getattr(WorkflowExecution, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [execution for execution in result.scalars().all()]


async def delete_execution(session: AsyncSession, execution: WorkflowExecution) -> None:
    """Delete an execution."""
    await session.delete(execution)
    await session.commit()
