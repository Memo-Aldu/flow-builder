from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models import Credential, CredentialCreate, CredentialUpdate


async def create_credential(
    session: AsyncSession, user_id: UUID, credential_data: CredentialCreate
) -> Credential:
    new_credential = Credential(**credential_data.model_dump(), user_id=user_id)
    session.add(new_credential)
    await session.commit()
    await session.refresh(new_credential)
    return new_credential


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
