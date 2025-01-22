import os
import boto3


def get_sqs_client():
    """
    Returns a configured SQS client.
    """
    return boto3.client(
        "sqs",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        endpoint_url=os.getenv(
            "SQS_ENDPOINT_URL", "http://sqs.us-east-1.localhost.localstack.cloud:4566"
        ),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
    )
