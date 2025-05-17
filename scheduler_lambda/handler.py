import os
import json
import asyncio
from typing import Optional
from datetime import datetime, timezone

from shared.db import create_lambda_engine_and_session
from shared.cron import get_next_run_date
from shared.sqs import get_sqs_client, send_message
from botocore.exceptions import ClientError
from shared.models import WorkflowUpdate, WorkflowExecutionCreate, ExecutionTrigger
from shared.logging import get_logger, setup_logging
from shared.crud.workflow_crud import get_due_workflows, update_workflow
from shared.crud.execution_crud import create_execution

setup_logging()
logger = get_logger(__name__)

sqs_client = get_sqs_client()
WORKFLOW_QUEUE_URL = os.getenv(
    "SQS_URL",
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue",
)


def lambda_handler(event, context) -> dict[str, str]:
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(main())
    finally:
        loop.close()
    return result


async def main() -> dict[str, str]:
    """
    Query DB for all workflows whose next_run_at <= now().
    For each, create a new execution record and send SQS message.
    Update next_run_at to the next cron occurrence.
    """
    engine, SessionLocal = create_lambda_engine_and_session()
    async with SessionLocal() as session:
        workflows = await get_due_workflows(session)
        logger.info("Found %s due workflows.", len(workflows))
        if not workflows:
            return {"message": "No due workflows found."}

        for wf in workflows:
            exec_in = WorkflowExecutionCreate(
                workflow_id=wf.id, trigger=ExecutionTrigger.SCHEDULED
            )
            logger.info("Creating execution for workflow %s", wf.id)
            new_execution = await create_execution(session, wf.user_id, exec_in)

            message_body = {
                "execution_id": str(new_execution.id),
                "workflow_id": str(new_execution.workflow_id),
                "user_id": str(new_execution.user_id),
                "trigger": new_execution.trigger,
                "status": new_execution.status,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            }
            try:
                # Use our new send_message function
                send_message(
                    queue_url=WORKFLOW_QUEUE_URL,
                    message_body=json.dumps(message_body),
                )
            except Exception as e:
                logger.warning("Failed to send message to SQS: %s", e)

            next_run: Optional[datetime] = None
            if wf.cron:
                try:
                    next_run = get_next_run_date(wf.cron)
                except ValueError:
                    logger.warning("Invalid cron expression: %s", wf.cron)

            await update_workflow(session, wf, WorkflowUpdate(next_run_at=next_run))

    await engine.dispose()
    return {"message": f"Processed {len(workflows)} workflow(s)."}
