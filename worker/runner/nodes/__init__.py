from typing import Dict, Type

from worker.runner.nodes.base import NodeExecutor
from worker.runner.nodes.data_extraction import (
    GetHTMLNode,
    GetTextFromHTMLNode,
    OpenAICallNode,
)
from worker.runner.nodes.browser import (
    LaunchBrowserNode,
    FillInputNode,
    ClickElementNode,
)
from worker.runner.nodes.data_storage import ReadPropertyFromJsonNode

NODE_REGISTRY: Dict[str, Type[NodeExecutor]] = {
    "launch_browser": LaunchBrowserNode,
    "fill_input": FillInputNode,
    "click_element": ClickElementNode,
    "get_html": GetHTMLNode,
    "get_text_from_html": GetTextFromHTMLNode,
    "extract_data_openai": OpenAICallNode,
    "read_property_from_json": ReadPropertyFromJsonNode,
}


NODE_CREDIT_COSTS = {
    "launch_browser": 5,
    "fill_input": 1,
    "click_element": 1,
    "get_html": 2,
    "get_text_from_html": 2,
    "extract_data_openai": 4,
    "read_property_from_json": 1,
}
