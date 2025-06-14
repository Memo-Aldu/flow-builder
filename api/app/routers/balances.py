from api.app.crud.balance_crud import get_balance_by_user_id
from fastapi import APIRouter, Depends, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_user_or_guest, get_current_user_from_auth
from api.app.middleware.hybrid_rate_limit import (
    default_rate_limit,
    check_hybrid_rate_limit,
)
from shared.models import UserBalance, UserBalanceRead
from shared.db import get_session


router = APIRouter(tags=["Balances"])


@router.get("", response_model=UserBalanceRead)
@default_rate_limit
async def get_user_balance(
    request: Request,
    session: AsyncSession = Depends(get_session),
    auth_data=Depends(verify_user_or_guest),
) -> UserBalance:
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    logger.info(f"Getting balance for user: {user.id}")
    return await get_balance_by_user_id(session, user.id)
