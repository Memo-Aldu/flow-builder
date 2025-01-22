import os
import json
import asyncio
from uuid import UUID
from typing import NoReturn
from datetime import datetime

from shared.db import async_session
from shared.sqs import get_sqs_client
from shared.crud.workflow_crud import (
    get_workflow_by_id_and_user,
)
from shared.crud.execution_crud import (
    get_execution_by_id_and_user,
    update_execution,
)
from shared.models import ExecutionStatus, WorkflowExecutionUpdate


WORKFLOW_QUEUE_URL = os.getenv(
    "WORKFLOW_QUEUE_URL",
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue",
)

sqs_client = get_sqs_client()


async def process_message(message_body: dict) -> None:
    """Handle a single SQS message's content."""
    workflow_id_str = message_body.get("workflow_id")
    user_id_str = message_body.get("user_id")

    if not workflow_id_str or not user_id_str:
        print("Message missing required fields, skipping:", message_body)
        return

    workflow_id = UUID(workflow_id_str)
    user_id = UUID(user_id_str)

    async with async_session() as session:
        workflow = await get_workflow_by_id_and_user(session, workflow_id, user_id)
        if not workflow:
            print(f"Workflow {workflow_id} not found for user {user_id}.")
            return

        # Log workflow execution
        print(f"[{datetime.now()}] Running workflow #{workflow_id} for user #{user_id}")

        # Simulate updating execution status
        execution_id = message_body.get("execution_id")
        if execution_id:
            execution_id_uuid = UUID(execution_id)
            execution = await get_execution_by_id_and_user(
                session, execution_id_uuid, user_id
            )
            if execution:
                await update_execution(
                    session,
                    execution,
                    WorkflowExecutionUpdate(status=ExecutionStatus.RUNNING),
                )
                print(f"Updated execution {execution_id} to RUNNING status.")
        # TODO: Add your workflow execution logic here
        # Set WorkflowExecution status to SUCCESS or FAILURE
        # Log to database
        # Set WorkFlow last_run_id, status, and last_run_at, next_run_at


async def poll_sqs() -> NoReturn:
    """Continuously poll SQS, process messages, and delete them."""
    print("Worker started. Polling SQS...")

    while True:
        response = sqs_client.receive_message(
            QueueUrl=WORKFLOW_QUEUE_URL, MaxNumberOfMessages=5, WaitTimeSeconds=20
        )

        messages = response.get("Messages", [])
        if not messages:
            continue

        for msg in messages:
            body_str = msg.get("Body", "{}")
            receipt_handle = msg.get("ReceiptHandle")

            try:
                body = json.loads(body_str)
            except json.JSONDecodeError:
                print("Failed to decode JSON:", body_str)
                # You might delete or re-queue the message
                continue

            # 3) Do your business logic
            await process_message(body)

            # 4) Delete the message to prevent reprocessing
            if receipt_handle:
                sqs_client.delete_message(
                    QueueUrl=WORKFLOW_QUEUE_URL, ReceiptHandle=receipt_handle
                )
                print(f"Deleted message {msg['MessageId']} from queue.")


async def run_worker() -> None:
    """Entry point for the async worker."""
    await poll_sqs()


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        print("Worker shutting down gracefully...")
