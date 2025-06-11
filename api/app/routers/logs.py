from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_user_or_guest, get_current_user_from_auth
from api.app.middleware.hybrid_rate_limit import default_rate_limit, check_hybrid_rate_limit
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
@default_rate_limit
async def get_log_endpoint(
    request: Request,
    log_id: UUID,
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> ExecutionLog:
    """Get a log by ID"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    log = await get_log_by_id(session, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    execution_phase = await get_phase_by_id_and_user(
        session, log.execution_phase_id, user.id
    )
    if not execution_phase:
        raise HTTPException(
            status_code=404, detail=f"Phase not found for id {log.execution_phase_id}"
        )
    if execution_phase.id != log.execution_phase_id:
        raise HTTPException(status_code=404, detail="Log not found")
    logger.info("Getting log: %s", log.id)
    return log


@router.get("", response_model=List[ExecutionLogRead])
@default_rate_limit
async def get_logs_endpoint(
    request: Request,
    execution_phase_id: UUID = Query(..., description="Filter by execution phase ID"),
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.TIMESTAMP, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[ExecutionLog]:
    """Get all logs for a given execution phase ID"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    execution_phase = await get_phase_by_id_and_user(
        session, execution_phase_id, user.id
    )

    if not execution_phase:
        raise HTTPException(
            status_code=404, detail=f"Phase not found for id {execution_phase_id}"
        )

    logs = await get_logs_by_execution_phase_id(
        session, execution_phase_id, page, limit, sort, order
    )
    logger.info("Getting logs for execution phase: %s", execution_phase_id)
    return logs
