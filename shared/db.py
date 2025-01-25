import os

from sqlmodel import SQLModel
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.asyncio import async_sessionmaker


def get_db_password() -> str:
    return os.getenv("DB_PASSWORD", "rootpassword")


def get_db_user() -> str:
    return os.getenv("DB_USER", "root")


def get_db_host() -> str:
    return os.getenv("DB_HOST", "localhost")


def get_db_port() -> str:
    return os.getenv("DB_PORT", "5433")


DATABASE_URL = f"postgresql+asyncpg://{get_db_user()}:{get_db_password()}@{get_db_host()}:{get_db_port()}/flow-builder"

# Echo = True will log all the queries
engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# Session factory
async_session = async_sessionmaker(engine, expire_on_commit=False)


# Dependency to get the session
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


# Initialize the database
async def init_db() -> None:
    async with engine.begin() as conn:
        print("Creating tables")
        await conn.run_sync(SQLModel.metadata.create_all)
