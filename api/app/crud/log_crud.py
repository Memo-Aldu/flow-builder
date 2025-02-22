from enum import Enum
from uuid import UUID
from typing import List, Optional

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ExecutionLog


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    CREATED_AT = "timestamp"
    LEVEL = "log_level"


async def get_log_by_id(session: AsyncSession, log_id: UUID) -> Optional[ExecutionLog]:
    """Retrieve a single log by its ID."""
    stmt = select(ExecutionLog).where(ExecutionLog.id == log_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_logs_by_execution_phase_id(
    session: AsyncSession,
    execution_phase_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
) -> List[ExecutionLog]:
    """Retrieve all logs for a given execution phase."""
    stmt = (
        select(ExecutionLog)
        .where(ExecutionLog.execution_phase_id == execution_phase_id)
        .order_by(
            getattr(ExecutionLog, sort).desc()
            if order == "desc"
            else getattr(ExecutionLog, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [log for log in result.scalars().all()]
