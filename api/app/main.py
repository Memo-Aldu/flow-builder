from typing import Union

from sqlmodel import select
from fastapi import Depends, FastAPI
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_session, init_db
from app.models import Workflow, WorkflowCreate

app = FastAPI()

@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


@app.get("/ping")
async def pong() -> dict[str, str]:
    return {"ping": "pong!"}


@app.get("/workflows", response_model=list[Workflow])
async def get_workflows(session: AsyncSession = Depends(get_session)) -> Union[list[Workflow], dict[str, str]]:
    result = await session.execute(select(Workflow))
    workflows = result.scalars().all()
    return [Workflow(name=workflow.name, id=workflow.id) for workflow in workflows]


@app.post("/workflows")
async def add_workflow(workflow: WorkflowCreate, session: AsyncSession = Depends(get_session)) -> Union[Workflow, dict[str, str]]:
    workflow = Workflow(name=workflow.name)
    session.add(workflow)
    await session.commit()
    await session.refresh(workflow)
    return workflow