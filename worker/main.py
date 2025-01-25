import os
import json
import asyncio
from uuid import UUID
from typing import NoReturn
from datetime import datetime
from croniter import croniter

from worker import logger
from worker.runner.workflow_runner import WorkflowRunner

from shared.db import async_session
from shared.sqs import get_sqs_client
from shared.models import WorkflowUpdate
from shared.crud.execution_crud import get_execution_by_id_and_user
from shared.crud.workflow_crud import get_workflow_by_id_and_user, update_workflow


WORKFLOW_QUEUE_URL = os.getenv(
    "WORKFLOW_QUEUE_URL",
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue",
)

sqs_client = get_sqs_client()


async def process_message(message_body: dict) -> None:
    """Handle a single SQS message's content."""
    workflow_id_str = message_body.get("workflow_id")
    user_id_str = message_body.get("user_id")
    execution_id_str = message_body.get("execution_id")

    if not workflow_id_str or not user_id_str or not execution_id_str:
        logger.warning("Missing required fields in message: %s", message_body)
        return

    workflow_id = UUID(workflow_id_str)
    user_id = UUID(user_id_str)
    execution_id = UUID(execution_id_str)

    async with async_session() as session:
        workflow = await get_workflow_by_id_and_user(session, workflow_id, user_id)
        if not workflow:
            logger.warning("Workflow %s not found for user %s", workflow_id, user_id)
            return

        execution = await get_execution_by_id_and_user(session, execution_id, user_id)
        if not execution:
            logger.warning("Execution %s not found for user %s", execution_id, user_id)
            return

        logger.info(
            "Processing workflow %s for execution %s", workflow_id, execution_id
        )

        runner = WorkflowRunner(session)
        status = await runner.run_workflow(workflow, execution)

        next_run_at = None
        if workflow.cron:
            cron = croniter(workflow.cron, datetime.now())
            next_run_at = cron.get_next(datetime)

        await update_workflow(
            session,
            workflow,
            WorkflowUpdate(
                last_run_id=execution_id,
                last_run_status=status,
                last_run_at=datetime.now(),
                next_run_at=next_run_at,
            ),
        )


async def poll_sqs() -> NoReturn:
    """Continuously poll SQS, process messages, and delete them."""
    logger.info("Starting SQS polling loop...")

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
                logger.error("Failed to parse message body: %s", body_str)
                continue

            await process_message(body)

            if receipt_handle:
                sqs_client.delete_message(
                    QueueUrl=WORKFLOW_QUEUE_URL, ReceiptHandle=receipt_handle
                )
                logger.info("Deleted message with receipt handle %s", receipt_handle)


async def run_worker() -> None:
    """Entry point for the async worker."""
    await poll_sqs()


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        logger.info("Shutting down worker...")
