from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models import Credential, CredentialCreate


async def create_credential(
    session: AsyncSession, user_id: UUID, secret_arn: str, credential_data: CredentialCreate
) -> Credential:
    new_credential = Credential(**credential_data.model_dump(), user_id=user_id, secret_arn=secret_arn)
    session.add(new_credential)
    await session.commit()
    await session.refresh(new_credential)
    return new_credential


async def delete_credential(session: AsyncSession, credential: Credential) -> None:
    await session.delete(credential)
    await session.commit()
