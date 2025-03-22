import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { FileJson2, LucideProps } from "lucide-react";

export const ReadPropertyFromJsonTask = {
    type: TaskType.READ_PROPERTY_FROM_JSON,
    label: "Read Property From JSON",
    icon: (props: LucideProps) => <FileJson2 className="stroke-yellow-400" {...props} />,
    description: "Read a property from a JSON input object",
    isEntryPoint: false,
    inputs: [
        {
            name: "JSON",
            type: TaskParamType.STRING,
            required: true,
            helperText: "JSON object to read property from",
        },
        {
            name: "Property Name",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Name of the property to read",
        }
    ],
    outputs: [
        {
            name: "Property Value",
            type: TaskParamType.STRING,
        }
    ],
    credits: 1
} satisfies WorkflowTask