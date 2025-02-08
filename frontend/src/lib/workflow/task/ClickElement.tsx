import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, MousePointerClickIcon } from "lucide-react";

export const ClickElement = {
    type: TaskType.CLICK_ELEMENT,
    label: "Click Element",
    icon: (props: LucideProps) => <MousePointerClickIcon className="stroke-orange-400" {...props} />,
    description: "Click on an element on a web page",
    isEntryPoint: false,
    inputs: [
        {
            name: "Selector",
            type: TaskParamType.STRING,
            required: true,
        },
        {
            name: "Web Page",
            type: TaskParamType.BROWSER_INSTANCE,
            required: true,
        }
    ],
    outputs: [
        {
            name: "Web Page",
            type: TaskParamType.BROWSER_INSTANCE,
        }
    ],
    credits: 1
} satisfies WorkflowTask