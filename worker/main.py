import os
import sys
import json
import signal
import asyncio
import traceback

from uuid import UUID
from datetime import datetime

from pytz import timezone

from worker import logger
from worker.runner.workflow_runner import WorkflowRunner

from shared.sqs import receive_messages, delete_message
from shared.cron import get_next_run_date
from shared.models import ExecutionStatus, WorkflowUpdate
from shared.db import Session
from shared.crud.execution_crud import get_execution_by_id_and_user
from shared.crud.workflow_crud import get_workflow_by_id_and_user, update_workflow

WORKFLOW_QUEUE_URL = os.getenv(
    "WORKFLOW_QUEUE_URL",
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue",
)

# Configuration from environment variables
POLLING_MODE = os.getenv("POLLING_MODE", "false").lower() == "true"
EVENTBRIDGE_PIPES_MODE = os.getenv("EVENTBRIDGE_PIPES_MODE", "false").lower() == "true"
EXIT_AFTER_COMPLETION = os.getenv("EXIT_AFTER_COMPLETION", "false").lower() == "true"
MAX_POLL_MESSAGES = int(os.getenv("MAX_POLL_MESSAGES", "5"))
POLL_WAIT_TIME = int(os.getenv("POLL_WAIT_TIME", "20"))
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"

# Global flag for graceful shutdown
shutdown_requested = False


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

    async with Session() as session:
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

        await update_workflow(
            session,
            workflow,
            WorkflowUpdate(
                last_run_id=execution_id,
                last_run_status=ExecutionStatus.RUNNING,
                last_run_at=datetime.now(tz=timezone("US/Eastern")),
            ),
        )

        runner = WorkflowRunner(session)
        exec_status, wf_status = await runner.run_workflow(workflow, execution)

        next_run_at = None
        if workflow.cron:
            try:
                next_run_at = get_next_run_date(workflow.cron)
            except ValueError:
                logger.error("Invalid cron expression: %s", workflow.cron)

        await update_workflow(
            session,
            workflow,
            WorkflowUpdate(
                last_run_status=exec_status,
                last_run_at=datetime.now(tz=timezone("US/Eastern")),
                next_run_at=next_run_at,
                status=wf_status,
            ),
        )


