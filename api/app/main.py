from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from shared.db import init_db
from api.app.routers import (
    balances,
    credentials,
    purchases,
    users,
    workflows,
    phases,
    logs,
    versions,
    executions,
    guest,
)
from api.app import logger
from api.app.middleware.hybrid_rate_limit import hybrid_limiter


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize and dispose of the database engine."""
    logger.info("Initializing database connection")
    await init_db()
    yield
    await _app.state.engine.dispose()


app = FastAPI(
    title="Workflow Builder Service",
    summary="A service for building and executing workflows",
    lifespan=lifespan,
)

# Add rate limiting
app.state.limiter = hybrid_limiter.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(balances.router, prefix="/api/v1/balances", tags=["Balances"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
app.include_router(
    versions.router, prefix="/api/v1/workflows", tags=["WorkflowVersions"]
)
app.include_router(
    credentials.router, prefix="/api/v1/credentials", tags=["Credentials"]
)
app.include_router(executions.router, prefix="/api/v1/executions", tags=["Executions"])
app.include_router(phases.router, prefix="/api/v1/phases", tags=["ExecutionPhase"])
app.include_router(logs.router, prefix="/api/v1/logs", tags=["ExecutionLogs"])
app.include_router(purchases.router, prefix="/api/v1/purchases", tags=["Purchases"])
app.include_router(guest.router, prefix="/api/v1/guest", tags=["Guest"])


@app.get("/ping")
@hybrid_limiter.limiter.limit("100/minute")
async def pong(request: Request) -> dict[str, str]:
    """Basic ping endpoint with rate limiting."""
    return {"ping": "pong!"}


@app.get("/health")
@hybrid_limiter.limiter.limit("100/minute")
async def health_check(request: Request) -> dict[str, str]:
    """Health check endpoint for ECS container health checks."""
    return {"status": "healthy"}
