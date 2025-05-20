"""
Secret management utilities supporting both AWS Secrets Manager and database storage.
"""

import json
import os
import re
import uuid
import boto3
import asyncio
from typing import Optional, Any
from botocore.exceptions import ClientError

from shared.crypto import encrypt, decrypt
from shared.crud.db_secret_crud import create_db_secret as db_create_secret


USE_DB_SECRETS = os.getenv("USE_DB_SECRETS", "false").lower() == "true"


def get_secrets_client():
    """
    Returns a configured Secrets Manager client.

    In local development:
    - Uses SECRETS_ENDPOINT_URL if specified (for LocalStack)
    - Uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (defaults to "test")

    In deployed environments:
    - Uses default AWS endpoints
    - Uses IAM role credentials automatically
    """
    config = {
        "service_name": "secretsmanager",
        "region_name": os.getenv(
            "CUSTOM_AWS_REGION", os.getenv("AWS_REGION", "us-east-1")
        ),
    }

    endpoint_url = os.getenv("SECRETS_ENDPOINT_URL")
    if endpoint_url:
        config["endpoint_url"] = endpoint_url

        config["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID", "test")
        config["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

    return boto3.client(**config)


def sanitize_secret_name(name: str) -> str:
    """
    Sanitize the secret name to meet AWS requirements.
    """
    sanitized_name = re.sub(r"[^a-zA-Z0-9\-_+=.@/]", "-", name.strip())
    if not sanitized_name:
        raise ValueError("Secret name is invalid after sanitization.")
    return sanitized_name


def use_db_secrets() -> bool:
    """
    Determine whether to use database secrets or AWS Secrets Manager.

    Returns:
        True if database secrets should be used, False for AWS Secrets Manager
    """
    return USE_DB_SECRETS


def create_aws_secret(secret_name: str, secret_value: str) -> str:
    """
    Create a new secret in AWS Secrets Manager.

    Args:
        secret_name: Name for the secret
        secret_value: Value to store

    Returns:
        ARN of the created secret
    """
    secrets_client = get_secrets_client()
    try:
        response = secrets_client.create_secret(
            Name=sanitize_secret_name(secret_name),
            SecretString=secret_value,
        )
        return response["ARN"]
    except ClientError as e:
        print(f"Error creating secret in AWS: {e}")
        raise RuntimeError(f"Failed to create secret in AWS: {e}") from e


def delete_aws_secret(secret_arn: str) -> bool:
    """
    Delete a secret from AWS Secrets Manager.

    Args:
        secret_arn: ARN of the secret to delete

    Returns:
        True if successful
    """
    secrets_client = get_secrets_client()
    try:
        secrets_client.delete_secret(
            SecretId=secret_arn, ForceDeleteWithoutRecovery=True
        )
        return True
    except ClientError as e:
        print(f"Error deleting secret from AWS: {e}")
        raise RuntimeError(f"Failed to delete secret from AWS: {e}") from e


def get_aws_secret_value(secret_arn: str) -> str:
    """
    Retrieve a secret from AWS Secrets Manager.

    Args:
        secret_arn: ARN of the secret to retrieve

    Returns:
        The secret value as a string
    """
    secrets_client = get_secrets_client()
    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        if "SecretString" in response:
            return response["SecretString"]
        raise ValueError("Secret is in binary form - not supported in this example.")
    except ClientError as e:
        raise RuntimeError(f"Failed to retrieve secret from AWS: {e}") from e


async def create_db_secret(session, user_id: uuid.UUID, secret_value: str) -> uuid.UUID:
    """
    Create a new encrypted secret in the database.

    Args:
        session: Database session
        user_id: ID of the user who owns this secret
        secret_value: Value to encrypt and store

    Returns:
        ID of the created secret
    """
    nonce, encrypted_value = encrypt(secret_value)

    # Store in database
    db_secret = await db_create_secret(
        session=session,
        user_id=user_id,
        encrypted_value=encrypted_value,
        nonce=nonce,
    )

    return db_secret.id


async def delete_db_secret(session, secret_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """
    Delete a secret from the database.

    Args:
        session: Database session
        secret_id: ID of the secret to delete
        user_id: ID of the user who owns the secret

    Returns:
        True if successful
    """
    from shared.crud.db_secret_crud import (
        get_db_secret_by_id_and_user,
        delete_db_secret as db_delete_secret,
    )

    # Get the secret
    db_secret = await get_db_secret_by_id_and_user(session, secret_id, user_id)
    if not db_secret:
        raise ValueError(f"Secret {secret_id} not found for user {user_id}")

    # Delete the secret
    await db_delete_secret(session, db_secret)
    return True


async def get_db_secret_value(session, secret_id: uuid.UUID) -> str:
    """
    Retrieve and decrypt a secret from the database.

    Args:
        session: Database session
        secret_id: ID of the secret to retrieve

    Returns:
        The decrypted secret value
    """
    from shared.crud.db_secret_crud import get_db_secret_by_id

    # Get the secret
    db_secret = await get_db_secret_by_id(session, secret_id)
    if not db_secret:
        raise ValueError(f"Secret {secret_id} not found")

    # Decrypt the secret value
    decrypted_value = decrypt(db_secret.nonce, db_secret.encrypted_value)

    return decrypted_value


# Unified interface functions
async def create_secret(
    session, secret_name: str, secret_value: str, user_id: Optional[uuid.UUID] = None
) -> str:
    """
    Create a new secret using the configured storage method.

    Args:
        session: Database session (required for DB storage)
        secret_name: Name for the secret
        secret_value: Value to store
        user_id: ID of the user who owns this secret (required for DB storage)

    Returns:
        ARN or ID of the created secret
    """
    if use_db_secrets():
        if user_id is None:
            raise ValueError("user_id is required for database secret storage")
        secret_id = await create_db_secret(session, user_id, secret_value)
        # Return as string with db: prefix to distinguish from AWS ARNs
        return f"db:{secret_id}"
    else:
        return create_aws_secret(secret_name, secret_value)


async def delete_secret(
    session, secret_id_or_arn: str, user_id: Optional[uuid.UUID] = None
) -> bool:
    """
    Delete a secret using the appropriate storage method.

    Args:
        session: Database session (required for DB storage)
        secret_id_or_arn: ID or ARN of the secret to delete
        user_id: ID of the user who owns the secret (required for DB storage)

    Returns:
        True if successful
    """
    if secret_id_or_arn.startswith("db:"):
        if user_id is None:
            raise ValueError("user_id is required for database secret deletion")
        # Extract UUID from the db: prefix format
        secret_id = uuid.UUID(secret_id_or_arn[3:])
        return await delete_db_secret(session, secret_id, user_id)
    else:
        return delete_aws_secret(secret_id_or_arn)


async def retrieve_secret(secret_id_or_arn: str, session: Optional[Any] = None) -> str:
    """
    Unified interface to retrieve a secret from any storage backend.

    This function automatically detects the storage type from the secret_id_or_arn
    and handles both async and sync contexts appropriately.

    Args:
        secret_id_or_arn: ID or ARN of the secret to retrieve
        session: Database session (required for DB storage)

    Returns:
        The secret value as a string
    """
    # Determine the storage type from the secret ID/ARN
    if secret_id_or_arn.startswith("db:"):
        if session is None:
            raise ValueError("Database session is required for DB secrets")

        # Extract UUID from the db: prefix format
        secret_id = uuid.UUID(secret_id_or_arn[3:])
        return await get_db_secret_value(session, secret_id)
    else:
        return get_aws_secret_value(secret_id_or_arn)


async def get_secret_value(session, secret_id_or_arn: str) -> str:
    """
    Retrieve a secret using the appropriate storage method.

    Args:
        session: Database session (required for DB storage)
        secret_id_or_arn: ID or ARN of the secret to retrieve

    Returns:
        The secret value
    """
    return await retrieve_secret(secret_id_or_arn, session)


def get_secret_value_sync(secret_id_or_arn: str) -> str:
    """
    Synchronous version of get_secret_value.

    This function will use the appropriate method based on the secret_id_or_arn.
    For DB secrets, it will run the async function in a new event loop.

    Args:
        secret_id_or_arn: ID or ARN of the secret to retrieve

    Returns:
        The secret value as a string
    """
    # For AWS secrets, use the direct sync method
    if not secret_id_or_arn.startswith("db:"):
        return get_aws_secret_value(secret_id_or_arn)

    # For DB secrets, we need to run the async function in a new event loop
    loop = asyncio.new_event_loop()
    try:
        # We need to create a session for DB access
        from shared.db import create_lambda_engine_and_session

        async def get_with_session():
            _, session_factory = create_lambda_engine_and_session()
            async with session_factory() as session:
                return await retrieve_secret(secret_id_or_arn, session)

        return loop.run_until_complete(get_with_session())
    finally:
        loop.close()


async def get_database_credentials(session, secret_id_or_arn: str) -> dict:
    """
    Get database credentials from the appropriate secret storage and return as a dictionary.

    Args:
        session: Database session (required for DB storage)
        secret_id_or_arn: ID or ARN of the secret to retrieve

    Returns:
        Dictionary containing database credentials
    """
    try:
        secret_string = await retrieve_secret(secret_id_or_arn, session)
        return json.loads(secret_string)
    except Exception as e:
        print(f"Error getting database credentials: {e}")
        raise RuntimeError(f"Failed to get database credentials: {e}") from e


def get_database_credentials_sync(secret_id_or_arn: str) -> dict:
    """
    Synchronous version of get_database_credentials.

    Args:
        secret_id_or_arn: ID or ARN of the secret to retrieve

    Returns:
        Dictionary containing database credentials
    """
    try:
        secret_string = get_secret_value_sync(secret_id_or_arn)
        return json.loads(secret_string)
    except Exception as e:
        print(f"Error getting database credentials: {e}")
        raise RuntimeError(f"Failed to get database credentials: {e}") from e
