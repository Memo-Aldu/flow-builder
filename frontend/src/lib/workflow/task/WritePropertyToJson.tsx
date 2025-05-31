import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { EditIcon, LucideProps } from "lucide-react";

export const WritePropertyToJsonTask = {
    type: TaskType.WRITE_PROPERTY_TO_JSON,
    label: "Write Property to JSON",
    icon: (props: LucideProps) => <EditIcon className="stroke-yellow-400" {...props} />,
    description: "Write or update properties in JSON objects",
    isEntryPoint: false,
    inputs: [
        {
            name: "JSON",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
            helperText: "JSON object to modify",
        },
        {
            name: "Property Name",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Property name to write (supports dot notation for nested properties, e.g., 'user.profile.name')",
        },
        {
            name: "Property Value",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Value to write to the property",
        }
    ],
    outputs: [
        {
            name: "Updated JSON",
            type: TaskParamType.STRING,
        }
    ],
    credits: 1
} satisfies WorkflowTask;
