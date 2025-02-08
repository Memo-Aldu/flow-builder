import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { BrainIcon, LucideProps } from "lucide-react";

export const ExtractDataOpenAI = {
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
        },
        {
            name: "Content",
            type: TaskParamType.STRING,
            required: true,
        },
        {
            name: "API Key",
            type: TaskParamType.CREDENTIAL,
            required: true,
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