from typing import Dict, Type

from worker.runner.nodes.base import NodeExecutor
from worker.runner.nodes.data_extraction import GetHTMLNode, GetTextFromHTMLNode, OpenAICallNode
from worker.runner.nodes.browser import (
    LaunchBrowserNode,
    FillInputNode,
    ClickElementNode,
)

NODE_REGISTRY: Dict[str, Type[NodeExecutor]] = {
    "launch_browser": LaunchBrowserNode,
    "fill_input": FillInputNode,
    "click_element": ClickElementNode,
    "get_html": GetHTMLNode,
    "get_text_from_html": GetTextFromHTMLNode,
    "extract_data_openai": OpenAICallNode,
}
