import os
import json
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.app.routers import logger
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.execution_crud import (
    SortField,
    SortOrder,
    get_execution_stats,
    get_executions_for_user,
    get_executions_by_workflow_id_and_user,
    delete_execution,
)
from shared.crud.workflow_crud import get_workflow_by_id_and_user
from shared.db import get_session
from shared.sqs import get_sqs_client, send_message
from shared.crud.execution_crud import (
    get_execution_by_id_and_user,
    create_execution,
    update_execution,
)
from shared.models import (
    ExecutionStatus,
    WorkflowExecution,
    WorkflowExecutionCreate,
    WorkflowExecutionRead,
    WorkflowExecutionUpdate,
    ExecutionPhase,
)


WORKFLOW_QUEUE_URL = os.getenv(
    "WORKFLOW_QUEUE_URL",
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue",
)


class ExecutionStats(BaseModel):
    num_executions: int
    total_credits: int
    num_phases: int
    execution_dates_status: List[dict]
    credits_dates_status: List[dict]


router = APIRouter(tags=["Executions"])
sqs_client = get_sqs_client()


@router.get("", response_model=List[WorkflowExecutionRead])
async def list_executions_endpoint(
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    workflow_id: Optional[UUID] = Query(None, description="Filter by workflow ID"),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.CREATED_AT, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[WorkflowExecution]:
    """Gets all executions for a given workflow ID or all executions for a user"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])

    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    if workflow_id:
        executions = await get_executions_by_workflow_id_and_user(
            session, workflow_id, local_user.id, page, limit, sort, order
        )
        return executions

    executions = await get_executions_for_user(
        session, local_user.id, page, limit, sort, order
    )
    logger.info(f"Getting executions for user: {local_user.id}")
    return executions


@router.get("/stats", response_model=ExecutionStats)
async def get_execution_stats_endpoint(
    start_date: datetime = Query(..., description="Start date for stats"),
    end_date: datetime = Query(..., description="End date for stats"),
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> ExecutionStats:
    """Gets execution stats for a user within a date range"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])

    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    if start_date > end_date:
        raise HTTPException(
            status_code=400, detail="Start date must be before end date"
        )

    logger.info(
        f"Getting execution stats for user: {local_user.id} from {start_date} to {end_date}"
    )

    executions = await get_execution_stats(session, local_user.id, start_date, end_date)

    num_executions = len(executions)
    total_credits = sum(e.credits_consumed or 0 for e in executions)
    total_phases = sum(len(e.phases) for e in executions)

    phases: List[ExecutionPhase] = []
    for execution in executions:
        for phase in execution.phases:
            phases.append(phase)

    execution_dates_status = {}
    credits_phase_dates_status = {}
    for single_date in (
        start_date + timedelta(n) for n in range((end_date - start_date).days + 1)
    ):
        execution_dates_status[single_date.date()] = {
            "success": 0,
            "failure": 0,
        }
        credits_phase_dates_status[single_date.date()] = {
            "success": 0,
            "failure": 0,
        }
    for execution in executions:
        if execution.status == ExecutionStatus.COMPLETED:
            execution_dates_status[execution.created_at.date()]["success"] += 1
        elif execution.status == ExecutionStatus.FAILED:
            execution_dates_status[execution.created_at.date()]["failure"] += 1

    for phase in phases:
        if (
            phase.status == ExecutionStatus.COMPLETED
            and phase.credits_consumed
            and phase.started_at
        ):
            credits_phase_dates_status[phase.started_at.date()]["success"] += (
                phase.credits_consumed or 0
            )
        elif (
            phase.status == ExecutionStatus.FAILED
            and phase.credits_consumed
            and phase.started_at
        ):
            credits_phase_dates_status[phase.started_at.date()]["failure"] += (
                phase.credits_consumed or 0
            )

    status_array = []
    for date, status in execution_dates_status.items():
        status_array.append(
            {
                "date": date.isoformat(),
                "success": status["success"],
                "failure": status["failure"],
            }
        )

    credits_array = []
    for date, credits in credits_phase_dates_status.items():
        credits_array.append(
            {
                "date": date.isoformat(),
                "success": credits["success"],
                "failure": credits["failure"],
            }
        )

    return ExecutionStats(
        num_executions=num_executions,
        total_credits=total_credits,
        num_phases=total_phases,
        execution_dates_status=status_array,
        credits_dates_status=credits_array,
    )


@router.post(
    "", response_model=WorkflowExecutionRead, status_code=status.HTTP_201_CREATED
)
async def create_execution_endpoint(
    exec_in: WorkflowExecutionCreate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowExecution:
    """Creates a new execution and sends a message to the SQS queue."""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])

    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    workflow = await get_workflow_by_id_and_user(
        session, exec_in.workflow_id, local_user.id
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    new_execution = await create_execution(session, local_user.id, exec_in)

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
        raise HTTPException(
            status_code=500, detail="Failed to send message to SQS: " + str(e)
        ) from e
    logger.info(f"Created execution: {new_execution.id}")
    return new_execution


@router.get("/{execution_id}", response_model=WorkflowExecutionRead)
async def get_execution_endpoint(
    execution_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowExecution:
    """Gets a single execution by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])

    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")
    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    logger.info(f"Getting execution: {execution.id}")
    return execution


@router.patch("/{execution_id}", response_model=WorkflowExecutionRead)
async def update_execution_endpoint(
    execution_id: UUID,
    exec_in: WorkflowExecutionUpdate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowExecution:
    """Updates a single execution by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    updated_exec = await update_execution(session, execution, exec_in)
    logger.info(f"Updated execution {execution_id}")
    return updated_exec


@router.delete("/{execution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_execution_endpoint(
    execution_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Deletes a single execution by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    logger.info(f"Deleting execution: {execution_id}")
    await delete_execution(session, execution)
