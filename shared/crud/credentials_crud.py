from uuid import UUID
from typing import List, Optional

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import Credential


async def get_credential_by_id_and_user(
    session: AsyncSession, credential_id: UUID, user_id: UUID
) -> Optional[Credential]:
    stmt = select(Credential).where(
        Credential.id == credential_id, Credential.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def list_credentials_for_user(
    session: AsyncSession, user_id: UUID
) -> List[Credential]:
    stmt = select(Credential).where(Credential.user_id == user_id)
    result = await session.execute(stmt)
    return [credential for credential in result.scalars().all()]
