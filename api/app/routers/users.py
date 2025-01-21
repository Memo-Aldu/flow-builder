from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.auth import verify_clerk_token
from app.db import get_session
from app.models import User
from app.crud.user_crud import get_local_user_by_clerk_id

router = APIRouter(tags=["Users"])


@router.get("", response_model=User)
async def get_user(
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> User:
    clerk_id = _auth_user.get("sub", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.post("", response_model=User)
async def create_user(
    session: AsyncSession = Depends(get_session),
    _auth_user: dict = Depends(verify_clerk_token),
) -> User:
    clerk_id = _auth_user.get("sub", "")
    user = await get_local_user_by_clerk_id(session, clerk_id)
    if user:
        raise HTTPException(status_code=400, detail="User already exists.")
    user = User(clerk_id=clerk_id)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
