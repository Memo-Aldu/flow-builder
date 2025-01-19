from sqlmodel import SQLModel, Field
from typing import Optional


class WorkflowBase(SQLModel):
    name: str


class Workflow(WorkflowBase, table=True):
    id: int = Field(default=None, nullable=False, primary_key=True)


class WorkflowCreate(WorkflowBase):
    pass