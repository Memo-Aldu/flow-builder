import asyncio
from typing import Any, Dict

from worker.runner.nodes.base import NodeExecutor

from shared.logging import get_logger


logger = get_logger(__name__)


class LaunchBrowserNode(NodeExecutor):
    required_definition_keys = ["url"]
    output_keys = ["page"]
    can_be_start_node = True

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        url = node_def["inputs"]["url"]
        await asyncio.sleep(1)
        logger.info(f"Launching browser and navigating to {url}.")
        return {"page": "SeleniumPageObject"}


class FillInputNode(NodeExecutor):
    required_context_keys = ["page"]
    required_definition_keys = ["selector", "text"]
    output_keys = ["page"]

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        page = context["page"]
        selector = node_def["inputs"]["selector"]
        text = node_def["inputs"]["text"]
        await asyncio.sleep(1)
        logger.info(f"Filling input {selector} with text {text} on page {page}.")
        return {"page": page}


class ClickElementNode(NodeExecutor):
    required_context_keys = ["page"]
    required_definition_keys = ["selector"]
    output_keys = ["page"]

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        page = context["page"]
        selector = node_def["inputs"]["selector"]
        await asyncio.sleep(1)
        logger.info(f"Clicking element {selector} on page {page}.")
        return {"page": page}
