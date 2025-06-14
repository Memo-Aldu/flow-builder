"""
Guest account cleanup service.

This service handles the automatic cleanup of expired guest accounts
and their associated data.
"""

import asyncio
import logging
from datetime import datetime, timedelta

from shared.db import create_lambda_engine_and_session
from api.app.auth.guest import guest_auth_manager

logger = logging.getLogger(__name__)


class GuestCleanupService:
    """Service for cleaning up expired guest accounts."""

    def __init__(self):
        self.cleanup_interval_hours = 6
        self.is_running = False
        self.max_retries = 3

    async def start_background_cleanup(self) -> None:
        """Start the background cleanup task."""
        if self.is_running:
            logger.warning("Guest cleanup service is already running")
            return

        self.is_running = True
        logger.info("Starting guest cleanup background service")
        cleanup_count = 0
        while self.is_running and cleanup_count < self.max_retries:
            try:
                await self.cleanup_expired_guests()
                # Wait for next cleanup interval
                await asyncio.sleep(self.cleanup_interval_hours * 3600)
                cleanup_count += 1
            except Exception as e:
                logger.error(f"Error in guest cleanup service: {str(e)}")
                # Wait a bit before retrying
                await asyncio.sleep(300)  # 5 minutes
                cleanup_count += 1

    def stop_background_cleanup(self) -> None:
        """Stop the background cleanup task."""
        self.is_running = False
        logger.info("Stopping guest cleanup background service")

    async def cleanup_expired_guests(self) -> int:
        """
        Clean up expired guest accounts.

        Returns:
            Number of guest accounts cleaned up
        """
        try:
            # Create a new engine and session for this operation
            engine, SessionLocal = create_lambda_engine_and_session()

            async with SessionLocal() as session:
                count = await guest_auth_manager.cleanup_expired_guests(session)

                if count > 0:
                    logger.info(f"Cleaned up {count} expired guest accounts")
                else:
                    logger.debug("No expired guest accounts found")

                return count

        except Exception as e:
            logger.error(f"Failed to cleanup expired guests: {str(e)}")
            raise
        finally:
            await engine.dispose()

    async def cleanup_old_rate_limit_entries(self) -> int:
        """
        Clean up old rate limit entries (older than 24 hours).

        Note: RateLimitEntry model has been removed. This method now returns 0
        but is kept for backward compatibility.

        Returns:
            Number of rate limit entries cleaned up (always 0)
        """
        logger.info("RateLimitEntry model has been removed - no cleanup needed")
        return 0

    async def get_guest_account_stats(self) -> dict:
        """
        Get statistics about guest accounts.

        Returns:
            Dictionary with guest account statistics
        """
        try:
            from shared.models import User, GuestSession
            from sqlmodel import select, and_, func

            # Create a new engine and session for this operation
            engine, SessionLocal = create_lambda_engine_and_session()

            async with SessionLocal() as session:
                # Count active guest users
                active_guests_stmt = select(func.count(User.id)).where(  # type: ignore
                    and_(
                        User.is_guest == True,
                        User.guest_expires_at != None,
                        User.guest_expires_at > datetime.utcnow(),  # type: ignore
                    )
                )
                active_guests_result = await session.execute(active_guests_stmt)
                active_guests_count = active_guests_result.scalar() or 0

                # Count expired guest users
                expired_guests_stmt = select(func.count(User.id)).where(  # type: ignore
                    and_(
                        User.is_guest == True,
                        User.guest_expires_at != None,
                        User.guest_expires_at <= datetime.utcnow(),  # type: ignore
                    )
                )
                expired_guests_result = await session.execute(expired_guests_stmt)
                expired_guests_count = expired_guests_result.scalar() or 0

                # Count converted guest sessions
                converted_sessions_stmt = select(func.count(GuestSession.id)).where(  # type: ignore
                    GuestSession.converted_to_user == True
                )
                converted_sessions_result = await session.execute(
                    converted_sessions_stmt
                )
                converted_sessions_count = converted_sessions_result.scalar() or 0

                # Count active guest sessions
                active_sessions_stmt = select(func.count(GuestSession.id)).where(  # type: ignore
                    and_(
                        GuestSession.is_active == True,
                        GuestSession.expires_at > datetime.utcnow(),
                        GuestSession.converted_to_user == False,
                    )
                )
                active_sessions_result = await session.execute(active_sessions_stmt)
                active_sessions_count = active_sessions_result.scalar() or 0

                return {
                    "active_guest_users": active_guests_count,
                    "expired_guest_users": expired_guests_count,
                    "converted_guest_sessions": converted_sessions_count,
                    "active_guest_sessions": active_sessions_count,
                    "total_guest_users": active_guests_count + expired_guests_count,
                    "conversion_rate": (
                        converted_sessions_count
                        / (converted_sessions_count + active_sessions_count)
                        if (converted_sessions_count + active_sessions_count) > 0
                        else 0
                    ),
                }

        except Exception as e:
            logger.error(f"Failed to get guest account stats: {str(e)}")
            raise
        finally:
            await engine.dispose()


# Global cleanup service instance
guest_cleanup_service = GuestCleanupService()


async def run_cleanup_once() -> dict:
    """
    Run cleanup once and return results.

    This function can be called from a cron job or scheduled task.
    """
    try:
        guest_count = await guest_cleanup_service.cleanup_expired_guests()
        rate_limit_count = await guest_cleanup_service.cleanup_old_rate_limit_entries()
        stats = await guest_cleanup_service.get_guest_account_stats()

        return {
            "success": True,
            "cleaned_up_guests": guest_count,
            "cleaned_up_rate_limits": rate_limit_count,
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Cleanup failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


if __name__ == "__main__":
    # For running as a standalone script
    import asyncio

    async def main():
        result = await run_cleanup_once()
        print(f"Cleanup result: {result}")

    asyncio.run(main())
