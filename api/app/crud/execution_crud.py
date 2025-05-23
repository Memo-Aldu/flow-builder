from datetime import datetime
from enum import Enum
from uuid import UUID
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload

from shared.models import (
    ExecutionPhase,
    WorkflowExecution,
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


async def get_execution_stats(
    session: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime
) -> List[WorkflowExecution]:
    """Retrieve all executions for a given user within a date range."""
    stmt = (
        select(WorkflowExecution)
        .where(
            WorkflowExecution.user_id == user_id,
            WorkflowExecution.created_at >= start_date,
            WorkflowExecution.created_at <= end_date,
        )
        .options(selectinload(WorkflowExecution.phases))  # type: ignore
    )
    result = await session.execute(stmt)
    return [execution for execution in result.scalars().all()]


async def delete_execution(session: AsyncSession, execution: WorkflowExecution) -> None:
    """Delete an execution."""
    await session.delete(execution)
    await session.commit()
