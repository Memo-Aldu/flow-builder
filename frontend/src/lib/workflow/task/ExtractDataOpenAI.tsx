import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { BrainIcon, LucideProps } from "lucide-react";

export const ExtractDataOpenAITask = {
    type: TaskType.EXTRACT_DATA_OPENAI,
    label: "Use OpenAI to Extract Data",
    icon: (props: LucideProps) => <BrainIcon className="stroke-rose-400" {...props} />,
    description: "Use OpenAI to extract data from content",
    isEntryPoint: false,
    inputs: [
        {
            name: "Prompt",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
            helperText: "Prompt to send to OpenAI API",
        },
        {
            name: "Content",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Content to extract data from",
        },
        {
            name: "API Key",
            type: TaskParamType.CREDENTIAL,
            required: true,
            hideHandle: true,
            helperText: "API Key for OpenAI API",
        }
    ],
    outputs: [
        {
            name: "Extracted Data",
            type: TaskParamType.STRING,
        }
    ],
    credits: 4
} satisfies WorkflowTask