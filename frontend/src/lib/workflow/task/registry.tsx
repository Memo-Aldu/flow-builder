import { LaunchBrowserTask } from "@/lib/workflow/task/LaunchBrowser";
import { GetHtmlTask } from "@/lib/workflow/task/GetHtml";
import { GetTextFromHtmlTask } from "@/lib/workflow/task/GetTextFromHtml";
import { WorkflowTask } from "@/types/workflows";
import { TaskType } from "@/types/task";
import { ClickElementTask } from "@/lib/workflow/task/ClickElement";
import { FillInputTask } from "@/lib/workflow/task/FillInput";
import { ExtractDataOpenAITask } from "@/lib/workflow/task/ExtractDataOpenAI";
import { ReadPropertyFromJsonTask } from "@/lib/workflow/task/ReadPropertyFromJson";
import { WaitForElementTask } from "@/lib/workflow/task/WaitForElement";
import { DelayTask } from "@/lib/workflow/task/Delay";


type Registry = {
    [K in TaskType]: WorkflowTask & { type: K }
}

export const TaskRegistry: Registry = {
    launch_browser: LaunchBrowserTask,
    get_html: GetHtmlTask,
    get_text_from_html: GetTextFromHtmlTask,
    click_element: ClickElementTask,
    fill_input: FillInputTask,
    extract_data_openai: ExtractDataOpenAITask,
    read_property_from_json: ReadPropertyFromJsonTask,
    wait_for_element: WaitForElementTask,
    delay: DelayTask
}