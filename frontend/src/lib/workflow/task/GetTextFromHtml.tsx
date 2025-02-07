import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, TextIcon } from "lucide-react";

export const GetTextFromHtmlTask = {
    type: TaskType.GET_TEXT_FROM_HTML,
    label: "Get Text From HTML",
    icon: (props: LucideProps) => <TextIcon className="stroke-rose-400" {...props} />,
    description: "Extract text from a specific HTML element",
    isEntryPoint: false,
    inputs: [
        {
            name: "Html",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
        },
        {
            name: "Selector",
            type: TaskParamType.STRING,
            required: true,
        }
    ],
    outputs: [
        {
            name: "Text",
            type: TaskParamType.STRING,
        },
    ],
    credits: 2
} satisfies WorkflowTask