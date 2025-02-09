import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, RectangleEllipsisIcon } from "lucide-react";

export const FillInput = {
    type: TaskType.FILL_INPUT,
    label: "Fill Input on Page",
    icon: (props: LucideProps) => <RectangleEllipsisIcon className="stroke-orange-400" {...props} />,
    description: "Fill an input on a web page",
    isEntryPoint: false,
    inputs: [
        {
            name: "Selector",
            type: TaskParamType.STRING,
            required: true,
        },
        {
            name: "Value",
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