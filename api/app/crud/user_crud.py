from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User


async def get_local_user_by_clerk_id(session: AsyncSession, clerk_id: str) -> User:
    stmt = select(User).where(User.clerk_id == clerk_id)
    result = await session.execute(stmt)
    local_user = result.scalars().first()

    if not local_user:
        local_user = User(clerk_id=clerk_id)
        session.add(local_user)
        await session.commit()
        await session.refresh(local_user)

    return local_user
