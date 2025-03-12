from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from api.app.routers import logger
from api.app.auth import verify_clerk_token
from api.app.crud.user_crud import get_local_user_by_clerk_id

from shared.models import User
from shared.db import get_session


router = APIRouter(tags=["Users"])


@router.get("", response_model=User)
async def get_user(
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> User:
    clerk_id = _auth_user.get("id", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    logger.info(f"Getting user: {user.id}")
    return user


@router.post("", response_model=User)
async def create_user(
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> User:
    print(_auth_user)
    clerk_id = _auth_user.get("id", "")
    email = _auth_user.get("email", "")
    username = _auth_user.get("username", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if user:
        raise HTTPException(status_code=400, detail="User already exists.")
    user = User(clerk_id=clerk_id, email=email, username=username)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    logger.info(f"Created user: {user.id}")
    return user
