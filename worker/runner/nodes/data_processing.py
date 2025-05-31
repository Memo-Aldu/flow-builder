import json
import jsonpath_ng
from typing import Any, Dict

from shared.logging import get_logger
from shared.models import LogLevel

from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor


logger = get_logger(__name__)


class JsonTransformNode(NodeExecutor):
    """
    Transforms JSON data using JSONPath expressions or simple transformations.
    Allows mapping from one JSON structure to another.
    """

    __name__ = "JSON Transform Node"

    required_input_keys = ["Input JSON", "Transform Rules"]
    output_keys = ["Transformed JSON"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        input_json = node.inputs["Input JSON"]
        transform_rules = node.inputs["Transform Rules"]

        phase.add_log("Starting JSON transformation", LogLevel.INFO)

        try:
            if isinstance(input_json, str):
                input_data = json.loads(input_json)
            else:
                input_data = input_json

            if isinstance(transform_rules, str):
                rules = json.loads(transform_rules)
            else:
                rules = transform_rules

            result = self._apply_transformations(input_data, rules)
            phase.add_log("JSON transformation completed successfully", LogLevel.INFO)
            return {"Transformed JSON": json.dumps(result)}

        except json.JSONDecodeError as e:
            phase.add_log(f"Error parsing JSON: {str(e)}", LogLevel.ERROR)
            raise ValueError(f"Error parsing JSON: {str(e)}") from e
        except Exception as e:
            phase.add_log(f"Error transforming JSON: {str(e)}", LogLevel.ERROR)
            raise ValueError(f"Error transforming JSON: {str(e)}") from e

    def _apply_transformations(
        self, data: Dict[str, Any], rules: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply transformation rules to the input data."""
        result = {}

        for output_key, rule in rules.items():
            if isinstance(rule, str):
                try:
                    jsonpath_expr = jsonpath_ng.parse(rule)
                    matches = jsonpath_expr.find(data)
                    if matches:
                        result[output_key] = matches[0].value
                    else:
                        result[output_key] = None
                except Exception:
                    result[output_key] = rule
            elif isinstance(rule, dict):
                if "path" in rule:
                    jsonpath_expr = jsonpath_ng.parse(rule["path"])
                    matches = jsonpath_expr.find(data)
                    if matches:
                        value = matches[0].value
                        if "type" in rule:
                            value = self._convert_type(value, rule["type"])
                        result[output_key] = value
                    else:
                        result[output_key] = rule.get("default", None)
                elif "value" in rule:
                    result[output_key] = rule["value"]
            else:
                result[output_key] = rule

        return result

    def _convert_type(self, value: Any, target_type: str) -> Any:
        """Convert value to target type."""
        if target_type == "string":
            return str(value)
        elif target_type == "number":
            return float(value) if "." in str(value) else int(value)
        elif target_type == "boolean":
            return bool(value)
        elif target_type == "array":
            return [value] if not isinstance(value, list) else value
        else:
            return value


class MergeDataNode(NodeExecutor):
    """
    Combines multiple data inputs into a single JSON object.
    Useful for aggregating data from multiple sources before delivery.
    """

    __name__ = "Merge Data Node"

    required_input_keys = ["Data 1", "Data 2"]
    output_keys = ["Merged Data"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        merge_strategy = node.inputs.get("Merge Strategy", "overwrite")

        phase.add_log("Starting data merge operation", LogLevel.INFO)

        try:
            merged_data = {}

            data_inputs = []
            for key, value in node.inputs.items():
                if key.startswith("Data ") and key != "Merge Strategy":
                    if value is not None:
                        data_inputs.append(value)

            phase.add_log(
                f"Found {len(data_inputs)} data inputs to merge", LogLevel.INFO
            )

            for i, data_input in enumerate(data_inputs):
                try:
                    if isinstance(data_input, str):
                        data = json.loads(data_input)
                    else:
                        data = data_input

                    if isinstance(data, dict):
                        merged_data = self._merge_objects(
                            merged_data, data, merge_strategy
                        )
                    else:
                        merged_data[f"input_{i+1}"] = data

                except json.JSONDecodeError:
                    merged_data[f"input_{i+1}"] = data_input

            phase.add_log("Data merge completed successfully", LogLevel.INFO)

            return {"Merged Data": json.dumps(merged_data)}

        except Exception as e:
            phase.add_log(f"Error merging data: {str(e)}", LogLevel.ERROR)
            raise ValueError(f"Error merging data: {str(e)}") from e

    def _merge_objects(
        self, target: Dict[str, Any], source: Dict[str, Any], strategy: str
    ) -> Dict[str, Any]:
        """Merge source object into target object based on strategy."""
        if strategy == "overwrite":
            result = target.copy()
            result.update(source)
            return result
        elif strategy == "append":
            result = target.copy()
            for key, value in source.items():
                if (
                    key in result
                    and isinstance(result[key], list)
                    and isinstance(value, list)
                ):
                    result[key].extend(value)
                else:
                    result[key] = value
            return result
        else:
            result = target.copy()
            result.update(source)
            return result


class WritePropertyToJsonNode(NodeExecutor):
    """
    Writes/updates properties in JSON objects.
    Allows setting specific fields or nested properties in JSON data.
    """

    __name__ = "Write Property to JSON Node"

    required_input_keys = ["JSON", "Property Name", "Property Value"]
    output_keys = ["Updated JSON"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        json_input = node.inputs["JSON"]
        property_name = node.inputs["Property Name"]
        property_value = node.inputs["Property Value"]

        phase.add_log(f"Writing property '{property_name}' to JSON", LogLevel.INFO)

        try:
            if isinstance(json_input, str):
                data = json.loads(json_input)
            else:
                data = json_input.copy() if isinstance(json_input, dict) else {}

            if "." in property_name:
                self._set_nested_property(data, property_name, property_value)
            else:
                data[property_name] = property_value

            phase.add_log(
                f"Property '{property_name}' written successfully", LogLevel.INFO
            )

            return {"Updated JSON": json.dumps(data)}

        except json.JSONDecodeError as e:
            phase.add_log(f"Error parsing JSON: {str(e)}", LogLevel.ERROR)
            raise ValueError(f"Error parsing JSON: {str(e)}") from e
        except Exception as e:
            phase.add_log(f"Error writing property to JSON: {str(e)}", LogLevel.ERROR)
            raise ValueError(f"Error writing property to JSON: {str(e)}") from e

    def _set_nested_property(
        self, data: Dict[str, Any], property_path: str, value: Any
    ) -> None:
        """Set a nested property using dot notation."""
        keys = property_path.split(".")
        current = data

        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            elif not isinstance(current[key], dict):
                current[key] = {}
            current = current[key]
        current[keys[-1]] = value
