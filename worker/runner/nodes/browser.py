from typing import Any, Dict
from playwright.async_api import (
    async_playwright,
    Page,
    Browser,
    Error as PlaywrightError,
)
from worker.runner.nodes.base import NodeExecutor

from shared.logging import get_logger


logger = get_logger(__name__)


class LaunchBrowserNode(NodeExecutor):
    required_definition_keys = ["url"]
    output_keys = ["page_opened"]
    can_be_start_node = True

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        url = node_def["inputs"]["url"]

        logger.info(f"Launching browser and navigating to {url}.")

        try:
            if "playwright" not in context:
                context["playwright"] = await async_playwright().start()

            if "browser" not in context:
                context["browser"] = await context["playwright"].chromium.launch(
                    headless=False
                )

            browser: Browser = context["browser"]
            page = await browser.new_page()
            await page.goto(url)

            context["page"] = page

            return {"launched_browser": True}

        except PlaywrightError as e:
            logger.warning(f"Error launching browser or navigating: {str(e)}")
            raise e

    async def cleanup(self, context: Dict[str, Any]) -> None:
        browser = context.get("browser")
        if browser:
            try:
                logger.info("[LaunchBrowserNode] Closing browser during cleanup.")
                await browser.close()
            except Exception as e:
                logger.warning(f"Error closing browser: {e}")
            context.pop("browser", None)

        playwright_instance = context.get("playwright")
        if playwright_instance:
            await playwright_instance.stop()
            context.pop("playwright", None)

        context.pop("page", None)


class FillInputNode(NodeExecutor):
    required_context_keys = ["page"]
    required_definition_keys = ["selector", "text"]
    output_keys = ["filled_input"]

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        page: Page = context["page"]

        selector = node_def["inputs"]["selector"]
        text = node_def["inputs"]["text"]
        logger.info(f"Filling input '{selector}' with text '{text}'.")

        await page.wait_for_selector(selector)
        await page.fill(selector, text)

        return {"filled_input": True}

    async def cleanup(self, context: Dict[str, Any]) -> None:
        """No cleanup needed for this node."""
        pass


class ClickElementNode(NodeExecutor):
    required_context_keys = ["page"]
    required_definition_keys = ["selector"]
    output_keys = ["clicked_element"]

    async def run(
        self, node_def: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        self.validate(node_def, context)
        page: Page = context["page"]

        selector = node_def["inputs"]["selector"]
        logger.info(f"Clicking element '{selector}'.")
        await page.wait_for_selector(selector)
        await page.click(selector)

        return {"clicked_element": True}

    async def cleanup(self, context: Dict[str, Any]) -> None:
        """No cleanup needed for this node."""
        pass
