import asyncio
from typing import Any, Dict
from playwright.async_api import Page, Error as PlaywrightError

from worker.runner.nodes.base import NodeExecutor

from shared.logging import get_logger


logger = get_logger(__name__)


class GetHTMLNode(NodeExecutor):
    required_context_keys = ["page"]
    output_keys = ["page_html"]

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        page: Page = context["page"]

        try:
            logger.info("Getting page HTML.")
            page_html = await page.content()
            return {"page_html": page_html}
        except PlaywrightError as e:
            logger.warning(f"Error getting page HTML: {str(e)}")
            raise e

    async def cleanup(self, context: Dict[str, Any]) -> None:
        if "page_html" in context:
            context.pop("page_html", None)
            logger.info("Removing page_html from context.")


class ExtractDataAINode(NodeExecutor):
    required_context_keys = ["page_html"]
    required_definition_keys = ["prompt_template"]
    output_keys = ["extracted_data"]

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        page_html = context["page_html"]
        prompt_template = node_def["inputs"]["prompt_template"]

        logger.info(
            f"Extracting data from page HTML with prompt template: {prompt_template}"
        )
        # Simulate an AI call
        await asyncio.sleep(1)

        # Return a JSON-serializable dict
        return {"extracted_data": {"parsed": True}}

    async def cleanup(self, context: Dict[str, Any]) -> None:
        if "extracted_data" in context:
            context.pop("extracted_data", None)
            logger.info("Removing extracted_data from context.")
