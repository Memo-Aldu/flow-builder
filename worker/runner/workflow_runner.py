from uuid import uuid4, UUID
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
from worker.runner.environment import Environment, Node, Phase


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

        env = Environment()

        try:
            await self.process_phases(
                queue, visited, phase_map, adjacency, reverse_adjacency, execution, env
            )
            await self.update_execution_status(execution, ExecutionStatus.COMPLETED)
            return ExecutionStatus.COMPLETED

        except Exception as e:
            logger.error(f"Workflow {workflow.id} execution failed: {str(e)}")
            await self.update_execution_status(execution, ExecutionStatus.FAILED)
            return ExecutionStatus.FAILED

        finally:
            await env.cleanup()

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
        queue: List[str],
        visited: Set[str],
        phase_map: Dict[str, Any],
        adjacency: Dict[str, Set[str]],
        reverse_adjacency: Dict[str, Set[str]],
        execution: WorkflowExecution,
        env: Environment,
    ) -> None:
        """Process all phases in the given order. BFS traversal."""
        while queue:
            current_phase_id = queue.pop(0)

            if current_phase_id in visited:
                continue

            visited.add(current_phase_id)
            phase_def = phase_map[current_phase_id]

            await self.run_phase(execution, phase_def, env)

            for nxt_id in adjacency[current_phase_id]:
                preds = reverse_adjacency.get(nxt_id, set())
                if all(pred in visited for pred in preds):
                    if nxt_id not in visited and nxt_id not in queue:
                        queue.append(nxt_id)

    def assemble_node_inputs(
        self, inputs_mapping: Dict[str, Any], env: Environment
    ) -> Dict[str, Any]:
        final_inputs = {}
        for input_key, mapping in inputs_mapping.items():
            map_type = mapping.get("type")
            if map_type == "literal":
                final_inputs[input_key] = mapping["value"]
            elif map_type == "reference":
                from_node_id = mapping["fromNodeId"]
                output_key = mapping["outputKey"]
                # Pull from env.resources
                if from_node_id not in env.resources:
                    raise ValueError(
                        f"Node outputs for {from_node_id} not found in environment resources."
                    )
                parent_outputs = env.resources[from_node_id]
                if output_key not in parent_outputs:
                    raise ValueError(
                        f"Output '{output_key}' not found in node {from_node_id}'s outputs."
                    )
                final_inputs[input_key] = parent_outputs[output_key]
            else:
                # If there's no 'type', treat the entire mapping as a literal
                final_inputs[input_key] = mapping
        return final_inputs

    async def run_phase(
        self,
        execution: WorkflowExecution,
        phase_def: Dict[str, Any],
        env: Environment,
    ) -> Dict[str, Any]:
        """Run all nodes in the given phase, gather outputs, return them."""
        phase_id = phase_def["id"]
        phase_name = phase_def.get("name", "Unnamed Phase")
        node_def = phase_def.get("node", {})

        # Create a new DB record for this phase
        exec_phase = await self.create_phase(execution, phase_def)
        phase_obj = env.create_phase(exec_phase.id, phase_name)

        # Mark the phase as running
        phase_started_at = datetime.now()
        await self.update_phase(
            exec_phase,
            {"status": ExecutionPhaseStatus.RUNNING, "started_at": phase_started_at},
        )
        phase_obj.status = ExecutionPhaseStatus.RUNNING
        phase_obj.start_time = phase_started_at

        if not node_def:
            msg = f"Phase {phase_id} has no node definition"
            phase_obj.add_log(msg, LogLevel.ERROR)
            raise ValueError(msg)

        node_name = node_def.get("name", f"Node_{phase_id}")
        node_type = node_def.get("type")

        inputs_mapping = node_def.get("inputsMapping", {})
        node_inputs = self.assemble_node_inputs(inputs_mapping, env)

        node_obj = Node(
            id=uuid4(),
            name=node_name,
            type=node_type,
            start_time=datetime.now(),
            end_time=None,
            inputs=node_inputs,
            outputs={},
        )
        phase_obj.node = node_obj

        phase_obj.add_log(f"Starting node: {node_name} ({node_type})")

        executor_cls = NODE_REGISTRY.get(node_type)
        if not executor_cls:
            err_msg = f"Node type {node_type} not found in registry"
            phase_obj.add_log(err_msg, LogLevel.ERROR)
            raise ValueError(err_msg)

        try:
            executor = executor_cls(self.session)
            node_outputs = await executor.run(node_obj, env)

            env.resources[str(phase_id)] = node_outputs

            node_obj.end_time = datetime.now()
            node_obj.outputs = node_outputs or {}

            phase_obj.add_log(
                f"Node {node_name} completed with outputs: {node_outputs}"
            )

            await self.update_phase(
                exec_phase,
                {
                    "status": ExecutionPhaseStatus.COMPLETED,
                    "completed_at": datetime.now(),
                    "outputs": node_outputs,
                    "node": node_obj.to_dict(),
                },
            )

            await self.flush_phase_logs_to_db(exec_phase.id, phase_obj)

            return node_outputs or {}

        except Exception as e:
            logger.warning(f"Node failed: {str(e)}")
            phase_obj.add_log(f"Node failed: {str(e)}", LogLevel.ERROR)
            node_obj.end_time = datetime.now()
            await self.flush_phase_logs_to_db(exec_phase.id, phase_obj)

            await self.update_phase(
                exec_phase,
                {
                    "status": ExecutionPhaseStatus.FAILED,
                    "completed_at": datetime.now(),
                    "outputs": {},
                },
            )
            raise

    async def flush_phase_logs_to_db(self, phase_id: UUID, phase_obj: Phase) -> None:
        """Insert logs from phase_obj.logs into the DB."""
        for log in phase_obj.logs:
            log_entry = ExecutionLogCreate(
                execution_phase_id=phase_id,
                message=log["message"],
                log_level=log["level"],
                timestamp=log["timestamp"],
            )
            await create_log(self.session, log_entry)
        phase_obj.logs.clear()

    async def create_phase(
        self, execution: WorkflowExecution, phase_def: Dict[str, Any]
    ) -> ExecutionPhase:
        """Create a new phase for the given execution."""
        node = phase_def.get("node", {})
        new_phase = ExecutionPhaseCreate(
            number=phase_def.get("number", 0),
            workflow_execution_id=execution.id,
            name=phase_def.get("name", "Unnamed Phase"),
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
        """Update the given phase with the given data."""
        update_data = ExecutionPhaseUpdate(**phase_data)
        return await update_phase(self.session, phase, update_data)

    async def update_execution_status(
        self, execution: WorkflowExecution, status: ExecutionStatus
    ) -> None:
        """Update the status of the given execution."""
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
