import { BranchNodeTask } from "@/lib/workflow/task/BranchNode";
import { ClickElementTask } from "@/lib/workflow/task/ClickElement";
import { CondenseHtmlTask } from "@/lib/workflow/task/CondenseHtml";
import { DelayTask } from "@/lib/workflow/task/Delay";
import { EmailDeliveryTask } from "@/lib/workflow/task/EmailDelivery";
import { ExtractDataOpenAITask } from "@/lib/workflow/task/ExtractDataOpenAI";
import { FillInputTask } from "@/lib/workflow/task/FillInput";
import { GetHtmlTask } from "@/lib/workflow/task/GetHtml";
import { GetTextFromHtmlTask } from "@/lib/workflow/task/GetTextFromHtml";
import { JsonTransformTask } from "@/lib/workflow/task/JsonTransform";
import { LaunchBrightDataBrowserTask } from "@/lib/workflow/task/LaunchBrightDataBrowser";
import { LaunchStandardBrowserTask } from "@/lib/workflow/task/LaunchStandardBrowser";
import { LaunchStealthBrowserTask } from "@/lib/workflow/task/LaunchStealthBrowser";
import { MergeDataTask } from "@/lib/workflow/task/MergeData";
import { ReadPropertyFromJsonTask } from "@/lib/workflow/task/ReadPropertyFromJson";
import { SendSMSTask } from "@/lib/workflow/task/SendSMS";
import { WaitForElementTask } from "@/lib/workflow/task/WaitForElement";
import { WritePropertyToJsonTask } from "@/lib/workflow/task/WritePropertyToJson";
import { TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { DeliverToWebhookTask } from "./DeliverToWebhook";


type Registry = {
    [K in TaskType]: WorkflowTask & { type: K }
}

export const TaskRegistry: Registry = {
    launch_standard_browser: LaunchStandardBrowserTask,
    launch_stealth_browser: LaunchStealthBrowserTask,
    launch_bright_data_browser: LaunchBrightDataBrowserTask,
    get_html: GetHtmlTask,
    get_text_from_html: GetTextFromHtmlTask,
    click_element: ClickElementTask,
    fill_input: FillInputTask,
    extract_data_openai: ExtractDataOpenAITask,
    read_property_from_json: ReadPropertyFromJsonTask,
    wait_for_element: WaitForElementTask,
    delay: DelayTask,
    condense_html: CondenseHtmlTask,
    deliver_to_webhook: DeliverToWebhookTask,
    send_sms: SendSMSTask,
    branch: BranchNodeTask,
    json_transform: JsonTransformTask,
    merge_data: MergeDataTask,
    write_property_to_json: WritePropertyToJsonTask,
    email_delivery: EmailDeliveryTask,
}
