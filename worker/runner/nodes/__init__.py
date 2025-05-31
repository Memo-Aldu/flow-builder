from typing import Dict, Type

from worker.runner.nodes.base import NodeExecutor
from worker.runner.nodes.data_extraction import (
    GetHTMLNode,
    GetTextFromHTMLNode,
    CondenseHTMLNode,
    OpenAICallNode,
)
from worker.runner.nodes.browser import (
    StandardBrowserNode,
    StealthBrowserNode,
    BrightDataBrowserNode,
    FillInputNode,
    ClickElementNode,
)
from worker.runner.nodes.data_storage import ReadPropertyFromJsonNode
from worker.runner.nodes.delivery import (
    DeliverToWebhookNode,
    EmailDeliveryNode,
    SendSMSNode,
)
from worker.runner.nodes.timing import DelayNode, WaitElementNode
from worker.runner.nodes.flow_control import BranchNode
from worker.runner.nodes.data_processing import (
    JsonTransformNode,
    MergeDataNode,
    WritePropertyToJsonNode,
)

NODE_REGISTRY: Dict[str, Type[NodeExecutor]] = {
    "launch_standard_browser": StandardBrowserNode,
    "launch_stealth_browser": StealthBrowserNode,
    "launch_bright_data_browser": BrightDataBrowserNode,
    "fill_input": FillInputNode,
    "click_element": ClickElementNode,
    "get_html": GetHTMLNode,
    "get_text_from_html": GetTextFromHTMLNode,
    "extract_data_openai": OpenAICallNode,
    "read_property_from_json": ReadPropertyFromJsonNode,
    "wait_for_element": WaitElementNode,
    "delay": DelayNode,
    "condense_html": CondenseHTMLNode,
    "deliver_to_webhook": DeliverToWebhookNode,
    "send_sms": SendSMSNode,
    "branch": BranchNode,
    "json_transform": JsonTransformNode,
    "merge_data": MergeDataNode,
    "write_property_to_json": WritePropertyToJsonNode,
    "email_delivery": EmailDeliveryNode,
}


NODE_CREDIT_COSTS = {
    "launch_standard_browser": 5,
    "launch_stealth_browser": 6,
    "launch_bright_data_browser": 10,
    "fill_input": 1,
    "click_element": 1,
    "get_html": 2,
    "get_text_from_html": 2,
    "extract_data_openai": 4,
    "read_property_from_json": 1,
    "wait_for_element": 1,
    "delay": 1,
    "condense_html": 2,
    "deliver_to_webhook": 2,
    "send_sms": 2,
    "branch": 1,
    "json_transform": 2,
    "merge_data": 1,
    "write_property_to_json": 1,
    "email_delivery": 3,
}
