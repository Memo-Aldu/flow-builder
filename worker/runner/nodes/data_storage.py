import json
from typing import Any, Dict

from shared.logging import get_logger
from shared.models import LogLevel

from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor


logger = get_logger(__name__)


class ReadPropertyFromJsonNode(NodeExecutor):
    """
    Reads a property from a JSON object.
    Expects "JSON" and "Property Name" as inputs and returns {"Property Value": value}.
    """

    __name__ = "Read Property From JSON Node"

    required_input_keys = ["JSON", "Property Name"]
    output_keys = ["Property Value"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        json_string_data = node.inputs["JSON"]
        property_name = node.inputs["Property Name"]

        try:
            json_data = json.loads(json_string_data)
            property_value = json_data.get(property_name, None)
            phase.add_log(
                f"Property '{property_name}' read from JSON.", level=LogLevel.INFO
            )
            if property_value is None:
                raise ValueError(f"Property '{property_name}' not found in JSON.")
            return {"Property Value": property_value}
        except json.JSONDecodeError as e:
            phase.add_log(f"Error decoding JSON: {str(e)}", level=LogLevel.ERROR)
            raise ValueError(f"Error decoding JSON: {str(e)}") from e
        except Exception as e:
            phase.add_log(
                f"Error reading property from JSON: {str(e)}", level=LogLevel.ERROR
            )
            raise ValueError(f"Error reading property from JSON: {str(e)}") from e
