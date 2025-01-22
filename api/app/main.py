from fastapi import FastAPI
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from shared.db import init_db
from api.app.routers import credentials, users, workflows
from api.app.routers import executions, users, workflows, credentials


app = FastAPI(
    title="Workflow Builder Service",
    summary="A service for building and executing workflows",
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    yield
    await app.state.engine.dispose()


app = FastAPI(lifespan=lifespan)

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
app.include_router(
    credentials.router, prefix="/api/v1/credentials", tags=["Credentials"]
)
app.include_router(executions.router, prefix="/api/v1/executions", tags=["Executions"])


@app.get("/ping")
async def pong() -> dict[str, str]:
    return {"ping": "pong!"}
