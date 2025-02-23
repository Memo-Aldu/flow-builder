from enum import Enum
from typing import List, Optional
from uuid import UUID

from sqlmodel import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    WorkflowVersion,
    WorkflowVersionCreate,
)


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    CREATED_AT = "created_at"
    CREATED_BY = "created_by"
    VERSION_NUMBER = "version_number"


async def get_workflow_version_by_version(
    session: AsyncSession, workflow_id: UUID, version: int
) -> Optional[WorkflowVersion]:
    stmt = select(WorkflowVersion).where(
        WorkflowVersion.workflow_id == workflow_id,
        WorkflowVersion.version_number == version,
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def get_workflow_versions_by_workflow_id(
    session: AsyncSession,
    workflow_id: UUID,
    page: int = 1,
    limit: int = 10,
    sort: SortField = SortField.VERSION_NUMBER,
    order: SortOrder = SortOrder.DESC,
) -> List[WorkflowVersion]:
    stmt = (
        select(WorkflowVersion)
        .where(WorkflowVersion.workflow_id == workflow_id)
        .order_by(
            getattr(WorkflowVersion, sort).desc()
            if order == "desc"
            else getattr(WorkflowVersion, sort).asc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [workflow_version for workflow_version in result.scalars().all()]


async def create_new_workflow_version(
    session: AsyncSession,
    workflow_id: UUID,
    user_id: UUID,
    workflow_version: WorkflowVersionCreate,
) -> WorkflowVersion:
    stmt = select(func.max(WorkflowVersion.version_number)).where(
        WorkflowVersion.workflow_id == workflow_id
    )
    result = await session.execute(stmt)
    current_max = result.scalar() or 0
    new_version_num = current_max + 1

    new_version = WorkflowVersion(
        workflow_id=workflow_id,
        created_by=user_id,
        version_number=new_version_num,
        **workflow_version.model_dump(
            exclude={"workflow_id", "version_number", "created_by"}
        ),
    )

    session.add(new_version)
    await session.commit()
    await session.refresh(new_version)

    return new_version
