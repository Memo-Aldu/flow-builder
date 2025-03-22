import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, TimerIcon } from "lucide-react";

export const DelayTask = {
    type: TaskType.DELAY,
    label: "Delay",
    icon: (props: LucideProps) => <TimerIcon className="stroke-emerald-400" {...props} />,
    description: "Delay for a specified amount of time",
    isEntryPoint: false,
    inputs: [
        {
            name: "Duration",
            type: TaskParamType.NUMBER,
            required: true,
            min : 1,
            max : 10,
            helperText : "Enter a number between 1 and 10"
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