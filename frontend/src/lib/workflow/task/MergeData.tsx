import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { MergeIcon, LucideProps } from "lucide-react";

export const MergeDataTask = {
    type: TaskType.MERGE_DATA,
    label: "Merge Data",
    icon: (props: LucideProps) => <MergeIcon className="stroke-yellow-400" {...props} />,
    description: "Combine multiple data inputs into a single JSON object",
    isEntryPoint: false,
    inputs: [
        {
            name: "Data 1",
            type: TaskParamType.STRING,
            required: true,
            helperText: "First data input to merge",
        },
        {
            name: "Data 2",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Second data input to merge",
        },
        {
            name: "Data 3",
            type: TaskParamType.STRING,
            required: false,
            helperText: "Third data input to merge (optional)",
        },
        {
            name: "Data 4",
            type: TaskParamType.STRING,
            required: false,
            helperText: "Fourth data input to merge (optional)",
        },
        {
            name: "Merge Strategy",
            type: TaskParamType.SELECT,
            required: false,
            options: [
                { label: "Overwrite", value: "overwrite" },
                { label: "Append Arrays", value: "append" },
            ],
            defaultValue: "overwrite",
            helperText: "How to handle conflicting keys",
        }
    ],
    outputs: [
        {
            name: "Merged Data",
            type: TaskParamType.STRING,
        }
    ],
    credits: 1
} satisfies WorkflowTask;
