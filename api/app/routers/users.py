from typing import Union
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import (
    verify_clerk_token,
    verify_user_or_guest,
    get_current_user_from_auth,
)
from api.app.middleware.hybrid_rate_limit import (
    default_rate_limit,
    check_hybrid_rate_limit,
)
from api.app.crud.user_crud import get_local_user_by_clerk_id

from shared.models import User, UserBalance
from shared.db import get_session


router = APIRouter(tags=["Users"])


@router.get("", response_model=User)
@default_rate_limit
async def get_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> User:
    """Get authenticated user by Clerk token."""
    clerk_id = _auth_user.get("sub", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    logger.info("Getting user: %s", user.id)
    return user


@router.get("/current", response_model=User)
@default_rate_limit
async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
    auth_data: Union[dict, User] = Depends(verify_user_or_guest),
) -> User:
    """Get current user (supports both authenticated and guest users)."""
    user = await get_current_user_from_auth(auth_data, session)

    # Check additional guest-specific rate limits
    await check_hybrid_rate_limit(request, session, user)

    logger.info("Getting current user: %s", user.id)
    return user


@router.post("", response_model=User)
@default_rate_limit
async def create_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> User:
    """Create a new user from Clerk authentication."""
    print(_auth_user)
    clerk_id = _auth_user.get("sub", "")
    email = _auth_user.get("email", "")
    username = _auth_user.get("username", "")
    first_name = _auth_user.get("first_name", "")
    last_name = _auth_user.get("last_name", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if user:
        logger.info("User already exists: %s", user.id)
        return user
    user = User(
        clerk_id=clerk_id,
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )
    balance = UserBalance(user_id=user.id, credits=200)
    user.balance = balance
    session.add(user)
    session.add(balance)
    try:
        await session.commit()
    except Exception as e:
        await session.rollback()
        user = await get_local_user_by_clerk_id(session, clerk_id)
        if user:
            return user
        raise HTTPException(
            status_code=500, detail="Could not create or retrieve user."
        ) from e
    await session.refresh(user)
    return user
