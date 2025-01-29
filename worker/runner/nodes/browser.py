from typing import Any, Dict
from playwright.async_api import (
    async_playwright,
    Error as PlaywrightError,
)
from shared.models import LogLevel
from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor

from shared.logging import get_logger


logger = get_logger(__name__)


class LaunchBrowserNode(NodeExecutor):
    """
    Launches a browser and navigates to the specified URL.
    Creates a new browser instance if one does not already exist.
    Creates a new page instance and navigates to the specified URL.
    Can be used as a start node.
    Returns True if the browser was launched successfully.
    """

    required_input_keys = ["url"]
    output_keys = ["launched_browser"]
    can_be_start_node = True

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        url = node.inputs["url"]

        phase.add_log(f"Launching browser to {url}...")

        try:
            if env.playwright is None:
                env.playwright = await async_playwright().start()
                phase.add_log("Started Playwright engine", level=LogLevel.DEBUG)

            if env.browser is None:
                env.browser = await env.playwright.chromium.launch(headless=True)
                phase.add_log("Launched Chromium browser", level=LogLevel.DEBUG)

            page = await env.browser.new_page()
            await page.goto(url)
            phase.add_log(f"Browser navigated to {url}", level=LogLevel.INFO)

            env.page = page

            return {"launched_browser": True}

        except PlaywrightError as e:
            logger.warning(f"Error launching browser: {str(e)}")
            raise e


class FillInputNode(NodeExecutor):
    """
    Fills an input field with the specified text.
    Requires a browser page to be present in the environment.
    Return True if the input was filled successfully.
    """

    required_input_keys = ["selector", "text"]
    output_keys = ["filled_input"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        selector = node.inputs["selector"]
        text = node.inputs["text"]
        phase = env.get_phase_of_node(node.id)

        phase.add_log(f"Filling input '{selector}' with text '{text}'.")
        logger.info(f"Filling input '{selector}' with text '{text}'.")

        if env.page is None:
            raise ValueError("No browser page found in environment.")
        try:
            await env.page.wait_for_selector(selector)
            await env.page.click(selector)
            phase.add_log(f"Clicked {selector} successfully.")
            return {"filled_input": True}
        except PlaywrightError as e:
            logger.warning(f"Error clicking element {selector}: {str(e)}")
            raise e


class ClickElementNode(NodeExecutor):
    """
    Clicks an element with the specified selector.
    Requires a browser page to be present in the environment.
    Return True if the element was clicked successfully.
    """

    required_input_keys = ["selector"]
    output_keys = ["clicked_element"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        selector = node.inputs["selector"]

        phase.add_log(f"Clicking element {selector}...")

        if not env.page:
            raise ValueError("No page found in environment")

        try:
            await env.page.wait_for_selector(selector)
            await env.page.click(selector)
            phase.add_log(f"Clicked {selector} successfully.")
            return {"clicked_element": True}
        except PlaywrightError as e:
            logger.warning(f"Error clicking element {selector}: {str(e)}")
            raise e
