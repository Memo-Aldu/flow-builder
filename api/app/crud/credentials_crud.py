from datetime import datetime
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models import Credential, CredentialCreate, CredentialUpdate


async def create_credential(
    session: AsyncSession, user_id: UUID, credential_data: CredentialCreate
) -> Credential:
    new_credential = Credential(**credential_data.model_dump(), user_id=user_id)
    session.add(new_credential)
    await session.commit()
    await session.refresh(new_credential)
    return new_credential


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


async def update_credential(
    session: AsyncSession, credential: Credential, updates: CredentialUpdate
) -> Credential:
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(credential, field, value)
    session.add(credential)
    await session.commit()
    await session.refresh(credential)
    return credential


async def delete_credential(session: AsyncSession, credential: Credential) -> None:
    await session.delete(credential)
    await session.commit()
