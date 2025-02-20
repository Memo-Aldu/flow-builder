from httpx import get
from api.app.crud.balance_crud import create_balance, get_balance_by_user_id
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id
from shared.models import User, UserBalance, UserBalanceRead
from shared.db import get_session


router = APIRouter(tags=["Balances"])


@router.get("", response_model=UserBalanceRead)
async def get_user_balance(
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> UserBalance:
    clerk_id = _auth_user.get("sub", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return await get_balance_by_user_id(session, user.id)
