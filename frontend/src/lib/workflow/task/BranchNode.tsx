import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { GitBranchIcon, LucideProps } from "lucide-react";

export const BranchNodeTask = {
    type: TaskType.BRANCH,
    label: "Branch",
    icon: (props: LucideProps) => <GitBranchIcon className="stroke-purple-400" {...props} />,
    description: "Route workflow execution based on condition evaluation",
    isEntryPoint: false,
    inputs: [
        {
            name: "Left Value",
            type: TaskParamType.STRING,
            required: true,
            helperText: "The left side value for comparison",
        },
        {
            name: "Operator",
            type: TaskParamType.SELECT,
            required: true,
            options: [
                { label: "Equals", value: "equals" },
                { label: "Not Equals", value: "not equals" },
                { label: "Less Than", value: "less than" },
                { label: "Greater Than", value: "greater than" },
                { label: "Less Than or Equal", value: "less than or equal" },
                { label: "Greater Than or Equal", value: "greater than or equal" },
                { label: "Contains", value: "contains" },
                { label: "Does Not Contain", value: "does not contain" },
            ],
            defaultValue: "equals",
            helperText: "Comparison operator to use",
        },
        {
            name: "Right Value",
            type: TaskParamType.STRING,
            required: true,
            helperText: "The right side value for comparison",
        }
    ],
    outputs: [
        {
            name: "True Path",
            type: TaskParamType.CONDITIONAL,
        },
        {
            name: "False Path",
            type: TaskParamType.CONDITIONAL,
        },
        {
            name: "Result",
            type: TaskParamType.STRING,
        },
        {
            name: "Data",
            type: TaskParamType.STRING,
        }
    ],
    credits: 1
} satisfies WorkflowTask;
