import openai
import asyncio
from uuid import UUID
from typing import Any, Dict

from bs4 import BeautifulSoup
from playwright.async_api import Error as PlaywrightError
from openai.types.chat.chat_completion import ChatCompletion

from shared.logging import get_logger
from shared.models import LogLevel
from shared.secrets_manager import get_secret_value
from shared.crud.credentials_crud import get_credential_by_id

from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor


logger = get_logger(__name__)


class GetHTMLNode(NodeExecutor):
    """
    Gets the HTML content of the current browser page.
    Requires a browser page to be present in the environment.
    Returns the HTML content as a string.
    """
    __name__ = "Get HTML Node"
    
    output_keys = ["Html Content"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)


        if env.page is None:
            raise ValueError("No browser page found in environment.")

        try:
            html = await env.page.content()
            phase.add_log("HTML content retrieved.", level=LogLevel.INFO)
            return {"Html Content": html}
        except PlaywrightError as e:
            phase.add_log(f"Error getting page HTML: {str(e)}", level=LogLevel.ERROR)
            raise ValueError(f"Error getting page HTML: {str(e)}")
        
        
class GetTextFromHTMLNode(NodeExecutor):
    """
    Extracts text from the provided HTML content using the given CSS selector.
    Expects "Html" and "Selector" as inputs and returns {"Text": extracted_text}.
    """
    __name__ = "Get Text From HTML Node"
    
    required_input_keys = ["Html", "Selector"]
    output_keys = ["Text"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        # Validate that required inputs exist.
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        html = node.inputs["Html"]
        selector = node.inputs["Selector"]

        phase.add_log(f"Extracting text using selector '{selector}'.", level=LogLevel.INFO)

        try:
            # Parse the HTML content using BeautifulSoup.
            soup = BeautifulSoup(html, "html.parser")
        except Exception as e:
            phase.add_log(f"Failed to parse HTML: {str(e)}", level=LogLevel.ERROR)
            raise ValueError(f"Failed to parse HTML: {str(e)}")

        try:
            elements = soup.select(selector)
            if not elements:
                msg = f"No elements found for selector '{selector}'."
                phase.add_log(msg, level=LogLevel.WARNING)
                raise ValueError(msg)

            extracted_text = " ".join(el.get_text(strip=True) for el in elements)
            phase.add_log(f"Extracted text (first 100 chars): {extracted_text[:100]}", level=LogLevel.INFO)
            return {"Text": extracted_text}
        except Exception as e:
            phase.add_log(f"Error extracting text: {str(e)}", level=LogLevel.ERROR)
            raise ValueError(f"Error extracting text: {str(e)}")
        


class OpenAICallNode(NodeExecutor):
    """
    Calls the OpenAI API with the given prompt and content.
    Requires a credential ID and prompt to be present in the environment.
    Returns the response from the OpenAI API.
    """
    __name__ = "OpenAI Call Node"

    required_input_keys = ["API Key", "Prompt", "Content"]
    output_keys = ["Extracted Data"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        prompt = node.inputs["Prompt"]
        content = node.inputs["Content"]
        cred_id = node.inputs["API Key"]

        phase.add_log(f"OpenAI call with prompt: {prompt[:30]}...", level=LogLevel.INFO)
        logger.info(f"OpenAI call with prompt: {prompt[:30]}...")

        # Get credential
        credential = await get_credential_by_id(
            session=self.session, credential_id=UUID(cred_id)
        )
        if not credential:
            raise ValueError(f"Credential {cred_id} not found.")
        if not credential.secret_arn:
            raise ValueError(f"Credential {cred_id} missing secret_arn.")

        try:
            openai_api_key = get_secret_value(credential.secret_arn)
        except Exception as e:
            logger.warning(f"Error fetching secret from AWS: {str(e)}")
            raise ValueError(f"Error fetching secret: {str(e)}")

        openai.api_key = openai_api_key

        try:
            response = await self.call_openai_async(prompt, content)
            phase.add_log("AI call completed successfully.", level=LogLevel.INFO)
            return {"Extracted Data": response}
        except Exception as e:
            logger.warning(f"OpenAI call failed: {str(e)}")
            raise ValueError(f"OpenAI call failed: {str(e)}")

    async def call_openai_async(self, prompt: str, content: str) -> Dict[str, Any]:

        def sync_openai_call() -> ChatCompletion:
            system_prompt = """
    You are a webscraper helper that extracts data from HTML or text. You will be given a piece of text or HTML content :
    as input and also the prompt with the data you have to extract. The response should always be only the extracted data :
    as a JSON array or object, without any additional words or explanations. Analyze the input carefully and extract data |:
    precisely based on the prompt. If no data is found, return an empty JSON array. Work only with the provided content
    and ensure the output is always a valid JSON array without any surrounding text
            """
            completion = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                    {"role": "user", "content": content},
                ],
            )
            return completion

        result = await asyncio.to_thread(sync_openai_call)
        msg_dict = result.choices[0].message.to_dict()
        logger.info(f"OpenAI response: {msg_dict}")
        return {"response": msg_dict}
