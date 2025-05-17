from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models import Credential, CredentialCreate


async def create_credential(
    session: AsyncSession,
    user_id: UUID,
    secret_id_or_arn: str,
    credential_data: CredentialCreate,
    is_db_secret: bool = False,
) -> Credential:
    """
    Create a new credential record.

    Args:
        session: Database session
        user_id: ID of the user who owns this credential
        secret_id_or_arn: ID or ARN of the secret
        credential_data: Data for the credential
        is_db_secret: Whether this credential uses database storage

    Returns:
        The created Credential object
    """
    new_credential = Credential(
        **credential_data.model_dump(),
        user_id=user_id,
        secret_arn=secret_id_or_arn,
        is_db_secret=is_db_secret
    )
    session.add(new_credential)
    await session.commit()
    await session.refresh(new_credential)
    return new_credential


async def delete_credential(session: AsyncSession, credential: Credential) -> None:
    await session.delete(credential)
    await session.commit()
