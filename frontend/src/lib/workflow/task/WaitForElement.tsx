import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { EyeIcon, LucideProps } from "lucide-react";

export const WaitForElementTask = {
    type: TaskType.WAIT_FOR_ELEMENT,
    label: "Wait For Element",
    icon: (props: LucideProps) => <EyeIcon className="stroke-emerald-400" {...props} />,
    description: "Wait for an element to appear on the page",
    isEntryPoint: false,
    inputs: [
        {
            name: "Selector",
            type: TaskParamType.STRING,
            required: true,
            helperText: "CSS selector of the element to wait for",
        },
        {
            name: "Visibility",
            type: TaskParamType.SELECT,
            hideHandle: true,
            required: true,
            options: [
                { value: "visible", label: "Visible" },
                { value: "hidden", label: "Hidden" },
            ],
            helperText: "Wait for the element to be visible or hidden",
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