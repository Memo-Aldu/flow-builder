import os
from typing import Any, Dict, Optional, Union

import httpx
from clerk_backend_api import Clerk
from fastapi import Request, HTTPException, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from clerk_backend_api.jwks_helpers import (
    authenticate_request,
    AuthenticateRequestOptions,
)

from shared.models import User
from shared.db import get_session
from api.app.auth.guest import guest_auth_manager
from api.app.middleware.hybrid_rate_limit import check_hybrid_rate_limit


def get_clerk_secret_key() -> str:
    return os.getenv("CLERK_SECRET_KEY", "")


def get_authorized_party_url() -> list[str]:
    return [os.getenv("CLERK_FRONTEND_URL", "http://localhost:3000")]


clerk_client = Clerk(bearer_auth=get_clerk_secret_key())


# Middleware dependency to verify Clerk tokens
async def verify_clerk_token(request: Request) -> Optional[Dict[str, Any]]:
    try:
        httpx_request = httpx.Request(
            method=request.method,
            url=str(request.url),
            headers=request.headers,
            content=await request.body(),
        )

        request_state = authenticate_request(
            clerk_client,
            httpx_request,
            AuthenticateRequestOptions(),
        )

        if not request_state.is_signed_in:
            raise HTTPException(
                status_code=401, detail="Unauthorized: Token is invalid or expired"
            )

        return request_state.payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}") from e


# Combined authentication dependency that supports both Clerk and guest users
async def verify_user_or_guest(
    request: Request, session: AsyncSession = Depends(get_session)
) -> Union[Dict[str, Any], User]:
    """
    Verify either Clerk token or guest session.

    Returns:
        - Dict with Clerk user data if authenticated with Clerk
        - User object if authenticated as guest

    Raises:
        HTTPException: If neither authentication method is valid
    """
    # First try Clerk authentication
    try:
        clerk_data = await verify_clerk_token(request)
        if clerk_data:
            return clerk_data
    except HTTPException:
        pass  # Continue to try guest authentication

    # Try guest authentication
    guest_user = await guest_auth_manager.validate_guest_session(request, session)
    if guest_user:
        return guest_user

    # Neither authentication method worked
    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please sign in or use guest access.",
    )


# Optional authentication - allows both authenticated and unauthenticated access
async def optional_auth(
    request: Request, session: AsyncSession = Depends(get_session)
) -> Optional[Union[Dict[str, Any], User]]:
    """
    Optional authentication that doesn't raise errors.

    Returns:
        - Dict with Clerk user data if authenticated with Clerk
        - User object if authenticated as guest
        - None if not authenticated
    """
    try:
        return await verify_user_or_guest(request, session)
    except HTTPException:
        return None


async def get_current_user_from_auth(
    auth_data: Union[Dict[str, Any], User], session: AsyncSession
) -> User:
    """
    Extract User object from either Clerk auth data or guest User object.

    Args:
        auth_data: Either Clerk JWT payload dict or guest User object
        session: Database session

    Returns:
        User object

    Raises:
        HTTPException: If user not found
    """
    if isinstance(auth_data, User):
        # Guest user - return directly
        return auth_data
    else:
        # Clerk authenticated user - look up in database
        from api.app.crud.user_crud import get_local_user_by_clerk_id

        clerk_id = auth_data.get("sub", "")
        user = await get_local_user_by_clerk_id(session, clerk_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
