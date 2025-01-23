import enum
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, List, Dict, ClassVar
from sqlmodel import SQLModel, Field, Relationship, Column, JSON


class User(SQLModel, table=True):
    __tablename__: ClassVar[str] = "user"
    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    clerk_id: str = Field(index=True, unique=True)
    email: Optional[str] = None

    # Relationships
    workflows: List["Workflow"] = Relationship(back_populates="user")
    executions: List["WorkflowExecution"] = Relationship(back_populates="user")


#
# WORKFLOW
#


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DISABLED = "disabled"


class WorkflowBase(SQLModel):
    name: str
    description: Optional[str] = None
    # Store the blueprint of the workflow as JSON so it is queryable
    definition: Optional[Dict] = Field(default=None, sa_column=Column(JSON))

    # Compiled or structured plan
    execution_plan: Optional[Dict] = Field(default=None, sa_column=Column(JSON))

    cron: Optional[str] = None
    status: WorkflowStatus = Field(default=WorkflowStatus.DRAFT)

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    credits_cost: Optional[int] = None

    last_run_id: Optional[UUID] = None
    last_run_status: Optional[str] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None


class Workflow(WorkflowBase, table=True):
    __tablename__: ClassVar[str] = "workflow"

    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    user: Optional["User"] = Relationship(back_populates="workflows")
    executions: List["WorkflowExecution"] = Relationship(back_populates="workflow")


# Schemas for creation, reading, updating
class WorkflowCreate(WorkflowBase):
    """Fields allowed/required when creating a workflow."""

    pass


class WorkflowRead(WorkflowBase):
    """Fields returned when reading a workflow."""

    id: UUID


class WorkflowUpdate(SQLModel):
    """Fields allowed when updating an existing workflow."""

    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[Dict] = None
    execution_plan: Optional[Dict] = None
    cron: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    credits_cost: Optional[int] = None
    last_run_id: Optional[UUID] = None
    last_run_status: Optional[str] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None


#
# WORKFLOW EXECUTION
#


class ExecutionTrigger(str, enum.Enum):
    SCHEDULED = "scheduled"
    MANUAL = "manual"
    API = "api"


class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class WorkflowExecutionBase(SQLModel):
    workflow_id: UUID = Field(foreign_key="workflow.id", index=True)

    trigger: ExecutionTrigger = Field(default=ExecutionTrigger.MANUAL)
    status: ExecutionStatus = Field(default=ExecutionStatus.PENDING)

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    credits_consumed: Optional[int] = None


class WorkflowExecution(WorkflowExecutionBase, table=True):
    __tablename__: ClassVar[str] = "workflow_execution"
    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    workflow: Optional["Workflow"] = Relationship(back_populates="executions")
    user: Optional["User"] = Relationship(back_populates="executions")
    phases: List["ExecutionPhase"] = Relationship(back_populates="execution")


class WorkflowExecutionCreate(WorkflowExecutionBase):
    pass


class WorkflowExecutionRead(WorkflowExecutionBase):
    id: UUID


class WorkflowExecutionUpdate(SQLModel):
    trigger: Optional[ExecutionTrigger] = None
    status: Optional[ExecutionStatus] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    credits_consumed: Optional[int] = None


#
# EXECUTION PHASE (steps/tasks within an execution)
#


class ExecutionPhaseStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ExecutionPhaseBase(SQLModel):
    workflow_execution_id: UUID = Field(foreign_key="workflow_execution.id", index=True)

    # E.g: phase #1, #2, #3 in the pipeline
    number: int
    name: Optional[str] = None
    status: ExecutionPhaseStatus = Field(default=ExecutionPhaseStatus.PENDING)

    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    nodes: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    inputs: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    outputs: Optional[Dict] = Field(default=None, sa_column=Column(JSON))

    credits_consumed: Optional[int] = None


class ExecutionPhase(ExecutionPhaseBase, table=True):
    __tablename__: ClassVar[str] = "execution_phase"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    user: Optional["User"] = Relationship()
    execution: Optional["WorkflowExecution"] = Relationship(back_populates="phases")
    logs: List["ExecutionLog"] = Relationship(back_populates="phase")


class ExecutionPhaseCreate(ExecutionPhaseBase):
    pass


class ExecutionPhaseRead(ExecutionPhaseBase):
    id: UUID


#
# EXECUTION LOGS (logging messages within each phase)
#


class LogLevel(str, enum.Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class ExecutionLogBase(SQLModel):
    execution_phase_id: UUID = Field(foreign_key="execution_phase.id", index=True)
    log_level: LogLevel = Field(default=LogLevel.INFO)
    message: str

    timestamp: datetime = Field(default_factory=datetime.now)


class ExecutionLog(ExecutionLogBase, table=True):
    __tablename__: ClassVar[str] = "execution_log"
    id: UUID = Field(primary_key=True, default_factory=uuid4)

    phase: Optional["ExecutionPhase"] = Relationship(back_populates="logs")


class ExecutionLogCreate(ExecutionLogBase):
    pass


class ExecutionLogRead(ExecutionLogBase):
    id: UUID


#
# USER BALANCE
#


class UserBalanceBase(SQLModel):
    credits: int = 0


class UserBalance(UserBalanceBase, table=True):
    __tablename__: ClassVar[str] = "user_balance"
    user_id: UUID = Field(primary_key=True, foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.now)


#
# CREDENTIALS (e.g., for storing tokens securely)
#


class CredentialBase(SQLModel):
    name: str
    value: str


class Credential(CredentialBase, table=True):
    __tablename__: ClassVar[str] = "credential"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.now)


class CredentialCreate(CredentialBase):
    pass


class CredentialUpdate(SQLModel):
    name: Optional[str] = None
    value: Optional[str] = None


class CredentialRead(CredentialBase):
    id: UUID
    created_at: datetime


#
# USER PURCHASES (tracking top-ups or plan purchases)
#


class UserPurchaseBase(SQLModel):
    stripe_id: Optional[str] = None
    description: Optional[str] = None
    amount: int
    currency: str = "USD"
    date: datetime = Field(default_factory=datetime.now)


class UserPurchase(UserPurchaseBase, table=True):
    __tablename__: ClassVar[str] = "user_purchase"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True, primary_key=True)


class UserPurchaseCreate(UserPurchaseBase):
    pass


class UserPurchaseRead(UserPurchaseBase):
    id: UUID
