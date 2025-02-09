import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { CodeIcon, LucideProps } from "lucide-react";

export const GetHtmlTask = {
    type: TaskType.GET_HTML,
    label: "Get HTML From Page",
    icon: (props: LucideProps) => <CodeIcon className="stroke-rose-400" {...props} />,
    description: "Get the HTML content of a web page",
    isEntryPoint: false,
    inputs: [
        {
            name: "Web Page",
            type: TaskParamType.BROWSER_INSTANCE,
            required: true,
        }
    ],
    outputs: [
        {
            name: "Html Content",
            type: TaskParamType.STRING,
        },
        {
            name: "Web Page",
            type: TaskParamType.BROWSER_INSTANCE,
        }
    ],
    credits: 2
} satisfies WorkflowTask