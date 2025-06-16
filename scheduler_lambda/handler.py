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

# Guest cleanup configuration
GUEST_CLEANUP_INTERVAL_MINUTES = int(
    os.getenv("GUEST_CLEANUP_INTERVAL_MINUTES", "60")
)  # Default: every hour
SCHEDULER_INTERVAL_MINUTES = 5  # Scheduler runs every 5 minutes
CLEANUP_EXECUTION_INTERVAL = (
    GUEST_CLEANUP_INTERVAL_MINUTES // SCHEDULER_INTERVAL_MINUTES
)  # Every 12 executions

# Track execution count for guest cleanup timing
execution_count = 0


async def cleanup_expired_guests(session) -> dict:
    """
    Clean up expired guest accounts and return statistics.
    """
    try:
        # Import here to avoid circular imports
        from shared.models import User, GuestSession
        from sqlmodel import select, and_, func

        # Find expired guest users
        stmt = select(User).where(
            and_(
                User.is_guest == True,
                User.guest_expires_at != None,
                User.guest_expires_at < datetime.now(timezone.utc),  # type: ignore
            )
        )
        result = await session.execute(stmt)
        expired_guests = result.scalars().all()

        guest_count = 0
        for guest in expired_guests:
            # Delete the user (cascade will handle related data)
            await session.delete(guest)
            guest_count += 1

        # Also clean up orphaned guest sessions
        stmt = select(GuestSession).where(
            GuestSession.expires_at < datetime.now(timezone.utc)
        )
        result = await session.execute(stmt)
        orphaned_sessions = result.scalars().all()

        session_count = 0
        for session_obj in orphaned_sessions:
            await session.delete(session_obj)
            session_count += 1

        await session.commit()

        if guest_count > 0 or session_count > 0:
            logger.info(
                f"Guest cleanup: removed {guest_count} expired guests and {session_count} orphaned sessions"
            )

        return {
            "cleaned_up_guests": guest_count,
            "cleaned_up_sessions": session_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to cleanup expired guests: {str(e)}")
        await session.rollback()
        return {
            "error": str(e),
            "cleaned_up_guests": 0,
            "cleaned_up_sessions": 0,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


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
    Also periodically clean up expired guest accounts.
    """
    global execution_count
    execution_count += 1

    engine, SessionLocal = create_lambda_engine_and_session()
    async with SessionLocal() as session:
        # Run guest cleanup every hour (every 12 executions)
        cleanup_result = None
        if execution_count % CLEANUP_EXECUTION_INTERVAL == 0:
            logger.info("Running guest cleanup (execution #%d)", execution_count)
            cleanup_result = await cleanup_expired_guests(session)

        workflows = await get_due_workflows(session)
        logger.info("Found %s due workflows.", len(workflows))

        if not workflows and cleanup_result is None:
            return {"message": "No due workflows found and no cleanup performed."}

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

    # Prepare response message
    message_parts = [f"Processed {len(workflows)} workflow(s)"]
    if cleanup_result:
        if cleanup_result.get("error"):
            message_parts.append(f"Guest cleanup failed: {cleanup_result['error']}")
        else:
            guests_cleaned = cleanup_result.get("cleaned_up_guests", 0)
            sessions_cleaned = cleanup_result.get("cleaned_up_sessions", 0)
            if guests_cleaned > 0 or sessions_cleaned > 0:
                message_parts.append(
                    f"Cleaned up {guests_cleaned} expired guests and {sessions_cleaned} orphaned sessions"
                )
            else:
                message_parts.append("No expired guests found")

    return {"message": ". ".join(message_parts) + "."}
