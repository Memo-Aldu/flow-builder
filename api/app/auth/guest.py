import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID, uuid4

from fastapi import Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_

from shared.models import User, UserBalance, GuestSession


class GuestAuthManager:
    """Manage guest user authentication and sessions."""
    
    GUEST_SESSION_DURATION_DAYS = 3
    GUEST_INITIAL_CREDITS = 50
    
    def __init__(self):
        pass
    
    async def create_guest_user(
        self, 
        session: AsyncSession, 
        ip_address: str
    ) -> Tuple[User, str]:
        """
        Create a new guest user and session.
        
        Args:
            session: Database session
            ip_address: Client IP address
            
        Returns:
            Tuple of (User, session_id)
            
        Raises:
            HTTPException: If IP already has an active guest session
        """
        # Check if IP already has an active guest session
        try:
            await self._check_existing_guest_session(session, ip_address)
            
            # Generate unique session ID
            session_id = self._generate_session_id()
            
            # Create guest user
            guest_user = User(
                id=uuid4(),
                clerk_id=None,
                email=None,
                username=f"guest_{session_id[:8]}",
                is_guest=True,
                guest_session_id=session_id,
                guest_ip_address=ip_address,
                guest_created_at=datetime.utcnow(),
                guest_expires_at=datetime.utcnow() + timedelta(days=self.GUEST_SESSION_DURATION_DAYS)
            )
            
            # Create initial balance
            balance = UserBalance(
                user_id=guest_user.id,
                credits=self.GUEST_INITIAL_CREDITS
            )
            
            # Create guest session record
            guest_session = GuestSession(
                session_id=session_id,
                ip_address=ip_address,
                user_id=guest_user.id,
                expires_at=guest_user.guest_expires_at or datetime.utcnow() + timedelta(days=self.GUEST_SESSION_DURATION_DAYS),
                is_active=True,
                converted_to_user=False
            )
            
            # Save to database
            session.add(guest_user)
            await session.flush()  
            session.add_all([balance, guest_session])
            await session.commit()
            await session.refresh(guest_user)
            await session.refresh(balance)
            
            # Set the balance relationship
            guest_user.balance = balance
            
            return guest_user, session_id
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create guest user: {str(e)}"
            )
    
    async def get_guest_user_by_session(
        self, 
        session: AsyncSession, 
        session_id: str
    ) -> Optional[User]:
        """Get guest user by session ID."""
        stmt = select(User).where(
            and_(
                User.guest_session_id == session_id,
                User.is_guest == True,
                User.guest_expires_at != None,
                User.guest_expires_at > datetime.utcnow() # type: ignore
            )
        )
        result = await session.execute(stmt)
        return result.scalars().first()
    
    
    async def get_guest_user_by_fingerprint(
        self, 
        session: AsyncSession, 
        ip_address: str,
        fingerprint: str
    ) -> Optional[User]:
        """Get guest user by IP and fingerprint."""
        stmt = select(User).where(
            and_(
                User.guest_ip_address == ip_address,
                User.is_guest == True,
                User.guest_expires_at != None,
                User.guest_expires_at > datetime.utcnow() # type: ignore
            )
        )
        result = await session.execute(stmt)
        return result.scalars().first()
    
    async def convert_guest_to_user(
        self,
        session: AsyncSession,
        guest_user: User,
        clerk_id: str,
        email: str,
        username: str,
        first_name: str = "",
        last_name: str = ""
    ) -> User:
        """
        Convert a guest user to a regular user.

        Args:
            session: Database session
            guest_user: The guest user to convert
            clerk_id: Clerk user ID
            email: User email
            username: Username
            first_name: User first name
            last_name: User last name

        Returns:
            Updated user object
        """
        if not guest_user.is_guest:
            raise HTTPException(
                status_code=400,
                detail="User is not a guest"
            )

        # Update user to regular user
        guest_user.clerk_id = clerk_id
        guest_user.email = email
        guest_user.username = username
        guest_user.first_name = first_name
        guest_user.last_name = last_name
        guest_user.is_guest = False
        guest_user.guest_session_id = None
        guest_user.guest_ip_address = None
        guest_user.guest_created_at = None
        guest_user.guest_expires_at = None
        
        # Upgrade credits to 200 (regular user amount)
        if guest_user.balance:
            guest_user.balance.credits = 200
            session.add(guest_user.balance)
        
        # Mark guest session as converted
        stmt = select(GuestSession).where(
            GuestSession.user_id == guest_user.id
        )
        result = await session.execute(stmt)
        guest_session = result.scalars().first()
        if guest_session:
            guest_session.converted_to_user = True
            guest_session.is_active = False
            session.add(guest_session)
        
        session.add(guest_user)
        
        try:
            await session.commit()
            await session.refresh(guest_user)
            return guest_user
        except Exception as e:
            await session.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to convert guest user: {str(e)}"
            )
    
    async def cleanup_expired_guests(self, session: AsyncSession) -> int:
        """
        Clean up expired guest users and their data.
        
        Returns:
            Number of guest users cleaned up
        """
        # Find expired guest users
        stmt = select(User).where(
            and_(
                User.is_guest == True,
                User.guest_expires_at != None,
                User.guest_expires_at < datetime.utcnow() # type: ignore
            )
        )
        result = await session.execute(stmt)
        expired_guests = result.scalars().all()
        
        count = 0
        for guest in expired_guests:
            # Delete the user (cascade will handle related data)
            await session.delete(guest)
            count += 1
        
        # Also clean up orphaned guest sessions
        stmt = select(GuestSession).where(
            GuestSession.expires_at < datetime.utcnow()
        )
        result = await session.execute(stmt)
        expired_sessions = result.scalars().all()
        
        for guest_session in expired_sessions:
            await session.delete(guest_session)
        
        await session.commit()
        return count
    
    async def _check_existing_guest_session(
        self, 
        session: AsyncSession, 
        ip_address: str
    ) -> None:
        """Check if IP already has an active guest session."""
        stmt = select(GuestSession).where(
            and_(
                GuestSession.ip_address == ip_address,
                GuestSession.is_active == True,
                GuestSession.expires_at > datetime.utcnow(),
                GuestSession.converted_to_user == False
            )
        )
        result = await session.execute(stmt)
        existing_session = result.scalars().first()
        
        if existing_session:
            raise HTTPException(
                status_code=403,
                detail="IP address already has an active guest session. Please sign up for a full account."
            )
    
    def _generate_session_id(self) -> str:
        """Generate a secure session ID."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    async def validate_guest_session(
        self,
        request: Request,
        session: AsyncSession
    ) -> Optional[User]:
        """
        Validate guest session from request headers.
        
        Args:
            request: FastAPI request
            session: Database session
            
        Returns:
            Guest user if valid session, None otherwise
        """
        # Get session ID from header
        session_id = request.headers.get("X-Guest-Session-ID")
        if not session_id:
            return None
        
        # Get guest user
        guest_user = await self.get_guest_user_by_session(session, session_id)
        if not guest_user:
            return None
        
        return guest_user
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


# Global guest auth manager
guest_auth_manager = GuestAuthManager()
