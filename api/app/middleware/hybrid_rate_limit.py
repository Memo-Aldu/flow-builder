"""
Hybrid rate limiting system combining slowapi (Redis/memory) with custom guest logic.

This approach uses:
1. slowapi for fast, memory-based rate limiting for general endpoints
2. Custom database logic for guest-specific tracking and complex rules
3. Redis for distributed rate limiting (optional)
"""

import os
from datetime import datetime
from typing import Optional

from pytz import UTC

import redis.asyncio as redis
from fastapi import Request, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from shared.models import User


REDIS_AVAILABLE = os.getenv("REDIS_URL") is not None

class HybridRateLimiter:
    """
    Hybrid rate limiting system that combines slowapi with custom guest logic.
    """
    
    def __init__(self):
        # Initialize Redis connection if available
        self.redis_client = None
        if REDIS_AVAILABLE:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
            except Exception:
                self.redis_client = None
        
        # Initialize slowapi limiter
        self.limiter = Limiter(
            key_func=self._get_limiter_key,
            storage_uri=redis_url if self.redis_client else "memory://",
            default_limits=["100/minute", "1000/hour"]  # Conservative defaults
        )
        
        # Guest-specific limits (stricter)
        self.guest_limits = {
            "default": "40/minute",
            "workflows": "20/minute", 
            "executions": "15/minute",
            "credentials": "20/minute",
        }
        
        # Authenticated user limits (more lenient)
        self.user_limits = {
            "default": "80/minute",
            "workflows": "40/minute", 
            "executions": "30/minute",
            "credentials": "40/minute",
        }
    
    def _get_limiter_key(self, request: Request) -> str:
        """
        Generate a key for rate limiting based on user type and endpoint.
        """
        # Check for guest session
        guest_session = request.headers.get("X-Guest-Session-ID")
        if guest_session:
            endpoint_type = self._get_endpoint_category(request.url.path)
            return f"guest:{guest_session}:{endpoint_type}"
        
        # Check for auth token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Extract user ID from token (simplified - in real implementation, decode JWT)
            token = auth_header.split(" ")[1]
            endpoint_type = self._get_endpoint_category(request.url.path)
            return f"user:{token[:10]}:{endpoint_type}"  # Use first 10 chars as identifier
        
        # Fallback to IP-based limiting
        ip = get_remote_address(request)
        endpoint_type = self._get_endpoint_category(request.url.path)
        return f"ip:{ip}:{endpoint_type}"
    
    def _get_endpoint_category(self, path: str) -> str:
        """Categorize endpoint for rate limiting."""
        if "/workflows" in path:
            return "workflows"
        elif "/executions" in path:
            return "executions"
        elif "/credentials" in path:
            return "credentials"
        else:
            return "default"
    
    def get_rate_limit_for_request(self, request: Request) -> str:
        """
        Get the appropriate rate limit string for a request.
        """
        guest_session = request.headers.get("X-Guest-Session-ID")
        endpoint_type = self._get_endpoint_category(request.url.path)
        
        if guest_session:
            return self.guest_limits.get(endpoint_type, self.guest_limits["default"])
        else:
            return self.user_limits.get(endpoint_type, self.user_limits["default"])
    
    async def check_guest_specific_limits(
        self, 
        request: Request, 
        session: AsyncSession,
        user: User
    ) -> bool:
        """
        Additional guest-specific checks using database.
        This handles complex business logic that slowapi can't handle.
        """
        if not user.is_guest:
            return True  # No additional checks for regular users
        
        # Check if guest session is still valid
        if user.guest_expires_at and user.guest_expires_at.astimezone(tz=UTC) < datetime.now(tz=UTC):
            raise HTTPException(
                status_code=403,
                detail="Guest session has expired. Please create an account."
            )
        
        # Check for suspicious activity (multiple requests from same IP)
        client_ip = self._get_client_ip(request)
        if client_ip != user.guest_ip_address:
            raise HTTPException(
                status_code=403,
                detail="Guest session IP mismatch. Please create an account."
            )
        
        # Additional guest-specific business logic can go here
        # For example: check if guest has exceeded daily limits, etc.
        
        return True
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


# Global instance
hybrid_limiter = HybridRateLimiter()


def create_rate_limit_decorator(endpoint_type: str = "default"):
    """
    Create a rate limit decorator for specific endpoint types.
    
    Usage:
        @create_rate_limit_decorator("workflows")
        async def create_workflow(...):
            ...
    """
    def decorator(func):
        # Apply slowapi rate limiting
        guest_limit = hybrid_limiter.guest_limits.get(endpoint_type, hybrid_limiter.guest_limits["default"])
        user_limit = hybrid_limiter.user_limits.get(endpoint_type, hybrid_limiter.user_limits["default"])
        
        # Use the more restrictive limit as the base limit
        base_limit = guest_limit
        
        return hybrid_limiter.limiter.limit(base_limit)(func)
    return decorator


# Convenience decorators for common endpoint types
workflows_rate_limit = create_rate_limit_decorator("workflows")
executions_rate_limit = create_rate_limit_decorator("executions") 
credentials_rate_limit = create_rate_limit_decorator("credentials")
default_rate_limit = create_rate_limit_decorator("default")


async def check_hybrid_rate_limit(
    request: Request,
    session: AsyncSession,
    user: Optional[User] = None
) -> bool:
    """
    Comprehensive rate limit check that combines slowapi with custom logic.
    
    This should be called in endpoints that need guest-specific validation.
    The slowapi decorator handles the basic rate limiting.
    """
    if user and user.is_guest:
        return await hybrid_limiter.check_guest_specific_limits(request, session, user)
    
    return True
