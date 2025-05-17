"""
AWS SQS utility functions.
"""
import os

import boto3
from botocore.exceptions import ClientError


def get_sqs_client():
    """
    Returns a configured SQS client.

    In local development:
    - Uses SQS_ENDPOINT_URL (defaults to LocalStack)
    - Uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (defaults to "test")

    In deployed environments:
    - Uses default AWS endpoints
    - Uses IAM role credentials automatically
    """
    # Base configuration with region
    config = {
        "service_name": "sqs",
        "region_name": os.getenv("AWS_REGION", "us-east-1"),
    }

    endpoint_url = os.getenv("SQS_ENDPOINT_URL")
    if endpoint_url:
        config["endpoint_url"] = endpoint_url

        config["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID", "test")
        config["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

    return boto3.client(**config)


def send_message(queue_url, message_body, message_attributes=None):
    """
    Send a message to an SQS queue.
    """
    sqs_client = get_sqs_client()
    try:
        if message_attributes:
            response = sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=message_body,
                MessageAttributes=message_attributes
            )
        else:
            response = sqs_client.send_message(
                QueueUrl=queue_url,
                MessageBody=message_body
            )
        return response['MessageId']
    except ClientError as e:
        print(f"Error sending message to SQS: {e}")
        raise RuntimeError(f"Failed to send message to SQS: {e}") from e


def receive_messages(queue_url, max_number=10, wait_time=20, visibility_timeout=30):
    """
    Receive messages from an SQS queue.
    """
    sqs_client = get_sqs_client()
    try:
        response = sqs_client.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=max_number,
            WaitTimeSeconds=wait_time,
            VisibilityTimeout=visibility_timeout
        )
        return response.get('Messages', [])
    except ClientError as e:
        print(f"Error receiving messages from SQS: {e}")
        raise RuntimeError(f"Failed to receive messages from SQS: {e}") from e


def delete_message(queue_url, receipt_handle):
    """
    Delete a message from an SQS queue.
    """
    sqs_client = get_sqs_client()
    try:
        sqs_client.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=receipt_handle
        )
        return True
    except ClientError as e:
        print(f"Error deleting message from SQS: {e}")
        raise RuntimeError(f"Failed to delete message from SQS: {e}") from e
