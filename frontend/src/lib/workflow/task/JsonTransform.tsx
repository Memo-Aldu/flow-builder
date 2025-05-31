import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { RefreshCwIcon, LucideProps } from "lucide-react";

export const JsonTransformTask = {
    type: TaskType.JSON_TRANSFORM,
    label: "JSON Transform",
    icon: (props: LucideProps) => <RefreshCwIcon className="stroke-yellow-400" {...props} />,
    description: "Transform JSON data using JSONPath expressions or simple transformations",
    isEntryPoint: false,
    inputs: [
        {
            name: "Input JSON",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
            helperText: "JSON data to transform",
        },
        {
            name: "Transform Rules",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
            helperText: "JSON object defining transformation rules. Example: {\"output_field\": \"$.input_field\", \"static_value\": \"hello\"}",
        }
    ],
    outputs: [
        {
            name: "Transformed JSON",
            type: TaskParamType.STRING,
        }
    ],
    credits: 2
} satisfies WorkflowTask;
