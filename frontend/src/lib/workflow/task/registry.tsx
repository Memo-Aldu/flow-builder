import { LaunchBrowserTask } from "@/lib/workflow/task/LaunchBrowser";
import { GetHtmlTask } from "@/lib/workflow/task/GetHtml";
import { GetTextFromHtmlTask } from "@/lib/workflow/task/GetTextFromHtml";
import { WorkflowTask } from "@/types/workflows";
import { TaskType } from "@/types/task";
import { ClickElement } from "@/lib/workflow/task/ClickElement";
import { FillInput } from "@/lib/workflow/task/FillInput";
import { ExtractDataOpenAI } from "@/lib/workflow/task/ExtractDataOpenAI";
import { ReadPropertyFromJson } from "@/lib/workflow/task/ReadPropertyFromJson";


type Registry = {
    [K in TaskType]: WorkflowTask & { type: K }
}

export const TaskRegistry: Registry = {
    launch_browser: LaunchBrowserTask,
    get_html: GetHtmlTask,
    get_text_from_html: GetTextFromHtmlTask,
    click_element: ClickElement,
    fill_input: FillInput,
    extract_data_openai: ExtractDataOpenAI,
    read_property_from_json: ReadPropertyFromJson,
}