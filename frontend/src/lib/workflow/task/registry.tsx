import { LaunchBrowserTask } from "@/lib/workflow/task/LaunchBrowser";
import { GetHtmlTask } from "@/lib/workflow/task/GetHtml";
import { GetTextFromHtmlTask } from "@/lib/workflow/task/GetTextFromHtml";
import { WorkflowTask } from "@/types/workflows";
import { TaskType } from "@/types/task";


type Registry = {
    [K in TaskType]: WorkflowTask & { type: K }
}

export const TaskRegistry: Registry = {
    launch_browser: LaunchBrowserTask,
    get_html: GetHtmlTask,
    get_text_from_html: GetTextFromHtmlTask,
}