import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { Globe2Icon, LucideProps } from "lucide-react";

export const LaunchStealthBrowserTask = {
    type: TaskType.LAUNCH_STEALTH_BROWSER,
    label: "Stealth Browser",
    icon: (props: LucideProps) => <Globe2Icon className="stroke-primary" {...props} />,
    description: "Launch a stealth browser with anti-detection measures and navigate to a specific URL",
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
    credits: 6,
} satisfies WorkflowTask