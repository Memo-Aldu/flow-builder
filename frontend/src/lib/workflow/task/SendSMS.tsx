import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { MessageSquareText, LucideProps } from "lucide-react";

export const SendSMSTask = {
  type: TaskType.SEND_SMS,
  label: "Send SMS",
  icon: (props: LucideProps) => <MessageSquareText className="stroke-purple-500" {...props} />,
  description: "Send SMS message using Twilio",
  isEntryPoint: false,
  inputs: [
    {
      name: "Twilio Account SID",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Your Twilio Account SID",
      placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
    {
      name: "Twilio Auth Token",
      type: TaskParamType.STRING,
      required: true,
      helperText: "Your Twilio Auth Token",
      placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      isSecret: true,
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
};