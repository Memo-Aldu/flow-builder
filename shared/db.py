"""
Improved database configuration module for flow-builder.

This module provides optimized database connections for different environments:
- API servers (FastAPI with connection pooling)
- Worker processes (long-running with connection pooling)
- Lambda functions (serverless with NullPool)
- Database initialization (one-time setup)

Key improvements:
- Fixed asyncpg compatibility issues with Supabase pooler
- Centralized configuration management
- Environment-specific connection optimization
- Proper SSL handling for Supabase
- Reduced code duplication
- Better error handling and maintainability

Usage:
- API/FastAPI: Use global `Session` or `get_session()` dependency
- Workers: Use `create_worker_engine_and_session()` for optimal pooling
- Lambda: Use `create_lambda_engine_and_session()` to avoid event loop issues
- Testing: Use `test_connection()` to verify database connectivity
"""

import os
import ssl
import uuid
from typing import Any, Dict, Optional
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)
from sqlalchemy import pool
from typing import AsyncGenerator


# Database configuration
class DatabaseConfig:
    """Centralized database configuration."""

    def __init__(self):
        self.user = os.getenv("DB_USER", os.getenv("DB_USERNAME", "root"))
        self.password = os.getenv("DB_PASSWORD", "rootpassword")
        self.host = os.getenv("DB_HOST", "localhost")
        self.port = os.getenv("DB_PORT", "5433")
        self.db_name = os.getenv("DB_NAME", "flow-builder")
        self.use_ssl = os.getenv("DB_USE_SSL", "true").lower() == "true"
        self.ssl_mode = os.getenv("DB_SSL_MODE", "require")

    @property
    def is_supabase_pooler(self) -> bool:
        """Check if we're using Supabase pooler."""
        return "pooler.supabase.com" in self.host

    def get_database_url(self) -> str:
        """Get the database URL with appropriate SSL configuration."""
        if self.use_ssl:
            return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.db_name}?ssl={self.ssl_mode}"
        else:
            return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.db_name}"


def _create_ssl_context() -> ssl.SSLContext:
    """Create SSL context for Supabase pooler connections."""
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return ssl_context


def _get_connect_args(app_name: str = "flow-builder") -> Dict[str, Any]:
    """Get connection arguments for asyncpg with proper Supabase compatibility."""
    config = DatabaseConfig()

    connect_args: Dict[str, Any] = {"server_settings": {"application_name": app_name}}

    # Configure for Supabase pooler compatibility
    if config.is_supabase_pooler:
        # Disable statement cache for pgbouncer compatibility
        connect_args.update(
            {
                "statement_cache_size": 0,
                "prepared_statement_cache_size": 0,
                "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
            }
        )

    # Configure SSL
    if config.use_ssl:
        if config.is_supabase_pooler:
            connect_args["ssl"] = _create_ssl_context()
        else:
            connect_args["ssl"] = True

    return connect_args


def get_database_url() -> str:
    """Get the database URL. Kept for backward compatibility."""
    return DatabaseConfig().get_database_url()


# Global database configuration
_db_config = DatabaseConfig()
DATABASE_URL = _db_config.get_database_url()

# Create global engine with improved asyncpg settings
# Note: Using default pooling for API/Worker compatibility
# Lambda functions should use create_lambda_engine_and_session() instead
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=_get_connect_args("flow-builder-api"),
)

# Global session maker
Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a new session from the global sessionmaker.

    Usage:
        @app.get("/users")
        async def get_users(session: AsyncSession = Depends(get_session)):
            # Use session here
    """
    async with Session() as session:
        yield session


def create_worker_engine_and_session() -> (
    tuple[AsyncEngine, async_sessionmaker[AsyncSession]]
):
    """
    For Worker processes: create a new engine + sessionmaker.
    Uses connection pooling suitable for long-running worker processes.
    """
    config = DatabaseConfig()

    worker_engine = create_async_engine(
        config.get_database_url(),
        echo=False,
        future=True,
        # Use default pooling for workers (not NullPool)
        connect_args=_get_connect_args("flow-builder-worker"),
    )

    worker_session = async_sessionmaker(
        worker_engine, class_=AsyncSession, expire_on_commit=False
    )

    return worker_engine, worker_session


def create_lambda_engine_and_session() -> (
    tuple[AsyncEngine, async_sessionmaker[AsyncSession]]
):
    """
    For AWS Lambda: create a new engine + sessionmaker each time.
    This avoids 'attached to a different loop' errors.
    Uses NullPool and optimized asyncpg settings for serverless environments.
    """
    config = DatabaseConfig()

    local_engine = create_async_engine(
        config.get_database_url(),
        echo=False,
        future=True,
        poolclass=pool.NullPool,  # Important for Lambda - no connection pooling
        connect_args=_get_connect_args("flow-builder-lambda"),
    )

    local_session = async_sessionmaker(
        local_engine, class_=AsyncSession, expire_on_commit=False
    )

    return local_engine, local_session


async def init_db() -> None:
    """
    Creates tables if needed, called once (e.g. at server startup).
    Uses optimized settings for database initialization.
    """
    config = DatabaseConfig()

    temp_engine = create_async_engine(
        config.get_database_url(),
        echo=False,
        future=True,
        poolclass=pool.NullPool,  # No pooling needed for one-time initialization
        connect_args=_get_connect_args("flow-builder-init"),
    )

    try:
        async with temp_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    finally:
        await temp_engine.dispose()


async def test_connection() -> bool:
    """
    Test database connection.

    Returns:
        True if connection is successful, False otherwise.
    """
    try:
        config = DatabaseConfig()
        test_engine = create_async_engine(
            config.get_database_url(),
            echo=False,
            future=True,
            poolclass=pool.NullPool,
            connect_args=_get_connect_args("flow-builder-test"),
        )

        async with test_engine.connect() as conn:
            from sqlalchemy import text

            await conn.execute(text("SELECT 1"))

        await test_engine.dispose()
        return True
    except Exception:
        return False


# Export commonly used items for backward compatibility
__all__ = [
    "DatabaseConfig",
    "get_database_url",
    "get_session",
    "create_lambda_engine_and_session",
    "create_worker_engine_and_session",
    "init_db",
    "test_connection",
    "engine",
    "Session",
    "DATABASE_URL",
]
