import enum
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional, List, Dict, ClassVar
from pytz import timezone
from sqlmodel import DateTime, SQLModel, Field, Relationship, Column, JSON, ForeignKey
from sqlalchemy import LargeBinary


class User(SQLModel, table=True):
    __tablename__: ClassVar[str] = "user"
    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    clerk_id: str = Field(index=True, unique=True)
    email: Optional[str] = None
    username: Optional[str] = None

    workflows: List["Workflow"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    executions: List["WorkflowExecution"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    credentials: List["Credential"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    db_secrets: List["DbSecret"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    purchases: List["UserPurchase"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    balance: Optional["UserBalance"] = Relationship(back_populates="user")


#
# WORKFLOW
#


class WorkflowStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    DISABLED = "disabled"


class ExecutionStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class WorkflowBase(SQLModel):
    name: str
    description: Optional[str] = None

    active_version_id: Optional[UUID] = Field(
        default=None,
        foreign_key="workflow_version.id",
        description="References the workflow_version.id that is active",
    )

    cron: Optional[str] = None
    status: WorkflowStatus = Field(default=WorkflowStatus.DRAFT)

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )

    credits_cost: Optional[int] = None

    last_run_id: Optional[UUID] = None
    last_run_status: Optional[str] = None
    last_run_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True)), default=None
    )
    next_run_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True)), default=None
    )


class Workflow(WorkflowBase, table=True):
    __tablename__: ClassVar[str] = "workflow"

    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    user: Optional["User"] = Relationship(back_populates="workflows")
    executions: List["WorkflowExecution"] = Relationship(
        back_populates="workflow", cascade_delete=True
    )

    versions: List["WorkflowVersion"] = Relationship(
        back_populates="workflow",
        sa_relationship_kwargs={
            "foreign_keys": "[WorkflowVersion.workflow_id]",
            "primaryjoin": "Workflow.id == WorkflowVersion.workflow_id",
            "cascade": "all, delete-orphan",
            "passive_deletes": True,
        },
    )
    active_version: Optional["WorkflowVersion"] = Relationship(
        sa_relationship_kwargs={
            "uselist": False,
            "foreign_keys": "[Workflow.active_version_id]",
            "primaryjoin": "WorkflowVersion.id == Workflow.active_version_id",
        }
    )


# Schemas for creation, reading, updating
class WorkflowCreate(WorkflowBase):
    """Fields allowed/required when creating a workflow."""

    name: str
    description: Optional[str] = None
    cron: Optional[str] = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    credits_cost: Optional[int] = None


class WorkflowRead(WorkflowBase):
    """Fields returned when reading a workflow."""

    id: UUID


class WorkflowUpdate(SQLModel):
    """Fields allowed when updating an existing workflow."""

    name: Optional[str] = None
    description: Optional[str] = None
    cron: Optional[str] = None
    status: Optional[WorkflowStatus] = None
    credits_cost: Optional[int] = None
    last_run_id: Optional[UUID] = None
    last_run_status: Optional[ExecutionStatus] = None
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    definition: Optional[Dict] = None
    execution_plan: Optional[List] = None
    active_version_id: Optional[UUID] = None


class WorkflowPublish(SQLModel):
    """Fields required to publish a workflow."""

    execution_plan: List
    definition: Dict
    credits_cost: int


#
# Workflow Versioning
#


class WorkflowVersionBase(SQLModel):
    version_number: int = Field(
        index=True, description="Monotonically increasing version number"
    )
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )

    definition: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    execution_plan: Optional[List] = Field(default=None, sa_column=Column(JSON))
    is_active: Optional[bool] = Field(default=False)

    created_by: Optional[str] = Field(
        default=None, description="User who created this version"
    )
    parent_version_id: Optional[UUID] = Field(
        default=None, foreign_key="workflow_version.id"
    )


class WorkflowVersion(WorkflowVersionBase, table=True):
    __tablename__: ClassVar[str] = "workflow_version"

    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    workflow_id: UUID = Field(
        sa_column=Column(
            ForeignKey("workflow.id", ondelete="CASCADE"), index=True, nullable=False
        )
    )

    workflow: "Workflow" = Relationship(
        back_populates="versions",
        sa_relationship_kwargs={
            "foreign_keys": "[WorkflowVersion.workflow_id]",
            "primaryjoin": "Workflow.id == WorkflowVersion.workflow_id",
        },
    )

    parent_version: Optional["WorkflowVersion"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[WorkflowVersion.parent_version_id]",
            "primaryjoin": "WorkflowVersion.id == WorkflowVersion.parent_version_id",
            "uselist": False,
        },
    )


class WorkflowVersionCreate(WorkflowVersionBase):
    pass


