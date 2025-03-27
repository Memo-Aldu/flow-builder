import asyncio
from typing import Any, Dict
from patchright.async_api import (
    Error as PlaywrightError,
    TimeoutError as PlaywrightTimeoutError,
)
from shared.models import LogLevel
from worker.runner.environment import Environment, Node
from worker.runner.nodes.base import NodeExecutor

from shared.logging import get_logger


logger = get_logger(__name__)


class WaitElementNode(NodeExecutor):
    """
    Waits for an element with the specified selector to appear on the page.
    Requires a browser page to be present in the environment.
    Returns True if the element appeared before the timeout.
    """

    __name__ = "Wait For Element Node"

    required_input_keys = ["Selector", "Visibility"]
    output_keys = ["element_appeared"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        selector = node.inputs["Selector"]
        visibility = node.inputs.get("Visibility", "visible")
        phase.add_log(
            f"Waiting for element {selector} to be {visibility}.", LogLevel.INFO
        )
        logger.info("Waiting for element %s to be %s.", selector, visibility)

        if not env.page:
            raise ValueError("No page found in environment")

        try:
            await env.page.wait_for_selector(selector, state=visibility, timeout=50000)
            phase.add_log(f"Element '{selector}' appeared.", LogLevel.INFO)
            return {"element_appeared": True}

        except PlaywrightTimeoutError:
            friendly = (
                f"Element '{selector}' did not appear before the timeout expired."
            )
            logger.warning(friendly)
            raise ValueError(friendly) from None

        except PlaywrightError as e:
            friendly = (
                f"An unexpected browser error occurred while waiting for element '{selector}'. "
                f"Original error: {type(e).__name__} - {str(e)}"
            )
            logger.warning(friendly)
            raise ValueError(friendly) from e

    def validate(self, node: Node, env: Environment) -> None:
        super().validate(node, env)
        visibility = node.inputs.get("Visibility", "visible")
        if visibility not in ["visible", "hidden"]:
            raise ValueError("Visibility must be either 'visible' or 'hidden'.")


class DelayNode(NodeExecutor):
    """
    Waits for a specified amount of time.
    Returns True after the specified duration.
    """

    __name__ = "Wait Node"

    required_input_keys = ["Duration"]
    output_keys = ["waited"]

    async def run(self, node: Node, env: Environment) -> Dict[str, Any]:
        self.validate(node, env)
        phase = env.get_phase_of_node(node.id)

        duration_sec = node.inputs["Duration"]

        if isinstance(duration_sec, str):
            duration_sec = float(duration_sec)

        phase.add_log(f"Waiting for {duration_sec} seconds.", LogLevel.INFO)
        logger.info("Waiting for %s seconds.", duration_sec)

        await asyncio.sleep(duration_sec)

        return {"waited": True}
