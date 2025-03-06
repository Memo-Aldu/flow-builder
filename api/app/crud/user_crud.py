from typing import Optional
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models import User


async def get_local_user_by_clerk_id(
    session: AsyncSession, clerk_id: str
) -> Optional[User]:
    stmt = select(User).where(User.clerk_id == clerk_id)
    result = await session.execute(stmt)
    local_user = result.scalars().first()
    return local_user


async def create_local_user(
    session: AsyncSession, clerk_id: str, email: str, username: str
) -> User:
    local_user = User(clerk_id=clerk_id, email=email, username=username)
    session.add(local_user)
    await session.commit()
    await session.refresh(local_user)
    return local_user
