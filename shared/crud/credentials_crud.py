from enum import Enum
from uuid import UUID
from typing import List, Optional

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import Credential


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    CREATED_AT = "created_at"
    NAME = "name"


async def get_credential_by_id(
    session: AsyncSession, credential_id: UUID
) -> Optional[Credential]:
    stmt = select(Credential).where(Credential.id == credential_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_credential_by_id_and_user(
    session: AsyncSession, credential_id: UUID, user_id: UUID
) -> Optional[Credential]:
    stmt = select(Credential).where(
        Credential.id == credential_id, Credential.user_id == user_id
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def list_credentials_for_user(
    session: AsyncSession,
    user_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.CREATED_AT,
    order: SortOrder = SortOrder.DESC,
) -> List[Credential]:
    stmt = (
        select(Credential)
        .where(Credential.user_id == user_id)
        .order_by(
            getattr(Credential, sort).desc()
            if order == "desc"
            else getattr(Credential, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )

    result = await session.execute(stmt)

    return [credential for credential in result.scalars().all()]
