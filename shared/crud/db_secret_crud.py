"""
CRUD operations for database-stored encrypted secrets.
"""

from uuid import UUID
from typing import Optional, List

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import DbSecret


async def create_db_secret(
    session: AsyncSession,
    user_id: UUID,
    encrypted_value: bytes,
    nonce: bytes,
) -> DbSecret:
    """
    Create a new encrypted secret in the database.

    Args:
        session: Database session
        user_id: ID of the user who owns this secret
        encrypted_value: The encrypted secret value
        nonce: The nonce used for encryption

    Returns:
        The created DbSecret object
    """
    new_secret = DbSecret(
        user_id=user_id,
        encrypted_value=encrypted_value,
        nonce=nonce,
    )
    session.add(new_secret)
    await session.commit()
    await session.refresh(new_secret)
    return new_secret


async def get_db_secret_by_id(
    session: AsyncSession, secret_id: UUID
) -> Optional[DbSecret]:
    """
    Get a database secret by its ID.

    Args:
        session: Database session
        secret_id: ID of the secret to retrieve

    Returns:
        The DbSecret object if found, None otherwise
    """
    stmt = select(DbSecret).where(DbSecret.id == secret_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_db_secret_by_id_and_user(
    session: AsyncSession, secret_id: UUID, user_id: UUID
) -> Optional[DbSecret]:
    """
    Get a database secret by its ID and user ID.

    Args:
        session: Database session
        secret_id: ID of the secret to retrieve
        user_id: ID of the user who owns the secret

    Returns:
        The DbSecret object if found, None otherwise
    """
    stmt = select(DbSecret).where(DbSecret.id == secret_id, DbSecret.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalars().first()


async def delete_db_secret(session: AsyncSession, secret: DbSecret) -> None:
    """
    Delete a database secret.

    Args:
        session: Database session
        secret: The DbSecret object to delete
    """
    await session.delete(secret)
    await session.commit()


async def list_db_secrets_for_user(
    session: AsyncSession, user_id: UUID
) -> List[DbSecret]:
    """
    List all database secrets for a user.

    Args:
        session: Database session
        user_id: ID of the user whose secrets to list

    Returns:
        List of DbSecret objects
    """
    stmt = select(DbSecret).where(DbSecret.user_id == user_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())
