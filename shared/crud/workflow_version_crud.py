from typing import Optional
from uuid import UUID

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    WorkflowVersion,
)


async def get_workflow_version_by_id(
    session: AsyncSession, workflow_id: UUID, workflow_version_id: UUID
) -> Optional[WorkflowVersion]:
    stmt = select(WorkflowVersion).where(
        WorkflowVersion.workflow_id == workflow_id,
        WorkflowVersion.id == workflow_version_id,
    )
    result = await session.execute(stmt)
    return result.scalars().first()
