from copy import copy
from datetime import datetime
from typing import Any, Dict, List, Set
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    LogLevel,
    Workflow,
    WorkflowExecution,
    WorkflowExecutionUpdate,
    ExecutionPhase,
    ExecutionPhaseCreate,
    ExecutionPhaseUpdate,
    ExecutionPhaseStatus,
    ExecutionStatus,
    ExecutionLogCreate,
)
from shared.crud.log_crud import create_log
from shared.crud.execution_crud import update_execution
from shared.crud.phase_crud import create_phase, update_phase

from worker.runner import logger
from worker.runner.nodes import NODE_REGISTRY


class WorkflowRunner:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def run_workflow(
        self, workflow: Workflow, execution: WorkflowExecution
    ) -> ExecutionStatus:
        """Run the given workflow for the given execution."""
        await self.update_execution_status(execution, ExecutionStatus.RUNNING)

        plan = workflow.execution_plan or {}
        phases_def = plan.get("phases", [])

        phase_map, adjacency, reverse_adjacency, start_phases = self.build_phase_maps(
            phases_def
        )

        visited = set()
        queue = list(start_phases)
        phase_outputs: Dict[str, Dict[str, Any]] = {}
        executed_nodes: List[Dict[str, Any]] = []

        try:
            await self.process_phases(
                queue,
                visited,
                phase_map,
                adjacency,
                reverse_adjacency,
                execution,
                phase_outputs,
                executed_nodes,
            )
            await self.update_execution_status(execution, ExecutionStatus.COMPLETED)
            return ExecutionStatus.COMPLETED

        except Exception as e:
            logger.error(f"Workflow {workflow.id} execution failed: {str(e)}")
            await self.session.rollback()
            
            await self.update_execution_status(execution, ExecutionStatus.FAILED)
            return ExecutionStatus.FAILED

        finally:
            await self.cleanup_workflow(executed_nodes)

    def build_phase_maps(self, phases_def):
        """Build phase maps for the given phases definition."""
        phase_map = {p["id"]: p for p in phases_def}
        adjacency = {p["id"]: set(p.get("next_phases", [])) for p in phases_def}
        reverse_adjacency = {}

        for p in phases_def:
            pid = p["id"]
            for nxt in p.get("next_phases", []):
                reverse_adjacency.setdefault(nxt, set()).add(pid)

        all_phase_ids = set(phase_map.keys())
        child_phase_ids = (
            set().union(*adjacency.values()) if adjacency.values() else set()
        )
        start_phases = all_phase_ids - child_phase_ids
        return phase_map, adjacency, reverse_adjacency, start_phases

    async def process_phases(
        self,
        queue,
        visited,
        phase_map,
        adjacency,
        reverse_adjacency,
        execution,
        phase_outputs,
        executed_nodes,
    ) -> None:
        while queue:
            current_phase_id = queue.pop(0)

            if current_phase_id in visited:
                continue

            visited.add(current_phase_id)
            phase_def = phase_map[current_phase_id]
            out = await self.run_phase(
                execution, phase_def, phase_outputs, reverse_adjacency, executed_nodes
            )
            phase_outputs[current_phase_id] = out

            for nxt_id in adjacency[current_phase_id]:
                preds = reverse_adjacency.get(nxt_id, set())
                if all(pred in visited for pred in preds):
                    if nxt_id not in visited and nxt_id not in queue:
                        queue.append(nxt_id)

    async def run_phase(
        self,
        execution: WorkflowExecution,
        phase_def: Dict[str, Any],
        phase_outputs: Dict[str, Dict[str, Any]],
        reverse_adjacency: Dict[str, Set[str]],
        executed_nodes: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Run all nodes in the given phase, gather outputs, return them.
        """
        phase_id = phase_def["id"]
        node_def = phase_def.get("node", {})

        if not node_def:
            raise ValueError(f"Phase {phase_id} does not have a valid node definition")

        # Create a new DB record for this phase
        exec_phase = await self.create_phase(execution, phase_def)

        # Mark it as RUNNING
        await self.update_phase(
            exec_phase,
            {"status": ExecutionPhaseStatus.RUNNING, "started_at": datetime.now()},
        )

        combined_inputs = {}
        preds = reverse_adjacency.get(phase_id, set())
        for pid in preds:
            combined_inputs.update(phase_outputs.get(pid, {}))

        local_context = copy(combined_inputs)

        try:
            node_name = node_def.get("name")
            node_type = node_def.get("type")

            await self.log_message(
                exec_phase, f"Starting node: {node_name} ({node_type})"
            )

            executor_cls = NODE_REGISTRY.get(node_type)
            if not executor_cls:
                raise ValueError(f"Node type {node_type} not found in registry")

            executor = executor_cls(self.session)
            node_outputs = await executor.run(node_def, context=local_context)

            if node_outputs:
                local_context.update(node_outputs)

            # Store the executor and local_context so we can do final cleanup
            executed_nodes.append({"executor": executor, "context": local_context})

            logger.info(f"Node {node_name} completed with outputs: {node_outputs}")

            # Mark phase completed
            await self.update_phase(
                exec_phase,
                {
                    "status": ExecutionPhaseStatus.COMPLETED,
                    "completed_at": datetime.now(),
                    "outputs": node_outputs,
                },
            )

            return local_context

        except Exception as e:
            await self.log_message(
                exec_phase, f"Node failed: {str(e)}", log_level=LogLevel.ERROR
            )
            await self.update_phase(
                exec_phase,
                {
                    "status": ExecutionPhaseStatus.FAILED,
                    "completed_at": datetime.now(),
                    "outputs": {},
                },
            )
            raise

    async def cleanup_workflow(self, executed_nodes: List[Dict[str, Any]]) -> None:
        """Clean up all executed nodes in reverse order ONCE, after workflow finishes/fails."""
        logger.info("Starting final workflow cleanup process.")
        for node_entry in reversed(executed_nodes):
            executor = node_entry["executor"]
            context = node_entry["context"]
            try:
                logger.info(f"Cleaning up {executor.__class__.__name__}...")
                await executor.cleanup(context)
            except Exception as e:
                logger.warning(
                    f"Error during cleanup of {executor.__class__.__name__}: {str(e)}"
                )

    async def create_phase(
        self, execution: WorkflowExecution, phase_def: Dict[str, Any]
    ) -> ExecutionPhase:
        node = phase_def.get("node", {})
        new_phase = ExecutionPhaseCreate(
            number=0,
            workflow_execution_id=execution.id,
            name=phase_def.get("name"),
            inputs=node.get("inputs", {}),
            node=node,
            status=ExecutionPhaseStatus.PENDING,
        )
        return await create_phase(
            self.session, execution.id, execution.user_id, new_phase
        )

    async def update_phase(
        self, phase: ExecutionPhase, phase_data: Dict[str, Any]
    ) -> ExecutionPhase:
        update_data = ExecutionPhaseUpdate(**phase_data)
        return await update_phase(self.session, phase, update_data)

    async def log_message(
        self, phase: ExecutionPhase, message: str, log_level: LogLevel = LogLevel.INFO
    ) -> None:
        log_data = ExecutionLogCreate(
            execution_phase_id=phase.id,
            message=message,
            log_level=log_level,
        )
        await create_log(self.session, log_data)

    async def update_execution_status(
        self, execution: WorkflowExecution, status: ExecutionStatus
    ) -> None:
        await update_execution(
            self.session,
            execution,
            WorkflowExecutionUpdate(
                status=status,
                started_at=(
                    datetime.now()
                    if status == ExecutionStatus.RUNNING
                    else execution.started_at
                ),
                completed_at=(
                    datetime.now()
                    if status in (ExecutionStatus.COMPLETED, ExecutionStatus.FAILED)
                    else None
                ),
            ),
        )
