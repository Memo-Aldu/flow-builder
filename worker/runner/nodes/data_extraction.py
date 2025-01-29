import openai
import asyncio
from uuid import UUID
from typing import Any, Dict
from playwright.async_api import Error as PlaywrightError
from openai.types.chat.chat_completion import ChatCompletion

from shared.logging import get_logger
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

    output_keys = ["content"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        if env.page is None:
            raise ValueError("No browser page found in environment.")

        page = env.page
        phase = env.get_phase_of_node(node.id)
        phase.add_log("Getting page HTML...")
        logger.info("Getting page HTML.")

        try:
            page_html = await page.content()
            phase.add_log("HTML content retrieved")
            return {"content": page_html}
        except PlaywrightError as e:
            logger.warning(f"Error getting page HTML: {str(e)}")
            raise e


class OpenAICallNode(NodeExecutor):
    """
    Calls the OpenAI API with the given prompt and content.
    Requires a credential ID and prompt to be present in the environment.
    Returns the response from the OpenAI API.
    """

    required_input_keys = ["cred_id", "prompt", "content"]
    output_keys = ["ai_result"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        prompt = node.inputs["prompt"]
        content = node.inputs["content"]
        cred_id = node.inputs["cred_id"]

        phase.add_log(f"Starting AI call with prompt: {prompt[:30]}...")
        logger.info(f"[OpenAICallNode] Starting AI call with prompt: {prompt[:30]}...")

        credential = await get_credential_by_id(
            session=self.session, credential_id=UUID(cred_id)
        )

        if not credential:
            raise ValueError(f"Credential {cred_id} not found")

        if not credential.secret_arn:
            raise ValueError(f"Credential {cred_id} is missing secret_arn")

        try:
            openai_api_key = get_secret_value(credential.secret_arn)
        except Exception as e:
            logger.warning(f"Error fetching secret from AWS: {str(e)}")
            raise

        openai.api_key = openai_api_key

        try:
            response = await self.call_openai_async(prompt, content)
        except Exception as e:
            logger.warning(f"OpenAI call failed: {str(e)}")
            raise

        phase.add_log("AI call completed.")
        return {"ai_result": response}

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
        logger.info(f"OpenAI call result: {result.choices[0].message.to_dict()}")
        return {"response": result.choices[0].message.to_dict()}
