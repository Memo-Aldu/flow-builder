from uuid import UUID
from datetime import datetime
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from playwright.async_api import Browser, Playwright, Page
from shared.models import LogLevel

@dataclass
class Node:
    id: UUID
    name: str
    type: str
    start_time: datetime
    end_time: Optional[datetime]
    inputs: Dict[str, Any] = field(default_factory=dict)
    outputs: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Phase:
    id: UUID
    name: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    logs: List[Dict[str, Any]] = field(default_factory=list)
    node: Optional[Node] = None

    def add_log(self, message: str, level: LogLevel = LogLevel.INFO) -> None:
        self.logs.append({
            "message": message,
            "level": level,
            "timestamp": datetime.now()
        })

class Environment:
    """
    Holds ephemeral data (phases, browser, playwright, etc.) for the workflow execution.
    """
    def __init__(self) -> None:
        self.phases: Dict[UUID, Phase] = {}
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright: Optional[Playwright] = None

    def create_phase(
        self, phase_id: UUID, name: str
    ) -> Phase:
        phase = Phase(
            id=phase_id,
            name=name,
            status="pending",
            start_time=datetime.now(),
            end_time=None,
        )
        self.phases[phase_id] = phase
        return phase

    def get_phase(self, phase_id: UUID) -> Phase:
        return self.phases[phase_id]
    
    def get_phase_of_node(self, node_id: UUID) -> Phase:
        for phase in self.phases.values():
            if phase.node and phase.node.id == node_id:
                return phase
        raise ValueError(f"No phase found for node {node_id}")

    async def cleanup(self) -> None:
        """
        Cleanup all resources from the environment (browser, playwright, etc.).
        """
        if self.page:
            await self.page.close()
            self.page = None
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