class WorkflowVersionRead(WorkflowVersionBase):
    id: UUID


#
# WORKFLOW EXECUTION
#


class ExecutionTrigger(str, enum.Enum):
    SCHEDULED = "scheduled"
    MANUAL = "manual"
    API = "api"


class WorkflowExecutionBase(SQLModel):
    workflow_id: UUID = Field(foreign_key="workflow.id", index=True)

    trigger: ExecutionTrigger = Field(default=ExecutionTrigger.MANUAL)
    status: ExecutionStatus = Field(default=ExecutionStatus.PENDING)

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )
    started_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True)), default=None
    )
    completed_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True)), default=None
    )
    credits_consumed: Optional[int] = None


class WorkflowExecution(WorkflowExecutionBase, table=True):
    __tablename__: ClassVar[str] = "workflow_execution"
    id: UUID = Field(primary_key=True, index=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    workflow: Optional["Workflow"] = Relationship(back_populates="executions")
    user: Optional["User"] = Relationship(back_populates="executions")
    phases: List["ExecutionPhase"] = Relationship(
        back_populates="execution", cascade_delete=True
    )


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

    started_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )
    completed_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True)), default=None
    )

    node: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    inputs: Optional[Dict] = Field(default=None, sa_column=Column(JSON))
    outputs: Optional[Dict] = Field(default=None, sa_column=Column(JSON))

    credits_consumed: Optional[int] = None


class ExecutionPhase(ExecutionPhaseBase, table=True):
    __tablename__: ClassVar[str] = "execution_phase"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    execution: Optional["WorkflowExecution"] = Relationship(back_populates="phases")
    logs: List["ExecutionLog"] = Relationship(
        back_populates="phase", cascade_delete=True
    )


class ExecutionPhaseCreate(ExecutionPhaseBase):
    pass


class ExecutionPhaseRead(ExecutionPhaseBase):
    id: UUID


class ExecutionPhaseUpdate(SQLModel):
    status: Optional[ExecutionPhaseStatus] = None
    completed_at: Optional[datetime] = None
    outputs: Optional[Dict] = None
    node: Optional[Dict] = None
    credits_consumed: Optional[int] = None


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

    timestamp: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )


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
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )
    user: Optional["User"] = Relationship(back_populates="balance")


class UserBalanceCreate(UserBalanceBase):
    pass


class UserBalanceRead(UserBalanceBase):
    user_id: UUID
    credits: int = 0
    updated_at: datetime


#
# DB SECRETS (for storing encrypted secrets in the database)
#


class DbSecretBase(SQLModel):
    """Base model for database-stored encrypted secrets."""

    pass


class DbSecret(DbSecretBase, table=True):
    """Model for storing encrypted secrets in the database."""

    __tablename__: ClassVar[str] = "db_secret"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    # Store the encrypted value and nonce as binary data
    encrypted_value: bytes = Field(
        sa_column=Column("encrypted_value", type_=LargeBinary)
    )
    nonce: bytes = Field(sa_column=Column("nonce", type_=LargeBinary))
    user_id: UUID = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )

    user: Optional["User"] = Relationship(back_populates="db_secrets")


# CREDENTIALS (e.g., for storing tokens securely)
#


class CredentialBase(SQLModel):
    name: str


class Credential(CredentialBase, table=True):
    __tablename__: ClassVar[str] = "credential"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    # Can be either an AWS ARN or a DB secret ID
    secret_arn: str = Field(index=True)
    # Flag to indicate if this is a DB secret or AWS secret
    is_db_secret: bool = Field(default=False)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )

    user: Optional["User"] = Relationship(back_populates="credentials")


class CredentialCreate(CredentialBase):
    value: str


class CredentialRead(CredentialBase):
    id: UUID
    name: str
    created_at: datetime


#
# USER PURCHASES (tracking top-ups or plan purchases)
#


class UserPurchaseBase(SQLModel):
    stripe_id: Optional[str] = None
    description: Optional[str] = None
    amount: int
    currency: str = "USD"
    date: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )


class UserPurchase(UserPurchaseBase, table=True):
    __tablename__: ClassVar[str] = "user_purchase"
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    user: Optional["User"] = Relationship(back_populates="purchases")


class UserPurchaseCreate(UserPurchaseBase):
    pass


class UserPurchaseRead(UserPurchaseBase):
    id: UUID
    description: Optional[str] = None
    amount: int
    currency: str = "USD"
    date: datetime = Field(
        sa_column=Column(DateTime(timezone=True)),
        default_factory=lambda: datetime.now(tz=timezone("US/Eastern")),
    )
    stripe_id: Optional[str] = Field(default=None, exclude=True)
