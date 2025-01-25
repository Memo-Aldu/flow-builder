import os
import json
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query, status

from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.execution_crud import (
    create_execution,
    get_executions_for_user,
    get_executions_by_workflow_id_and_user,
    delete_execution,
)
from shared.crud.workflow_crud import get_workflow_by_id_and_user
from shared.db import get_session
from shared.sqs import get_sqs_client
from shared.crud.execution_crud import (
    get_execution_by_id_and_user,
    update_execution,
)
from shared.models import (
    WorkflowExecution,
    WorkflowExecutionCreate,
    WorkflowExecutionRead,
    WorkflowExecutionUpdate,
)


WORKFLOW_QUEUE_URL = os.getenv(
    "WORKFLOW_QUEUE_URL",
    "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue",
)

router = APIRouter(tags=["Executions"])
sqs_client = get_sqs_client()


@router.get("", response_model=List[WorkflowExecutionRead])
async def list_executions_endpoint(
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    workflow_id: Optional[UUID] = Query(None, description="Filter by workflow ID"),
) -> List[WorkflowExecution]:
    """Gets all executions for a given workflow ID or all executions for a user"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if workflow_id:
        executions = await get_executions_by_workflow_id_and_user(
            session, workflow_id, local_user.id
        )
        return executions

    executions = await get_executions_for_user(session, local_user.id)
    return executions


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
        sqs_client.send_message(
            QueueUrl=WORKFLOW_QUEUE_URL,
            MessageBody=json.dumps(message_body),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Failed to send message to SQS: " + str(e)
        )
    return new_execution


@router.get("/{execution_id}", response_model=WorkflowExecutionRead)
async def get_execution_endpoint(
    execution_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowExecution:
    """Gets a single execution by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
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
    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    updated_exec = await update_execution(session, execution, exec_in)
    return updated_exec


@router.delete("/{execution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_execution_endpoint(
    execution_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Deletes a single execution by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    await delete_execution(session, execution)
