from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ExecutionLog, ExecutionLogCreate


async def create_log(
    session: AsyncSession, log_data: ExecutionLogCreate
) -> ExecutionLog:
    """ Create a new execution log record. """
    new_log = ExecutionLog(**log_data.model_dump())
    session.add(new_log)
    await session.commit()
    await session.refresh(new_log)
    return new_log
