import os
from typing import Any, Dict
from shared.models import LogLevel
from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor

from shared.logging import get_logger


logger = get_logger(__name__)


class StandardBrowserNode(NodeExecutor):
    """
    Launches a standard browser and navigates to the specified URL.
    Creates a new browser instance with default settings.
    Can be used as a start node.
    Returns True if the browser was launched successfully.
    """

    __name__ = "Standard Browser Node"

    required_input_keys = ["Website URL"]
    output_keys = ["Web Page"]
    can_be_start_node = True

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        url = node.inputs["Website URL"]
        phase.add_log(f"Launching standard browser to {url}...", LogLevel.INFO)

        try:
            # Create normal browser if not exists
            if not hasattr(env, "browser") or env.browser is None:
                # Set the browser type to normal
                env.set_browser("normal")
                if env.browser is None:
                    raise ValueError("Failed to create browser.")

                # Configure headless mode
                headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "True") == "True"
                # Start the browser with logging callback
                await env.browser.start(
                    headless=headless_mode,
                    log_callback=lambda msg, level: phase.add_log(msg, level),
                )

                page = await env.browser.new_page()
                env.page = page

                phase.add_log("Standard browser launched successfully", LogLevel.INFO)

            phase.add_log(f"Navigating to {url}...", LogLevel.INFO)
            await env.browser.navigate(url)

            phase.add_log(f"Successfully loaded {url}", LogLevel.INFO)

            return {"Web Page": True}

        except Exception as e:
            phase.add_log(f"Error launching standard browser: {str(e)}", LogLevel.ERROR)
            raise e


class StealthBrowserNode(NodeExecutor):
    """
    Launches a stealth browser with anti-detection measures and navigates to the specified URL.
    Creates a new browser instance with enhanced fingerprinting and human-like behavior.
    Can be used as a start node.
    Returns True if the browser was launched successfully.
    """

    __name__ = "Stealth Browser Node"

    required_input_keys = ["Website URL"]
    output_keys = ["Web Page"]
    can_be_start_node = True

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        url = node.inputs["Website URL"]
        phase.add_log(f"Launching stealth browser to {url}...", LogLevel.INFO)

        try:
            if not hasattr(env, "browser") or env.browser is None:
                env.set_browser("stealth")
                if env.browser is None:
                    raise ValueError("Failed to create browser.")

                headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "True") == "True"
                await env.browser.start(
                    headless=headless_mode,
                    log_callback=lambda msg, level: phase.add_log(msg, level),
                )

                # Create a new page
                page = await env.browser.new_page()
                env.page = page
                phase.add_log("Stealth browser launched successfully", LogLevel.INFO)

            # Navigate to the URL
            phase.add_log(f"Navigating to {url}...", LogLevel.INFO)
            await env.browser.navigate(url)
            phase.add_log(f"Successfully loaded {url}", LogLevel.INFO)

            return {"Web Page": True}

        except Exception as e:
            phase.add_log(f"Error launching stealth browser: {str(e)}", LogLevel.ERROR)
            raise e


class BrightDataBrowserNode(NodeExecutor):
    """
    Launches a Bright Data browser and navigates to the specified URL.
    Uses Bright Data's automatic captcha solving and proxy rotation.
    Can be used as a start node.
    Returns True if the browser was launched successfully.
    """

    __name__ = "Bright Data Browser Node"

    required_input_keys = ["Website URL"]
    output_keys = ["Web Page"]
    can_be_start_node = True

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)

        phase = env.get_phase_of_node(node.id)
        url = node.inputs["Website URL"]
        phase.add_log(f"Launching Bright Data browser to {url}...", LogLevel.INFO)

        try:
            if not hasattr(env, "browser") or env.browser is None:
                env.set_browser("brightdata")
                if env.browser is None:
                    raise ValueError("Failed to create Bright Data browser.")

                headless_mode = True

                # Start the browser with logging callback
                await env.browser.start(
                    headless=headless_mode,
                    log_callback=lambda msg, level: phase.add_log(msg, level),
                )

                page = await env.browser.new_page()
                env.page = page
                phase.add_log(
                    "Bright Data browser launched successfully", LogLevel.INFO
                )

            phase.add_log(f"Navigating to {url}...", LogLevel.INFO)
            await env.browser.navigate(url)
            phase.add_log(f"Successfully loaded {url} with Bright Data", LogLevel.INFO)

            return {"Web Page": True}

        except Exception as e:
            phase.add_log(
                f"Error launching Bright Data browser: {str(e)}", LogLevel.ERROR
            )
            raise e


class FillInputNode(NodeExecutor):
    """
    Fills an input field with the specified text.
    Uses the browser abstraction layer for improved compatibility.
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
        delay = node.inputs.get(
            "Human-like Typing", True
        )  # Default to human-like typing

        phase.add_log(f"Filling input '{selector}' with text '{value}'.", LogLevel.INFO)
        logger.info(f"Filling input '{selector}' with text '{value}'.")

        if not env.browser:
            raise ValueError("No browser found in environment. Launch a browser first.")

        try:
            await env.browser.fill_input(selector, value, delay=delay)
            phase.add_log(f"Filled '{selector}' successfully.", LogLevel.INFO)
            return {"filled_input": True}

        except Exception as e:
            friendly = f"Could not fill input '{selector}': {str(e)}"
            logger.warning(friendly)
            phase.add_log(friendly, LogLevel.ERROR)
            raise ValueError(friendly) from e


class ClickElementNode(NodeExecutor):
    """
    Clicks an element with the specified selector.
    Uses the browser abstraction layer for improved compatibility.
    Return True if the element was clicked successfully.
    """

    __name__ = "Click Element Node"

    required_input_keys = ["Selector"]
    output_keys = ["clicked_element"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        selector = node.inputs["Selector"]
        force = node.inputs.get("Force Click", False)

        phase.add_log(f"Clicking element {selector}", LogLevel.INFO)
        logger.info(f"Clicking element {selector}.")

        if not env.browser:
            raise ValueError("No browser found in environment. Launch a browser first.")

        try:
            await env.browser.click(selector, force=force)
            phase.add_log(f"Clicked '{selector}' successfully.", LogLevel.INFO)
            return {"clicked_element": True}

        except Exception as e:
            friendly = f"Could not click element '{selector}': {str(e)}"
            logger.warning(friendly)
            phase.add_log(friendly, LogLevel.ERROR)
            raise ValueError(friendly) from e
