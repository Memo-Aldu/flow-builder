from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from shared.models import UserBalance


async def decrement_balance(session: AsyncSession, user_id: UUID, amount: int) -> None:
    stmt = select(UserBalance).where(UserBalance.user_id == user_id)
    result = await session.execute(stmt)

    balance = result.scalars().first()
    if balance is None:
        raise ValueError("User balance not found")

    if balance.credits < amount:
        raise ValueError("Insufficient credits")

    balance.credits -= amount
    session.add(balance)
    await session.commit()
    await session.refresh(balance)
