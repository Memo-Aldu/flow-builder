import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { GlobeIcon, LucideProps } from "lucide-react";

export const LaunchStandardBrowserTask = {
    type: TaskType.LAUNCH_STANDARD_BROWSER,
    label: "Standard Browser",
    icon: (props: LucideProps) => <GlobeIcon className="stroke-primary" {...props} />,
    description: "Launch a standard browser and navigate to a specific URL",
    isEntryPoint: true,
    inputs: [
        {
            name: "Website URL",
            type: TaskParamType.STRING,
            helperText: "eg: https://www.google.com",
            required: true,
            hideHandle: true,
        }
    ],
    outputs: [
        {
            name: "Web Page",
            type: TaskParamType.BROWSER_INSTANCE,
        }
    ],
    credits: 5,
} satisfies WorkflowTask