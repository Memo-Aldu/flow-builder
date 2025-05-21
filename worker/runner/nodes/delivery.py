import base64
import requests
from typing import Any, Dict

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from shared.models import LogLevel
from shared.logging import get_logger
from worker.runner.nodes.base import NodeExecutor
from worker.runner.environment import Environment, Node

logger = get_logger(__name__)

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
        

class SendSMSNode(NodeExecutor):
    """
    Sends an SMS message using Twilio.
    Requires Twilio credentials and message details.
    """

    __name__ = "Send SMS Node"

    required_input_keys = ["Twilio Account SID", "Twilio Auth Token", "From Number", "To Number", "Message Content"]
    output_keys = ["SMS Status", "Message SID"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        account_sid = node.inputs["Twilio Account SID"]
        auth_token = node.inputs["Twilio Auth Token"]
        from_number = node.inputs["From Number"]
        to_number = node.inputs["To Number"]
        message_content = node.inputs["Message Content"]

        phase.add_log(f"Sending SMS to {to_number}...", LogLevel.INFO)
        logger.info(f"Sending SMS to {to_number}")

        try:
            client = Client(account_sid, auth_token)
            message = client.messages.create(
                body=message_content,
                from_=from_number,
                to=to_number
            )
            
            phase.add_log(f"SMS sent successfully. SID: {message.sid}", LogLevel.INFO)
            return {
                "SMS Status": message.status,
                "Message SID": message.sid
            }
        except TwilioRestException as e:
            error_msg = f"Twilio error: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg) from e
        except Exception as e:
            error_msg = f"Failed to send SMS: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg) from e
