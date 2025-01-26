import os
import re
import boto3

from botocore.exceptions import ClientError


secrets_client = boto3.client(
        "secretsmanager",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        endpoint_url=os.getenv(
            "SQS_ENDPOINT_URL", "http://sqs.us-east-1.localhost.localstack.cloud:4566"
        ),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
    )


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
    try:
        response = secrets_client.create_secret(
            Name=sanitize_secret_name(secret_name),
            SecretString=secret_value,
        )
        return response["ARN"]
    except ClientError as e:
        print(f"Error creating secret: {e}")
        raise RuntimeError(f"Failed to create secret in AWS: {e}")
    
    
def delete_secret(secret_arn: str) -> bool:
    try:
        secrets_client.delete_secret(
            SecretId=secret_arn,
            ForceDeleteWithoutRecovery=True
        )
        return True
    except ClientError as e:
        print(f"Error deleting secret: {e}")
        raise RuntimeError(f"Failed to delete secret from AWS: {e}")
    
    
def get_secret_value(secret_arn: str) -> str:
    """
    Retrieve the secret from AWS Secrets Manager using the ARN.
    """
    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        if "SecretString" in response:
            return response["SecretString"]
        raise ValueError("Secret is in binary form - not supported in this example.")
    except ClientError as e:
        raise RuntimeError(f"Failed to retrieve secret from AWS: {e}")