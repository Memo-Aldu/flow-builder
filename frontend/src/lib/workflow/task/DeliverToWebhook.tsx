import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { SendIcon, LucideProps } from "lucide-react";

export const DeliverToWebhookTask = {
  type: TaskType.DELIVER_TO_WEBHOOK,
  label: "Deliver to Webhook",
  icon: (props: LucideProps) => <SendIcon className="stroke-sky-500" {...props} />,
  description: "Send result to an external webhook via HTTP POST",
  isEntryPoint: false,
  inputs: [
    {
        name: "Webhook URL",
        type: TaskParamType.STRING,
        required: true,
        helperText: "The URL to deliver the result to",
    },
    {
      name: "Payload",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
      helperText: "The payload to send (typically JSON)",
    },
    {
        name: "Content Type",
        type: TaskParamType.SELECT,
        required: false,
        options: [
            { label: "application/json", value: "application/json" },
            { label: "application/x-www-form-urlencoded", value: "application/x-www-form-urlencoded" },
            { label: "text/plain", value: "text/plain" },
        ],
        defaultValue: "application/json",
        helperText: "Content type of the payload",
    },
    {
        name: "Authorization Type",
        type: TaskParamType.SELECT,
        required: false,
        options: [
            { label: "None", value: "none" },
            { label: "Basic", value: "basic" },
            { label: "Bearer", value: "bearer" },
        ],
        defaultValue: "none",
        helperText: "Type of authorization to use",
    },
    {
      name: "Authorization Value",
      type: TaskParamType.STRING,
      required: false,
      helperText: "Optional Authorization header (e.g., token)",
    },
  ],
  outputs: [
    {
      name: "Delivery Status",
      type: TaskParamType.STRING,
    },
    {
      name: "Response Body",
      type: TaskParamType.STRING,
    },
  ],
  credits: 2,
} satisfies WorkflowTask;
