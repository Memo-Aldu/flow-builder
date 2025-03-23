import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, RectangleEllipsisIcon } from "lucide-react";

export const FillInputTask = {
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
            helperText: "CSS selector of the input to fill",
        },
        {
            name: "Value",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Value to fill in the input",
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