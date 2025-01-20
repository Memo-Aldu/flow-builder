from contextlib import asynccontextmanager
from typing import AsyncGenerator, Union

from sqlmodel import select
from fastapi import Depends, FastAPI
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_session, init_db
from app.models import Workflow, WorkflowCreate
from app.auth import verify_clerk_token

app = FastAPI()

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    yield
    await app.state.db_engine.dispose()


@app.get("/ping")
async def pong() -> dict[str, str]:
    return {"ping": "pong!"}


@app.get("/workflows", response_model=list[Workflow])
async def get_workflows(session: AsyncSession = Depends(get_session)) -> list[Workflow]:
    result = await session.execute(select(Workflow))
    workflows = result.scalars().all()
    return [Workflow(name=workflow.name, id=workflow.id) for workflow in workflows]


@app.post("/workflows")
async def add_workflow(workflow: WorkflowCreate, session: AsyncSession = Depends(get_session)) -> Workflow:
    new_workflow = Workflow(name=workflow.name)
    session.add(new_workflow)
    await session.commit()
    await session.refresh(new_workflow)
    return new_workflow


@app.get("/protected")
async def protected_route(user_info: dict = Depends(verify_clerk_token)) -> dict[str, Union[str, int]]:
    print(user_info)
    return {
        "message": "This is a protected route!",
        "user_id": user_info["sub"]
    }