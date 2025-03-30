import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, Minimize2Icon } from "lucide-react";

export const CondenseHtmlTask = {
    type: TaskType.CONDENSE_HTML,
    label: "Condense HTML",
    icon: (props: LucideProps) => <Minimize2Icon className="stroke-rose-400" {...props} />,
    description: "Minimize HTML content by removing unnecessary tags and attributes",
    isEntryPoint: false,
    inputs: [
        {
            name: "Html",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
            helperText: "HTML content to extract text from",
        },
        {
            name: "Selector",
            type: TaskParamType.STRING,
            required: false,
            helperText: "CSS selector of the element to extract text from",
        },
        {
            name: "Max Length",
            type: TaskParamType.NUMBER,
            required: false,
            helperText: "Maximum length of the text to extract",
            min : 0,
        },
    ],
    outputs: [
        {
            name: "Reduced Html",
            type: TaskParamType.STRING,
        },
    ],
    credits: 2
} satisfies WorkflowTask