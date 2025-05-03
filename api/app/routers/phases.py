from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id

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
async def get_phase_endpoint(
    phase_id: UUID,
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
) -> ExecutionPhase:
    """Get a phase by ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    phase = await get_phase_by_id_and_user(session, phase_id, local_user.id)
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    logger.info(f"Getting phase: {phase.id}")
    return phase


@router.get("", response_model=List[ExecutionPhaseRead])
async def list_phases_endpoint(
    execution_id: UUID = Query(..., description="Filter by execution ID"),
    user_info: dict = Depends(verify_clerk_token),
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1, description="Current page number"),
    limit: int = Query(10, le=100, description="Number of items per page"),
    sort: SortField = Query(SortField.STARTED_AT, description="Sort field"),
    order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
) -> List[ExecutionPhase]:
    """Get all phases for a given execution ID"""
    local_user = await get_local_user_by_clerk_id(session, user_info["sub"])
    if not local_user:
        raise HTTPException(status_code=404, detail="User not found")

    phases = await get_phases_by_execution_and_user(
        session, execution_id, local_user.id, page, limit, sort, order
    )
    logger.info(f"Getting phases for execution: {execution_id}")
    return phases
