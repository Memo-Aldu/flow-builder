import base64
import requests
from uuid import UUID
from typing import Any, Dict

from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

from shared.models import LogLevel
from shared.logging import get_logger
from shared.secrets import retrieve_secret
from shared.crud.credentials_crud import get_credential_by_id
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
        auth_token_credential_id = node.inputs["Twilio Auth Token"]
        from_number = node.inputs["From Number"]
        to_number = node.inputs["To Number"]
        message_content = node.inputs["Message Content"]

        # Log basic information
        phase.add_log(f"Twilio Account SID: {account_sid}", LogLevel.INFO)
        phase.add_log(f"To Number: {to_number}", LogLevel.INFO)

        logger.info(f"Preparing to send SMS to {to_number}")

        # Validate the Account SID format
        if not account_sid or not account_sid.startswith("AC"):
            error_msg = f"Invalid Twilio Account SID format: {account_sid}. Should start with 'AC'"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg)

        try:
            # Get credential from database
            credential = await get_credential_by_id(
                session=self.session, credential_id=UUID(auth_token_credential_id)
            )
            if not credential:
                error_msg = f"Credential {auth_token_credential_id} not found."
                phase.add_log(error_msg, LogLevel.ERROR)
                raise ValueError(error_msg)

            if not credential.secret_arn:
                error_msg = f"Credential {auth_token_credential_id} missing secret_arn."
                phase.add_log(error_msg, LogLevel.ERROR)
                raise ValueError(error_msg)

            logger.info(f"Getting Twilio Auth Token from secret storage {credential.id}")
            auth_token = await retrieve_secret(credential.secret_arn, self.session)

            # Log that we retrieved the token (without revealing it)
            auth_token_masked = "•" * (len(auth_token) - 4) + auth_token[-4:] if auth_token else "None"
            phase.add_log(f"Auth Token retrieved: {auth_token_masked}", LogLevel.INFO)

            # Validate the Auth Token
            if not auth_token or len(auth_token) < 10:
                error_msg = "Invalid Twilio Auth Token: Too short or empty"
                phase.add_log(error_msg, LogLevel.ERROR)
                raise ValueError(error_msg)

        except Exception as e:
            error_msg = f"Error retrieving Auth Token: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            logger.error(error_msg)
            raise ValueError(error_msg) from e

        try:
            client = Client(account_sid, auth_token)

            # Send the message
            phase.add_log("Sending SMS message...", LogLevel.INFO)
            message = client.messages.create(
                body=message_content,
                from_=from_number,
                to=to_number
            )

            # Log success
            phase.add_log(f"SMS sent successfully. SID: {message.sid}", LogLevel.INFO)
            phase.add_log(f"Message status: {message.status}", LogLevel.INFO)

            return {
                "SMS Status": message.status,
                "Message SID": message.sid
            }
        except TwilioRestException as e:
            error_code = getattr(e, 'code', 'Unknown')
            error_msg = f"Twilio error {error_code}: {str(e)}"

            if '401' in str(e):
                error_msg += ". Authentication failed. Please check your Account SID and Auth Token."
                phase.add_log("Make sure you're using the Auth Token from your Twilio console.", LogLevel.ERROR)
            elif '400' in str(e) and 'from' in str(e).lower():
                error_msg += ". Invalid 'From' number. Make sure you're using a Twilio phone number you own."
            elif '400' in str(e) and 'to' in str(e).lower():
                error_msg += ". Invalid 'To' number format. Use E.164 format (e.g., +1234567890)."

            phase.add_log(error_msg, LogLevel.ERROR)
            logger.error(f"Twilio API error: {error_msg}")
            raise ValueError(error_msg) from e
        except Exception as e:
            error_msg = f"Failed to send SMS: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            logger.error(f"General error in SMS sending: {str(e)}")
            raise ValueError(error_msg) from e
