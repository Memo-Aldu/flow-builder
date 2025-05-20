import os
from typing import Any, Dict
from patchright.async_api import (
    async_playwright,
    Error as PlaywrightError,
    TimeoutError as PlaywrightTimeoutError,
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

    __name__ = "Launch Browser Node"

    required_input_keys = ["Website URL"]
    output_keys = ["Web Page"]
    can_be_start_node = True

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        url = node.inputs["Website URL"]
        phase.add_log(f"Launching browser to {url}...", LogLevel.INFO)

        try:
            if env.playwright is None:
                env.playwright = await async_playwright().start()
                phase.add_log("Started Playwright engine.", LogLevel.DEBUG)

            if env.browser is None:
                headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "1") == "1"
                phase.add_log(
                    f"Launching browser in {'headless' if headless_mode else 'headed'} mode",
                    LogLevel.DEBUG,
                )

                # Anti-detection browser launch options
                browser = await env.playwright.chromium.launch(
                    headless=headless_mode,
                    args=[
                        "--disable-blink-features=AutomationControlled",
                        "--disable-features=IsolateOrigins,site-per-process",
                        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    ],
                )

                # Create context with additional evasion techniques
                env.browser = await browser.new_context(
                    viewport={"width": 1920, "height": 1080},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    locale="en-US",
                    timezone_id="America/New_York",
                    permissions=["geolocation"],
                )

                # Add evasion scripts
                await env.browser.add_init_script(
                    """
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => false,
                    });
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5],
                    });
                """
                )

            phase.add_log("Launched browser.", LogLevel.DEBUG)

            page = await env.browser.new_page()
            response = await page.goto(url)
            if not response:
                raise ValueError(f"Failed to navigate to {url}.")
            if response.status < 200 or response.status >= 400:
                logger.warning(
                    f"Failed to navigate to {url}. Status code: {response.status}. Response: {response.json()}"
                )
                raise ValueError(
                    f"Failed to navigate to {url}. Status code: {response.status}"
                )
            phase.add_log(f"Browser navigated to {url}", LogLevel.INFO)

            env.page = page
            return {"Web Page": True}

        except PlaywrightTimeoutError:
            logger.warning(f"Timeout error while launching browser to {url}.")
            raise ValueError(
                f"Timeout error while launching browser to {url}."
            ) from None

        except PlaywrightError as e:
            friendly = (
                f"An unexpected browser error occurred while launching browser to {url}. "
                f"Original error: {type(e).__name__} - {str(e)}"
            )
            logger.warning(friendly)
            raise ValueError(friendly) from e


class FillInputNode(NodeExecutor):
    """
    Fills an input field with the specified text.
    Requires a browser page to be present in the environment.
    Return True if the input was filled successfully.
    """

    __name__ = "Fill Input Node"

    required_input_keys = ["Selector", "Value"]
    output_keys = ["filled_input"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        selector = node.inputs["Selector"]
        value = node.inputs["Value"]
        phase.add_log(f"Filling input '{selector}' with text '{value}'.", LogLevel.INFO)
        logger.info(f"Filling input '{selector}' with text '{value}'.")

        if env.page is None:
            raise ValueError("No browser page found in environment.")

        try:
            await env.page.wait_for_selector(selector, timeout=5000)
            await env.page.fill(selector, value)
            phase.add_log(f"Filled '{selector}' successfully.", LogLevel.INFO)
            return {"filled_input": True}

        except PlaywrightTimeoutError:
            friendly = f"Could not locate or interact with the input '{selector}' before the timeout expired."
            logger.warning(friendly)
            raise ValueError(friendly) from None

        except PlaywrightError as e:
            friendly = (
                f"An unexpected browser error occurred while filling input '{selector}'. "
                f"Original error: {type(e).__name__} - {str(e)}"
            )
            logger.warning(friendly)
            raise ValueError(friendly) from e


class ClickElementNode(NodeExecutor):
    """
    Clicks an element with the specified selector.
    Requires a browser page to be present in the environment.
    Return True if the element was clicked successfully.
    """

    __name__ = "Click Element Node"

    required_input_keys = ["Selector"]
    output_keys = ["clicked_element"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        selector = node.inputs["Selector"]
        phase.add_log(f"Clicking element {selector}", LogLevel.INFO)
        logger.info(f"Clicking element {selector}.")

        if not env.page:
            raise ValueError("No page found in environment")

        try:
            await env.page.wait_for_selector(selector, timeout=10000)
            await env.page.click(selector)
            phase.add_log(f"Clicked '{selector}' successfully.", LogLevel.INFO)
            return {"clicked_element": True}

        except PlaywrightTimeoutError:
            friendly = f"Could not locate or interact with the element '{selector}' before the timeout expired."
            logger.warning(friendly)
            raise ValueError(friendly) from None

        except PlaywrightError as e:
            friendly = (
                f"An unexpected browser error occurred while clicking element '{selector}'. "
                f"Original error: {type(e).__name__} - {str(e)}"
            )
            logger.warning(friendly)
            raise ValueError(friendly) from e
