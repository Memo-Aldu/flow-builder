from typing import Any, Dict, List
from worker.runner.environment import Node, Environment


class NodeExecutor:
    """
    Base interface for all node executors.
    """

    __name__ = "Node Executor Base"

    required_input_keys: List[str] = []
    output_keys: List[str] = []
    can_be_start_node: bool = False

    def __init__(self, session) -> None:
        self.session = session

    def validate(self, node: Node, env: Environment) -> None:
        for key in self.required_input_keys:
            # Skip the "Web Page" key, which is a special key for the browser page.
            if key not in node.inputs and key != "Web Page":
                raise ValueError(
                    f"Missing required input key '{key}' in node {node.name}"
                )

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        """
        Execute the node with the given node dataclass and environment.
        Returns a dictionary of outputs which will be added to node.outputs
        and presumably placed into the environment for use by subsequent nodes.
        """
        raise NotImplementedError("Subclasses must implement 'run'.")
