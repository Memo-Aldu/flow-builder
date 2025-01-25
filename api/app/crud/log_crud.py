from uuid import UUID
from typing import List, Optional

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ExecutionLog


async def get_log_by_id(session: AsyncSession, log_id: UUID) -> Optional[ExecutionLog]:
    """Retrieve a single log by its ID."""
    stmt = select(ExecutionLog).where(ExecutionLog.id == log_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_logs_by_execution_phase_id(
    session: AsyncSession, execution_phase_id: UUID
) -> List[ExecutionLog]:
    """Retrieve all logs for a given execution phase."""
    stmt = select(ExecutionLog).where(
        ExecutionLog.execution_phase_id == execution_phase_id
    )
    result = await session.execute(stmt)
    return [log for log in result.scalars().all()]
