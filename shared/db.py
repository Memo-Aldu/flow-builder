import os
from typing import Any, Dict
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    AsyncEngine,
)
from typing import AsyncGenerator


def get_database_url() -> str:
    user = os.getenv("DB_USER", os.getenv("DB_USERNAME", "root"))
    password = os.getenv("DB_PASSWORD", "rootpassword")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5433")
    db_name = os.getenv("DB_NAME", "flow-builder")

    # Check if SSL should be enabled
    use_ssl = os.getenv("DB_USE_SSL", "true").lower() == "true"

    if use_ssl:
        # Add SSL parameters for Render database
        ssl_mode = os.getenv("DB_SSL_MODE", "require")
        # Add SSL parameters to the connection string
        return (
            f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}?ssl={ssl_mode}"
        )
    else:
        # No SSL for local development
        return (
            f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}"
        )


DATABASE_URL = get_database_url()

use_ssl = os.getenv("DB_USE_SSL", "true").lower() == "true"

connect_args: Dict[str, Any] = {"server_settings": {"application_name": "flow-builder-lambda"}}
if use_ssl:
    connect_args["ssl"] = True

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args,
)
Session = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a new session from the global sessionmaker.
    """
    async with Session() as session:
        yield session


def create_lambda_engine_and_session() -> (
    tuple[AsyncEngine, async_sessionmaker[AsyncSession]]
):
    """
    For AWS Lambda: create a new engine + sessionmaker each time.
    This avoids 'attached to a different loop' errors.
    """
    use_ssl = os.getenv("DB_USE_SSL", "true").lower() == "true"

    connect_args: Dict[str, Any] = {"server_settings": {"application_name": "flow-builder-lambda"}}
    if use_ssl:
        connect_args["ssl"] = True

    local_engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        connect_args=connect_args,
    )
    local_session = async_sessionmaker(local_engine, expire_on_commit=False)
    return local_engine, local_session


async def init_db() -> None:
    """
    Creates tables if needed, called once (e.g. at server startup).
    """
    db_url = get_database_url()

    # Check if SSL should be enabled
    use_ssl = os.getenv("DB_USE_SSL", "true").lower() == "true"

    connect_args = {}
    if use_ssl:
        connect_args["ssl"] = True

    temp_engine = create_async_engine(db_url, echo=False, future=True, connect_args=connect_args)
    async with temp_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    await temp_engine.dispose()
