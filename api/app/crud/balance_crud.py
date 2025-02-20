from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from shared.models import UserBalance


async def create_balance(
    session: AsyncSession, user_id: UUID, balance: UserBalance
) -> UserBalance:
    new_balance = UserBalance(
        user_id=user_id, **balance.model_dump(exclude={"user_id"})
    )
    session.add(new_balance)
    await session.commit()
    await session.refresh(new_balance)
    return new_balance


async def get_balance_by_user_id(session: AsyncSession, user_id: UUID) -> UserBalance:
    stmt = select(UserBalance).where(UserBalance.user_id == user_id)
    result = await session.execute(stmt)

    balance = result.scalars().first()
    if balance is None:
        return await create_balance(session, user_id, UserBalance(user_id=user_id))
    return balance
