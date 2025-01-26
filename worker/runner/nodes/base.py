from typing import Any, Dict, List


class NodeExecutor:
    """
    Base interface for all node executors.
    """
    required_context_keys: List[str] = []
    required_definition_keys: List[str] = []
    output_keys: List[str] = []
    can_be_start_node: bool = False

    def __init__(self, session) -> None:
        self.session = session

    def validate(self, node_def, context) -> None:
        if not self.can_be_start_node:
            for key in self.required_context_keys:
                if key not in context:
                    raise ValueError(
                        f"Missing '{key}' in context for node {node_def.get('name')}"
                    )

        for key in self.required_definition_keys:
            if key not in node_def.get("inputs", {}):
                raise ValueError(
                    f"Missing '{key}' in node definition for node {node_def.get('name')}"
                )

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the node with the given node definition and context data.
        Returns a dictionary of outputs to merge back into the context.
        """
        raise NotImplementedError("Subclasses must implement 'run'.")

    async def cleanup(self, context: Dict[str, Any]) -> None:
        """
        Cleanup resources used by the node.
        Subclasses can override this method to implement custom cleanup logic.
        """
        raise NotImplementedError("Subclasses must implement 'cleanup'.")
