import json
from typing import Any, Dict

from shared.logging import get_logger
from shared.models import LogLevel

from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor


logger = get_logger(__name__)


class BranchNode(NodeExecutor):
    """
    Conditional branching node that routes workflow execution based on condition evaluation.
    Supports comparison operators: equals (==), less than (<), greater than (>),
    contains/includes, does not contain/not includes.
    Output to either "True Path" or "False Path" based on condition result.
    """

    __name__ = "Branch Node"

    required_input_keys = ["Left Value", "Operator", "Right Value"]
    output_keys = ["True Path", "False Path", "Result", "Data"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        left_value = node.inputs["Left Value"]
        operator = node.inputs["Operator"]
        right_value = node.inputs["Right Value"]

        phase.add_log(
            f"Evaluating condition: '{left_value}' {operator} '{right_value}'",
            LogLevel.INFO,
        )

        try:
            left_val = self._convert_value(left_value)
            right_val = self._convert_value(right_value)

            result = self._evaluate_condition(left_val, operator, right_val)
            phase.add_log(f"Condition result: {result}", LogLevel.INFO)

            return {
                "True Path": "execute" if result else None,
                "False Path": "execute" if not result else None,
                "Result": result,
                "Data": left_value,
            }

        except Exception as e:
            phase.add_log(f"Error evaluating condition: {str(e)}", LogLevel.ERROR)
            raise ValueError(f"Error evaluating condition: {str(e)}") from e

    def _convert_value(self, value: Any) -> Any:
        """Convert string values to appropriate types for comparison."""
        if isinstance(value, str):
            try:
                if "." in value:
                    return float(value)
                else:
                    return int(value)
            except ValueError:
                return value
        return value

    def _evaluate_condition(self, left: Any, operator: str, right: Any) -> bool:
        """Evaluate the condition based on the operator."""
        operator = operator.lower().strip()

        if operator == "equals" or operator == "==":
            return left == right
        elif operator == "less than" or operator == "<":
            return left < right
        elif operator == "greater than" or operator == ">":
            return left > right
        elif operator == "contains" or operator == "includes":
            return str(right) in str(left)
        elif operator == "does not contain" or operator == "not includes":
            return str(right) not in str(left)
        elif operator == "less than or equal" or operator == "<=":
            return left <= right
        elif operator == "greater than or equal" or operator == ">=":
            return left >= right
        elif operator == "not equals" or operator == "!=":
            return left != right
        else:
            raise ValueError(f"Unsupported operator: {operator}")
