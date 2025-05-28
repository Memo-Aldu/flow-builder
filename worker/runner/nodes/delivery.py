import base64
import smtplib
import requests
from uuid import UUID
from typing import Any, Dict

from email import encoders
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
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

    required_input_keys = [
        "Twilio Account SID",
        "Twilio Auth Token",
        "From Number",
        "To Number",
        "Message Content",
    ]
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

            logger.info(
                f"Getting Twilio Auth Token from secret storage {credential.id}"
            )
            auth_token = await retrieve_secret(credential.secret_arn, self.session)

            # Log that we retrieved the token (without revealing it)
            auth_token_masked = (
                "•" * (len(auth_token) - 4) + auth_token[-4:] if auth_token else "None"
            )
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
                body=message_content, from_=from_number, to=to_number
            )

            # Log success
            phase.add_log(f"SMS sent successfully. SID: {message.sid}", LogLevel.INFO)
            phase.add_log(f"Message status: {message.status}", LogLevel.INFO)

            return {"SMS Status": message.status, "Message SID": message.sid}
        except TwilioRestException as e:
            error_code = getattr(e, "code", "Unknown")
            error_msg = f"Twilio error {error_code}: {str(e)}"

            if "401" in str(e):
                error_msg += ". Authentication failed. Please check your Account SID and Auth Token."
                phase.add_log(
                    "Make sure you're using the Auth Token from your Twilio console.",
                    LogLevel.ERROR,
                )
            elif "400" in str(e) and "from" in str(e).lower():
                error_msg += ". Invalid 'From' number. Make sure you're using a Twilio phone number you own."
            elif "400" in str(e) and "to" in str(e).lower():
                error_msg += ". Invalid 'To' number format. Use E.164 format (e.g., +1234567890)."

            phase.add_log(error_msg, LogLevel.ERROR)
            logger.error(f"Twilio API error: {error_msg}")
            raise ValueError(error_msg) from e
        except Exception as e:
            error_msg = f"Failed to send SMS: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            logger.error(f"General error in SMS sending: {str(e)}")
            raise ValueError(error_msg) from e


class EmailDeliveryNode(NodeExecutor):
    """
    Sends emails with optional attachments using SMTP.
    Uses the credential store system for SMTP credentials.
    """

    __name__ = "Email Delivery Node"

    required_input_keys = [
        "SMTP Server",
        "SMTP Port",
        "Username",
        "Password",
        "From Email",
        "To Email",
        "Subject",
        "Body",
    ]
    output_keys = ["Delivery Status", "Message ID"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        smtp_server = node.inputs["SMTP Server"]
        username = node.inputs["Username"]
        password_credential_id = node.inputs["Password"]
        from_email = node.inputs["From Email"]
        to_email = node.inputs["To Email"]
        subject = node.inputs["Subject"]
        body = node.inputs["Body"]

        # Optional inputs
        smtp_port = int(node.inputs.get("SMTP Port", 587))
        cc_email = node.inputs.get("CC Email", "")
        bcc_email = node.inputs.get("BCC Email", "")
        use_tls = node.inputs.get("Use TLS", "true").lower() == "true"
        body_type = node.inputs.get("Body Type", "plain")
        attachments = node.inputs.get("Attachments", "")

        phase.add_log(
            f"Preparing to send email from {from_email} to {to_email}", LogLevel.INFO
        )

        try:
            credential = await get_credential_by_id(
                session=self.session, credential_id=UUID(password_credential_id)
            )
            if not credential:
                error_msg = f"Credential {password_credential_id} not found."
                phase.add_log(error_msg, LogLevel.ERROR)
                raise ValueError(error_msg)

            if not credential.secret_arn:
                error_msg = f"Credential {password_credential_id} missing secret_arn."
                phase.add_log(error_msg, LogLevel.ERROR)
                raise ValueError(error_msg)

            password = await retrieve_secret(credential.secret_arn, self.session)

            # Create message
            msg = MIMEMultipart()
            msg["From"] = from_email
            msg["To"] = to_email
            msg["Subject"] = subject

            if cc_email:
                msg["Cc"] = cc_email
            if bcc_email:
                msg["Bcc"] = bcc_email

            # Add body
            if body_type.lower() == "html":
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            if attachments:
                self._add_attachments(msg, attachments, phase)

            recipients = [to_email]
            if cc_email:
                recipients.extend([email.strip() for email in cc_email.split(",")])
            if bcc_email:
                recipients.extend([email.strip() for email in bcc_email.split(",")])

            phase.add_log(
                f"Connecting to SMTP server {smtp_server}:{smtp_port}", LogLevel.INFO
            )

            if use_tls:
                server = smtplib.SMTP(smtp_server, smtp_port)
                server.starttls()
            else:
                server = smtplib.SMTP(smtp_server, smtp_port)

            if username and password:
                server.login(username, password)
                phase.add_log("SMTP authentication successful", LogLevel.INFO)

            text = msg.as_string()
            server.sendmail(from_email, recipients, text)
            server.quit()
            phase.add_log("Email sent successfully", LogLevel.INFO)

            return {
                "Delivery Status": "✅ Email sent successfully",
                "Message ID": msg.get("Message-ID", "N/A"),
            }

        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP Authentication failed: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg) from e
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"Recipients refused: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg) from e
        except smtplib.SMTPServerDisconnected as e:
            error_msg = f"SMTP server disconnected: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg) from e
        except Exception as e:
            error_msg = f"Failed to send email: {str(e)}"
            phase.add_log(error_msg, LogLevel.ERROR)
            raise ValueError(error_msg) from e

    def _add_attachments(self, msg: MIMEMultipart, attachments: str, phase) -> None:
        """Add attachments to the email message."""
        try:
            import json

            if isinstance(attachments, str):
                attachment_list = json.loads(attachments)
            else:
                attachment_list = attachments

            if not isinstance(attachment_list, list):
                attachment_list = [attachment_list]

            for attachment in attachment_list:
                if isinstance(attachment, dict):
                    filename = attachment.get("filename", "attachment")
                    content = attachment.get("content", "")
                    content_type = attachment.get(
                        "content_type", "application/octet-stream"
                    )

                    if attachment.get("encoding") == "base64":
                        file_data = base64.b64decode(content)
                    else:
                        file_data = content.encode("utf-8")

                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(file_data)
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition", f"attachment; filename= {filename}"
                    )
                    msg.attach(part)

                    phase.add_log(f"Added attachment: {filename}", LogLevel.INFO)

        except json.JSONDecodeError:
            phase.add_log("Invalid attachment format - expected JSON", LogLevel.WARNING)
        except Exception as e:
            phase.add_log(f"Error adding attachments: {str(e)}", LogLevel.WARNING)
