from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WorkflowExecution
from app.db import get_session
from app.auth import verify_clerk_token
from app.crud.user_crud import get_local_user_by_clerk_id
from app.crud.workflow_crud import get_workflow_by_id_and_user
from app.crud.execution_crud import (
    create_execution,
    get_execution_by_id_and_user,
    list_executions_for_user,
    update_execution,
    delete_execution,
)
from app.models import (
    WorkflowExecutionCreate,
    WorkflowExecutionRead,
    WorkflowExecutionUpdate,
)

router = APIRouter(tags=["Executions"])


@router.get("", response_model=List[WorkflowExecutionRead])
async def list_executions_endpoint(
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> List[WorkflowExecution]:
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    executions = await list_executions_for_user(session, local_user.id)
    return executions


@router.post(
    "", response_model=WorkflowExecutionRead, status_code=status.HTTP_201_CREATED
)
async def create_execution_endpoint(
    exec_in: WorkflowExecutionCreate,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowExecution:
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    workflow = await get_workflow_by_id_and_user(
        session, exec_in.workflow_id, local_user.id
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    new_execution = await create_execution(session, local_user.id, exec_in)
    return new_execution


@router.get("/{execution_id}", response_model=WorkflowExecutionRead)
async def get_execution_endpoint(
    execution_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> WorkflowExecution:
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
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    execution = await get_execution_by_id_and_user(session, execution_id, local_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    await delete_execution(session, execution)
