import requests
import base64
from typing import Any, Dict

from shared.models import LogLevel
from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor


class DeliverToWebhookNode(NodeExecutor):
    """
    Sends a payload to the specified webhook via HTTP POST.
    Supports different Content-Types and optional Authorization.
    """

    __name__ = "Deliver to Webhook Node"

    required_input_keys = ["Webhook URL", "Payload"]
    output_keys = ["Delivery Status", "Response Body"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        url = node.inputs["Webhook URL"]
        payload = node.inputs["Payload"]

        # Optional inputs (with defaults)
        content_type = node.inputs.get("Content Type", "application/json")
        auth_type = node.inputs.get("Authorization Type", "none").lower()
        auth_value = node.inputs.get("Authorization Value", "")

        # Build headers
        headers = {
            "Content-Type": content_type,
        }

        # Handle authorization
        if auth_type == "basic" and auth_value:
            encoded = base64.b64encode(auth_value.encode("utf-8")).decode("utf-8")
            headers["Authorization"] = f"Basic {encoded}"
        elif auth_type == "bearer" and auth_value:
            headers["Authorization"] = f"Bearer {auth_value}"

        # Send the request
        try:
            response = requests.post(url, data=payload, headers=headers, timeout=15)
            response.raise_for_status()
            status_msg = f"✅ Delivered with status {response.status_code}"
            body = response.text
            phase.add_log(status_msg, level=LogLevel.INFO)

        except requests.exceptions.RequestException as e:
            status_msg = f"❌ Failed to deliver: {str(e)}"
            body = ""
            phase.add_log(status_msg, level=LogLevel.ERROR)

        # Return node outputs
        return {
            "Delivery Status": status_msg,
            "Response Body": body[:5000],
        }
