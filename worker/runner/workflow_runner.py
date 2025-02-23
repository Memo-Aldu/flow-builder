import asyncio
from uuid import UUID, uuid4
from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession

from shared.crud.balance_crud import decrement_balance
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
from worker.runner.nodes import NODE_CREDIT_COSTS, NODE_REGISTRY
from worker.runner.environment import Environment, Node, Phase


class WorkflowRunner:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def run_workflow(
        self, workflow: Workflow, execution: WorkflowExecution
    ) -> ExecutionStatus:
        """
        Run the workflow by executing each node in the execution plan.
        """
        await self.update_execution(execution, ExecutionStatus.RUNNING)

        if not workflow.active_version:
            logger.error(f"Workflow {workflow.id} has no active version.")
            await self.update_execution(execution, ExecutionStatus.FAILED)
            return ExecutionStatus.FAILED

        phases_list = workflow.active_version.execution_plan or []

        definition = workflow.active_version.definition or {}
        all_edges = definition.get("edges", [])

        env = Environment()
        total_credits_consumed = 0

        try:
            # Create all the phases in the DB first
            for phase_info in phases_list:
                # run_nodes_in_phase returns the sum of credits used by that phase
                phase_credits = await self.run_nodes_in_phase(
                    execution, phase_info, all_edges, env
                )
                total_credits_consumed += phase_credits

            # If all phases succeed, mark execution as COMPLETED
            await self.update_execution(
                execution, ExecutionStatus.COMPLETED, total_credits_consumed
            )
            return ExecutionStatus.COMPLETED
        except Exception as e:
            logger.error(f"Workflow {workflow.id} execution failed: {str(e)}")
            await self.update_execution(
                execution, ExecutionStatus.FAILED, total_credits_consumed
            )
            return ExecutionStatus.FAILED
        finally:
            await env.cleanup()

    async def run_nodes_in_phase(
        self,
        execution: WorkflowExecution,
        phase_info: Dict[str, Any],
        edges: List[Dict[str, Any]],
        env: Environment,
    ) -> int:
        """
        Given a 'phase_info' that may contain multiple nodes,
        run each node in sequence. Each node is recorded as a separate
        ExecutionPhase in the DB. If any node fails, we update that node's
        phase record to FAILED (including partial credits) and re-raise.
        Returns the total credits consumed by this phase.
        """
        phase_index = phase_info.get("phase", 0)
        node_entries = phase_info.get("nodes", [])
        if not node_entries:
            logger.warning(f"No nodes in 'phase' block {phase_index}")
            return 0

        phase_credits_consumed = 0

        for node_def in node_entries:
            try:
                node_credits = await self.run_node(
                    execution, node_def, phase_index, edges, env
                )
                phase_credits_consumed += node_credits
            except Exception:
                # Node failed; it has already updated its DB record to FAILED
                raise

        return phase_credits_consumed

    async def run_node(
        self,
        execution: WorkflowExecution,
        node_def: Dict[str, Any],
        phase_index: int,
        edges: List[Dict[str, Any]],
        env: Environment,
    ) -> int:
        """
        Creates a DB record (ExecutionPhase) for this node, decrements user
        balance by the cost of the node, runs the node, and updates the DB
        record with success or failure.
        Returns the credits consumed by this single node.
        """
        node_id = node_def["id"]
        node_data = node_def["data"]
        node_type = node_data["type"]

        # Build final node inputs from node_data["inputs"] + edges
        node_inputs = self.assemble_node_inputs(node_id, node_data, edges, env)

        # Create a DB record for this node as a separate "phase"
        exec_phase_db = await self.create_phase(
            execution, node_inputs, node_type, phase_index
        )

        phase_env_obj = env.create_phase(exec_phase_db.id, node_type)
        await asyncio.sleep(1)
        started_at = datetime.now()
        await self.update_phase(
            exec_phase_db,
            {"status": ExecutionPhaseStatus.RUNNING, "started_at": started_at},
        )
        await asyncio.sleep(2)
        phase_env_obj.status = ExecutionPhaseStatus.RUNNING
        phase_env_obj.start_time = started_at

        executor_cls = NODE_REGISTRY.get(node_type)
        if not executor_cls:
            err_msg = f"Node type {node_type} not found in registry"
            await self.fail_phase(exec_phase_db, phase_env_obj, err_msg, 0)
            raise ValueError(err_msg)

        # Create node object in the environment
        node_obj = Node(
            id=uuid4(),
            name=executor_cls.__name__,
            type=node_type,
            start_time=datetime.now(),
            end_time=None,
            inputs=node_inputs,
            outputs={},
        )
        phase_env_obj.node = node_obj
        phase_env_obj.add_log(f"Starting node: {executor_cls.__name__}")
        logger.info(f"Starting node: {executor_cls.__name__}")

        # Decrement user balance by the cost of running this node
        node_credits = NODE_CREDIT_COSTS.get(node_type, 0)

        try:
            await decrement_balance(self.session, execution.user_id, node_credits)
            executor = executor_cls(self.session)
            node_outputs = await executor.run(node_obj, env)
        except Exception as e:
            await self.fail_phase(exec_phase_db, phase_env_obj, str(e), node_credits)
            raise
        else:
            # Success path
            node_obj.end_time = datetime.now()
            node_obj.outputs = node_outputs or {}
            phase_env_obj.add_log(f"Node completed: {executor_cls.__name__}")

            await self.update_phase(
                exec_phase_db,
                {
                    "status": ExecutionPhaseStatus.COMPLETED,
                    "completed_at": datetime.now(),
                    "outputs": node_outputs,
                    "node": node_obj.to_dict(),
                    "credits_consumed": node_credits,
                },
            )
            await self.write_logs_to_db(exec_phase_db.id, phase_env_obj)

            env.resources[str(node_id)] = node_outputs
            return node_credits

    async def fail_phase(
        self,
        exec_phase_db: ExecutionPhase,
        phase_env_obj: Phase,
        error_message: str,
        credits_consumed: int,
    ):
        """
        Helper to mark a phase (node) as FAILED in the DB and flush logs,
        preserving partial credits used by this node so far.
        """
        phase_env_obj.add_log(error_message, LogLevel.ERROR)
        await self.write_logs_to_db(exec_phase_db.id, phase_env_obj)

        await self.update_phase(
            exec_phase_db,
            {
                "status": ExecutionPhaseStatus.FAILED,
                "completed_at": datetime.now(),
                "outputs": {},
                "credits_consumed": credits_consumed,
            },
        )

    async def create_phase(
        self,
        execution: WorkflowExecution,
        inputs: Dict[str, Any],
        node_type: str,
        phase_index: int,
    ) -> ExecutionPhase:
        """
        Create an ExecutionPhase record for a single node, using the node_type as the name
        """
        create_data = ExecutionPhaseCreate(
            number=phase_index,
            workflow_execution_id=execution.id,
            name=node_type,
            inputs=inputs,
            status=ExecutionPhaseStatus.PENDING,
        )
        return await create_phase(
            self.session, execution.id, execution.user_id, create_data
        )

    async def update_phase(
        self, phase_db: ExecutionPhase, data: Dict[str, Any]
    ) -> ExecutionPhase:
        phase_update = ExecutionPhaseUpdate(**data)
        return await update_phase(self.session, phase_db, phase_update)

    async def write_logs_to_db(self, phase_id: UUID, phase_obj) -> None:
        for log_data in phase_obj.logs:
            log_entry = ExecutionLogCreate(
                execution_phase_id=phase_id,
                message=log_data["message"],
                log_level=log_data["level"],
                timestamp=log_data["timestamp"],
            )
            await create_log(self.session, log_entry)
        phase_obj.logs.clear()

    async def update_execution(
        self, execution: WorkflowExecution, status: ExecutionStatus, credits: int = 0
    ) -> None:
        update_data = WorkflowExecutionUpdate(
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
            credits_consumed=credits,
        )
        await update_execution(self.session, execution, update_data)

    def assemble_node_inputs(
        self,
        node_id: str,
        node_data: Dict[str, Any],
        edges: List[Dict[str, Any]],
        env: Environment,
    ) -> Dict[str, Any]:
        """
        Merges node_data["inputs"] + any edges referencing (target=nodeId).
        Edge's sourceHandle => output from source node, targetHandle => input key.
        """
        logger.info(f"Assembling inputs for node {node_id}")
        data_inputs = node_data.get("inputs", {})
        final_inputs = dict(data_inputs)

        for edge_def in edges:
            if edge_def["target"] == node_id:
                source_id = edge_def["source"]
                source_handle = edge_def["sourceHandle"]
                target_handle = edge_def["targetHandle"]

                # retrieve env.resources[source_id][source_handle]
                if source_handle == "Web Page":
                    continue
                if str(source_id) not in env.resources:
                    raise ValueError(f"Node outputs for {source_id} not found in env.")
                source_outputs = env.resources[str(source_id)]
                if source_handle not in source_outputs:
                    raise ValueError(
                        f"Output '{source_handle}' not in node {source_id}'s outputs."
                    )
                final_inputs[target_handle] = source_outputs[source_handle]

        return final_inputs
