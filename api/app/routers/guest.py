from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import BaseModel

from api.app.routers import logger
from api.app.auth.guest import guest_auth_manager
from api.app.auth import verify_clerk_token
from api.app.middleware.hybrid_rate_limit import default_rate_limit
from api.app.crud.user_crud import get_local_user_by_clerk_id
from shared.models import User
from shared.db import get_session


router = APIRouter(tags=["Guest"])


class GuestSessionResponse(BaseModel):
    """Response model for guest session creation."""
    session_id: str
    user_id: str
    credits: int
    expires_at: str
    
    

class RecoverGuestRequest(BaseModel):
    """Request model for recovering a guest session."""
    fingerprint: str


class ConvertGuestRequest(BaseModel):
    """Request model for converting guest to regular user."""
    guest_session_id: str


@router.post("/create-session", response_model=GuestSessionResponse)
@default_rate_limit
async def create_guest_session(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> GuestSessionResponse:
    """
    Create a new guest session.
    
    This endpoint allows users to try the app without signing up.
    Each IP address can only have one active guest session.
    """
    # Get client IP
    client_ip = _get_client_ip(request)
    
    try:
        # Create guest user and session
        guest_user, session_id = await guest_auth_manager.create_guest_user(
            session, client_ip
        )
        
        logger.info(f"Created guest session for IP {client_ip}: {session_id}")
        
        return GuestSessionResponse(
            session_id=session_id,
            user_id=str(guest_user.id),
            credits=guest_user.balance.credits if guest_user.balance else 0,
            expires_at=guest_user.guest_expires_at.isoformat() if guest_user.guest_expires_at else ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create guest session: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create guest session"
        )


@router.get("/session/{session_id}")
@default_rate_limit
async def get_guest_session(
    request: Request,
    session_id: str,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Get guest session information."""
    guest_user = await guest_auth_manager.get_guest_user_by_session(
        session, session_id
    )
    
    if not guest_user:
        raise HTTPException(
            status_code=404,
            detail="Guest session not found or expired"
        )
    
    return {
        "user_id": str(guest_user.id),
        "username": guest_user.username,
        "credits": guest_user.balance.credits if guest_user.balance else 0,
        "expires_at": guest_user.guest_expires_at.isoformat() if guest_user.guest_expires_at else "",
        "is_guest": guest_user.is_guest
    }
    

@router.post("/recover")
@default_rate_limit
async def recover_guest_session(
    request: Request,
    recover_request: RecoverGuestRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Recover a guest session using a browser fingerprint.
    
    This endpoint allows users to recover their guest session
    after a page reload or browser refresh.
    """
    # Get client IP
    client_ip = _get_client_ip(request)
    
    # Get browser fingerprint from request body
    fingerprint = recover_request.fingerprint
    if not fingerprint:
        raise HTTPException(
            status_code=400,
            detail="Missing browser fingerprint"
        )
    
    # Get guest user by fingerprint
    guest_user = await guest_auth_manager.get_guest_user_by_fingerprint(
        session, client_ip, fingerprint
    )
    
    if not guest_user:
        raise HTTPException(
            status_code=404,
            detail="Guest session not found or expired"
        )
    
    return {
        "session_id": guest_user.guest_session_id,
        "user_id": str(guest_user.id),
        "username": guest_user.username,
        "credits": guest_user.balance.credits if guest_user.balance else 0,
        "expires_at": guest_user.guest_expires_at.isoformat() if guest_user.guest_expires_at else "",
        "is_guest": guest_user.is_guest
    }


@router.post("/convert-to-user")
@default_rate_limit
async def convert_guest_to_user(
    request: Request,
    convert_request: ConvertGuestRequest,
    session: AsyncSession = Depends(get_session),
    auth_user: dict = Depends(verify_clerk_token),
) -> dict:
    """
    Convert a guest user to a regular user after they sign up.
    
    This endpoint should be called after a user signs up with Clerk
    to merge their guest data with their new account.
    """
    clerk_id = auth_user.get("sub", "")
    email = auth_user.get("email", "")
    username = auth_user.get("username", "")
    first_name = auth_user.get("first_name", "")
    last_name = auth_user.get("last_name", "")
    
    # Check if user already exists
    existing_user = await get_local_user_by_clerk_id(session, clerk_id)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )
    
    # Get guest user
    guest_user = await guest_auth_manager.get_guest_user_by_session(
        session, convert_request.guest_session_id
    )
    
    if not guest_user:
        raise HTTPException(
            status_code=404,
            detail="Guest session not found or expired"
        )
    
    if not guest_user.is_guest:
        raise HTTPException(
            status_code=400,
            detail="User is not a guest"
        )
    
    try:
        # Convert guest to regular user
        converted_user = await guest_auth_manager.convert_guest_to_user(
            session, guest_user, clerk_id, email, username, first_name, last_name
        )
        
        logger.info(f"Converted guest {guest_user.id} to user {clerk_id}")
        
        return {
            "user_id": str(converted_user.id),
            "clerk_id": converted_user.clerk_id,
            "email": converted_user.email,
            "username": converted_user.username,
            "first_name": converted_user.first_name,
            "last_name": converted_user.last_name,
            "credits": converted_user.balance.credits if converted_user.balance else 0,
            "is_guest": converted_user.is_guest
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to convert guest user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to convert guest user"
        )


@router.delete("/cleanup-expired")
@default_rate_limit
async def cleanup_expired_guests(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Clean up expired guest users and their data.

    This endpoint should be called periodically (e.g., via cron job)
    to remove expired guest accounts and free up resources.
    """
    try:
        count = await guest_auth_manager.cleanup_expired_guests(session)
        logger.info(f"Cleaned up {count} expired guest users")

        return {
            "cleaned_up_count": count,
            "message": f"Successfully cleaned up {count} expired guest users"
        }

    except Exception as e:
        logger.error(f"Failed to cleanup expired guests: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to cleanup expired guests"
        )


@router.get("/stats")
@default_rate_limit
async def get_guest_stats(request: Request) -> dict:
    """Get guest account statistics."""
    try:
        from api.app.services.guest_cleanup import guest_cleanup_service
        stats = await guest_cleanup_service.get_guest_account_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get guest stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get guest statistics"
        )


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    # Check for forwarded headers first (for load balancers/proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"
