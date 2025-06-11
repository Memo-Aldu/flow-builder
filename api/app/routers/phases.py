from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_user_or_guest, get_current_user_from_auth
from api.app.middleware.hybrid_rate_limit import default_rate_limit, check_hybrid_rate_limit

from shared.db import get_session
from shared.crud.phase_crud import (
    SortField,
    SortOrder,
    get_phases_by_execution_and_user,
    get_phase_by_id_and_user,
)
from shared.models import ExecutionPhase, ExecutionPhaseRead


router = APIRouter(tags=["ExecutionPhase"])


@router.get("/{phase_id}", response_model=ExecutionPhaseRead)
@default_rate_limit
async def get_phase_endpoint(
    request: Request,
    phase_id: UUID,
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
) -> ExecutionPhase:
    """Get a phase by ID"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    phase = await get_phase_by_id_and_user(session, phase_id, user.id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    logger.info("Getting phase: %s", phase.id)
    return phase


@router.get("", response_model=List[ExecutionPhaseRead])
@default_rate_limit
async def list_phases_endpoint(
    request: Request,
    execution_id: UUID = Query(..., description="Filter by execution ID"),
    auth_data = Depends(verify_user_or_guest),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.STARTED_AT, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[ExecutionPhase]:
    """Get all phases for a given execution ID"""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    phases = await get_phases_by_execution_and_user(
        session, execution_id, user.id, page, limit, sort, order
    )
    logger.info("Getting phases for execution: %s", execution_id)
    return phases
