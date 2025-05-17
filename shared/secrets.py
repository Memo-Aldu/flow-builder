"""
AWS Secrets Manager utility functions.
"""
import json
import os
import re

import boto3
from botocore.exceptions import ClientError


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
        "region_name": os.getenv("AWS_REGION", "us-east-1"),
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


def create_secret(secret_name: str, secret_value: str) -> str:
    """
    Create a new secret in Secrets Manager
    """
    secrets_client = get_secrets_client()
    try:
        response = secrets_client.create_secret(
            Name=sanitize_secret_name(secret_name),
            SecretString=secret_value,
        )
        return response["ARN"]
    except ClientError as e:
        print(f"Error creating secret: {e}")
        raise RuntimeError(f"Failed to create secret in AWS: {e}") from e


def delete_secret(secret_arn: str) -> bool:
    """
    Delete a secret from Secrets Manager
    """
    secrets_client = get_secrets_client()
    try:
        secrets_client.delete_secret(
            SecretId=secret_arn, ForceDeleteWithoutRecovery=True
        )
        return True
    except ClientError as e:
        print(f"Error deleting secret: {e}")
        raise RuntimeError(f"Failed to delete secret from AWS: {e}") from e


def get_secret_value(secret_arn: str) -> str:
    """
    Retrieve the secret from AWS Secrets Manager using the ARN.
    """
    secrets_client = get_secrets_client()
    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        if "SecretString" in response:
            return response["SecretString"]
        raise ValueError("Secret is in binary form - not supported in this example.")
    except ClientError as e:
        raise RuntimeError(f"Failed to retrieve secret from AWS: {e}") from e


def get_database_credentials(secret_arn: str) -> dict:
    """
    Get database credentials from Secrets Manager and return as a dictionary.
    """
    try:
        secret_string = get_secret_value(secret_arn)
        return json.loads(secret_string)
    except Exception as e:
        print(f"Error getting database credentials: {e}")
        raise RuntimeError(f"Failed to get database credentials: {e}") from e