async def poll_sqs() -> None:
    """Continuously poll SQS, process messages, and delete them."""
    logger.info(f"Starting SQS polling loop for queue: {WORKFLOW_QUEUE_URL}")

    while not shutdown_requested:
        try:
            messages = receive_messages(
                queue_url=WORKFLOW_QUEUE_URL,
                max_number=MAX_POLL_MESSAGES,
                wait_time=POLL_WAIT_TIME,
            )

            if not messages:
                logger.debug("No messages received from SQS queue")
                continue

            logger.info(f"Received {len(messages)} messages from SQS queue")

            for msg in messages:
                body_str = msg.get("Body", "{}")
                receipt_handle = msg.get("ReceiptHandle")

                try:
                    body = json.loads(body_str)
                    logger.info(f"Processing message: {json.dumps(body)[:200]}...")
                    await process_message(body)

                    # Delete the message after successful processing
                    if receipt_handle:
                        delete_message(
                            queue_url=WORKFLOW_QUEUE_URL, receipt_handle=receipt_handle
                        )
                        logger.info(
                            f"Deleted message with receipt handle {receipt_handle[:20]}..."
                        )
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse message body: {body_str[:200]}...")
                    # Delete invalid messages to avoid processing them repeatedly
                    if receipt_handle:
                        delete_message(
                            queue_url=WORKFLOW_QUEUE_URL, receipt_handle=receipt_handle
                        )
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    logger.error(f"Traceback: {traceback.format_exc()}")

        except Exception as e:
            logger.error(f"Error in SQS polling loop: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Wait a bit before retrying to avoid tight loops in case of persistent errors
            await asyncio.sleep(5)


async def process_eventbridge_pipes() -> None:
    """Process messages from EventBridge Pipes via environment variables."""
    logger.info("Starting worker in EventBridge Pipes mode...")

    if DEBUG_MODE:
        # Log all environment variables for debugging
        all_env_vars = {k: v for k, v in os.environ.items() if not k.startswith("AWS_")}
        logger.info(f"Environment variables: {json.dumps(all_env_vars)}")

    # Check for SQS message data in environment variables
    sqs_body = os.getenv("SQS_BODY", None)
    if sqs_body:
        logger.info("Found SQS message body in SQS_BODY environment variable")
        try:
            # Try to parse the body as JSON
            body_json = json.loads(sqs_body)
            logger.info(
                f"Successfully parsed SQS_BODY as JSON: {json.dumps(body_json)[:200]}..."
            )

            # Process the message directly
            await process_message(body_json)
            logger.info("Successfully processed message from SQS_BODY")
            return
        except json.JSONDecodeError:
            logger.info("SQS_BODY is not valid JSON, treating as raw string")
            # Process as raw string
            await process_message({"raw_message": sqs_body})
            logger.info("Successfully processed raw message from SQS_BODY")
            return
        except Exception as e:
            logger.error(f"Error processing SQS_BODY: {e}")
            logger.error(f"Exception details: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")

    # If SQS_BODY wasn't available or failed, check EVENT_DATA
    event_data = os.getenv("EVENT_DATA", None)
    if event_data:
        logger.info("Found event data in EVENT_DATA environment variable")
        try:
            # Parse the event data
            event = json.loads(event_data)
            logger.info(
                f"Successfully parsed EVENT_DATA as JSON: {json.dumps(event)[:200]}..."
            )

            # Check if it has Records array (standard SQS format)
            if isinstance(event.get("Records"), list) and len(event.get("Records")) > 0:
                records = event.get("Records")
                logger.info(f"Found {len(records)} records in EVENT_DATA")

                for record in records:
                    # Extract the body from the record
                    body_str = record.get("body", "{}")
                    if not isinstance(body_str, str):
                        body_str = json.dumps(body_str)

                    try:
                        body = json.loads(body_str)
                        await process_message(body)
                        logger.info(
                            "Successfully processed message from EVENT_DATA record"
                        )
                    except json.JSONDecodeError:
                        await process_message({"raw_message": body_str})
                        logger.info(
                            "Successfully processed raw message from EVENT_DATA record"
                        )
                    except Exception as e:
                        logger.error(f"Error processing record body: {e}")
            else:
                # No Records array, try to process the event directly
                await process_message(event)
                logger.info("Successfully processed EVENT_DATA directly")

            return
        except Exception as e:
            logger.error(f"Error processing EVENT_DATA: {e}")
            logger.error(f"Exception details: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")

    # If we get here, we couldn't find any event data
    logger.warning("No event data found in environment variables")
    logger.info("Worker execution complete with no messages processed")


async def run_worker() -> None:
    """Entry point for the async worker."""
    # Setup signal handlers for graceful shutdown
    setup_signal_handlers()

    if POLLING_MODE:
        logger.info("Starting worker in SQS polling mode")
        await poll_sqs()
    else:
        logger.info("Starting worker in EventBridge Pipes mode")
        await process_eventbridge_pipes()


def setup_signal_handlers():
    """Set up signal handlers for graceful shutdown."""

    def handle_sigterm(signum, frame) -> None:
        global shutdown_requested
        logger.info("Received SIGTERM signal, initiating graceful shutdown...")
        shutdown_requested = True

    def handle_sigint(signum, frame) -> None:
        global shutdown_requested
        logger.info("Received SIGINT signal, initiating graceful shutdown...")
        shutdown_requested = True

    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigint)


if __name__ == "__main__":
    try:
        # Run the worker
        asyncio.run(run_worker())

        # exit with success code after processing the message
        if not POLLING_MODE and EXIT_AFTER_COMPLETION:
            logger.info(
                "Exiting after completion as requested by EXIT_AFTER_COMPLETION=true"
            )
            sys.exit(0)
    except KeyboardInterrupt:
        logger.info("Shutting down worker due to keyboard interrupt...")
    except Exception as e:
        logger.error(f"Unhandled exception in worker: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)
    finally:
        logger.info("Worker shutdown complete")
