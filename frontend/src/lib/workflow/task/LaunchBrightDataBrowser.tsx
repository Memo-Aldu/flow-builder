import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { GlobeLockIcon, LucideProps } from "lucide-react";

export const LaunchBrightDataBrowserTask = {
    type: TaskType.LAUNCH_BRIGHT_DATA_BROWSER,
    label: "Bright Data Browser",
    icon: (props: LucideProps) => <GlobeLockIcon className="stroke-orange-400" {...props} />,
    description: "Launch a Bright Data browser with automatic proxy rotation and captcha solving",
    isEntryPoint: true,
    inputs: [
        {
            name: "Website URL",
            type: TaskParamType.STRING,
            helperText: "eg: https://www.google.com",
            required: true,
            hideHandle: true,
        },
        {
            name: "Bright Data Browser Username",
            type: TaskParamType.STRING,
            required: true,
            hideHandle: true,
        },
        {
            name: "Bright Data Browser Password",
            type: TaskParamType.CREDENTIAL,
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
    credits: 7,
} satisfies WorkflowTask