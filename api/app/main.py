import os
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
from fastapi.responses import JSONResponse


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


# Global exception handler for production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler to prevent sensitive information leakage."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)

    # In production, don't expose internal error details
    if os.getenv("ENVIRONMENT") == "production":
        return JSONResponse(
            status_code=500, content={"detail": "Internal server error"}
        )
    else:
        # In development, show more details
        return JSONResponse(status_code=500, content={"detail": str(exc)})


# Add rate limiting
app.state.limiter = hybrid_limiter.limiter
app.add_exception_handler(
    RateLimitExceeded,
    global_exception_handler,
)

# Configure CORS origins based on environment
cors_origins = ["*"]  # Default to allow all origins
if frontend_url := os.getenv("FRONTEND_URL"):
    cors_origins = [frontend_url]
if clerk_frontend_url := os.getenv("CLERK_FRONTEND_URL"):
    if clerk_frontend_url not in cors_origins:
        cors_origins.append(clerk_frontend_url)

# In production, be more restrictive
if os.getenv("ENVIRONMENT") == "production":
    # Remove wildcard if we have specific origins
    if len(cors_origins) > 1 and "*" in cors_origins:
        cors_origins.remove("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
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
    from shared.db import test_connection

    # Test database connectivity
    db_healthy = await test_connection()

    if db_healthy:
        return {"status": "healthy", "database": "connected"}
    else:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=503, detail={"status": "unhealthy", "database": "disconnected"}
        )
