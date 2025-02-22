from enum import Enum
from uuid import UUID
from typing import Optional, List

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ExecutionPhase, ExecutionPhaseUpdate, ExecutionPhaseCreate


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    STARTED_AT = "started_at"
    COMPLETED_AT = "completed_at"
    CREDITS_CONSUMED = "credits_consumed"
    STATUS = "status"
    NAME = "name"
    number = "number"


async def get_phase_by_id_and_user(
    session: AsyncSession, phase_id: UUID, user_id: UUID
) -> Optional[ExecutionPhase]:
    """Retrieve a phase by its ID"""
    stmt = select(ExecutionPhase).where(
        ExecutionPhase.id == phase_id, ExecutionPhase.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_phases_by_execution_and_user(
    session: AsyncSession,
    execution_id: UUID,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.STARTED_AT,
    order: SortOrder = SortOrder.DESC,
) -> List[ExecutionPhase]:
    """Retrieve all phases for a given execution"""
    stmt = (
        select(ExecutionPhase)
        .where(
            ExecutionPhase.workflow_execution_id == execution_id,
            ExecutionPhase.user_id == user_id,
        )
        .order_by(
            getattr(ExecutionPhase, sort).desc()
            if order == "desc"
            else getattr(ExecutionPhase, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [phase for phase in result.scalars().all()]


async def create_phase(
    session: AsyncSession,
    execution_id: UUID,
    user_id: UUID,
    phase_data: ExecutionPhaseCreate,
) -> ExecutionPhase:
    """Create a new phase for a given execution"""
    new_phase = ExecutionPhase(
        **phase_data.model_dump(exclude={"workflow_execution_id", "user_id"}),
        workflow_execution_id=execution_id,
        user_id=user_id
    )
    session.add(new_phase)
    await session.commit()
    await session.refresh(new_phase)
    return new_phase


async def update_phase(
    session: AsyncSession, phase: ExecutionPhase, phase_updates: ExecutionPhaseUpdate
) -> ExecutionPhase:
    """Apply partial updates to a phase"""
    update_data = phase_updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(phase, field, value)
    session.add(phase)
    await session.commit()
    await session.refresh(phase)
    return phase


async def delete_phase(session: AsyncSession, phase: ExecutionPhase) -> None:
    """Delete a phase"""
    await session.delete(phase)
    await session.commit()
