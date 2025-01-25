import asyncio
from typing import Any, Dict

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
        page = context["page"]
        await asyncio.sleep(1)
        logger.info(f"Getting HTML from page {page}")
        return {"page_html": "<html>...</html>"}


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
            f"Extracting data from page {page_html} using prompt template: {prompt_template}"
        )
        await asyncio.sleep(1)

        return {"extracted_data": {"key": "value"}}
