import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, MessageSquareText } from "lucide-react";

export const SendSMSTask = {
  type: TaskType.SEND_SMS,
  label: "Send SMS",
  icon: (props: LucideProps) => <MessageSquareText className="stroke-sky-500" {...props} />,
  description: "Send SMS message using Twilio",
  isEntryPoint: false,
  credits: 2,
  inputs: [
    {
      name: "Twilio Account SID",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Your Twilio Account SID",
      placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      hideHandle: true
    },
    {
      name: "Twilio Auth Token",
      type: TaskParamType.CREDENTIAL,
      required: true,
      helperText: "Your Twilio Auth Token",
      placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      isSecret: true,
      hideHandle: true
    },
    {
      name: "From Number",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Twilio phone number to send from",
      placeholder: "+1234567890",
    },
    {
      name: "To Number",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Recipient phone number",
      placeholder: "+1234567890",
    },
    {
      name: "Message Content",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
      helperText: "The SMS message content",
      placeholder: "Your message here...",
    },
    {
      name: "Execute Condition",
      type: TaskParamType.CONDITIONAL,
      required: false,
      helperText: "Connect to a branch node to conditionally execute this SMS",
    },
  ],
  outputs: [
    {
      name: "SMS Status",
      type: TaskParamType.STRING,
      helperText: "Status of the SMS (queued, sent, delivered, etc.)",
    },
    {
      name: "Message SID",
      type: TaskParamType.STRING,
      helperText: "Twilio Message SID for tracking",
    },
  ],
} satisfies WorkflowTask;