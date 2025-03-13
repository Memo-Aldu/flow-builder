from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from api.app.crud.log_crud import (
    SortField,
    SortOrder,
    get_log_by_id,
    get_logs_by_execution_phase_id,
)
from shared.crud.phase_crud import get_phase_by_id_and_user
from shared.db import get_session

from shared.models import ExecutionLog, ExecutionLogRead


router = APIRouter(tags=["ExecutionLogs"])


@router.get("/{log_id}", response_model=ExecutionLogRead)
async def get_log_endpoint(
    log_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> ExecutionLog:
    """Get a log by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])

    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    log = await get_log_by_id(session, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    execution_phase = await get_phase_by_id_and_user(
        session, log.execution_phase_id, local_user.id
    )
    if not execution_phase:
        raise HTTPException(
            status_code=404, detail=f"Phase not found for id {log.execution_phase_id}"
        )
    if execution_phase.id != log.execution_phase_id:
        raise HTTPException(status_code=404, detail="Log not found")
    logger.info(f"Getting log: {log.id}")
    return log


@router.get("", response_model=List[ExecutionLogRead])
async def get_logs_endpoint(
    execution_phase_id: UUID = Query(..., description="Filter by execution phase ID"),
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.TIMESTAMP, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[ExecutionLog]:
    """Get all logs for a given execution phase ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    execution_phase = await get_phase_by_id_and_user(
        session, execution_phase_id, local_user.id
    )

    if not execution_phase:
        raise HTTPException(
            status_code=404, detail=f"Phase not found for id {execution_phase_id}"
        )

    logs = await get_logs_by_execution_phase_id(
        session, execution_phase_id, page, limit, sort, order
    )
    logger.info(f"Getting logs for execution phase: {execution_phase_id}")
    return logs
