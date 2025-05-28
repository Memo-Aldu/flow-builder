import { TaskParamType, TaskType } from "@/types/task";
import { WorkflowTask } from "@/types/workflows";
import { LucideProps, MailIcon } from "lucide-react";

export const EmailDeliveryTask = {
    type: TaskType.EMAIL_DELIVERY,
    label: "Send Email",
    icon: (props: LucideProps) => <MailIcon className="stroke-sky-500" {...props} />,
    description: "Send emails with optional attachments using SMTP",
    isEntryPoint: false,
    inputs: [
        {
            name: "SMTP Server",
            type: TaskParamType.STRING,
            required: true,
            helperText: "SMTP server hostname (e.g., smtp.gmail.com)",
        },
        {
            name: "SMTP Port",
            type: TaskParamType.NUMBER,
            required: false,
            defaultValue: "587",
            helperText: "SMTP server port (587 for TLS, 465 for SSL, 25 for plain)",
        },
        {
            name: "Username",
            type: TaskParamType.STRING,
            required: true,
            helperText: "SMTP username (usually your email address)",
        },
        {
            name: "Password",
            type: TaskParamType.CREDENTIAL,
            required: true,
            hideHandle: true,
            helperText: "SMTP password stored as a credential",
        },
        {
            name: "From Email",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Sender email address",
        },
        {
            name: "To Email",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Recipient email address",
        },
        {
            name: "Subject",
            type: TaskParamType.STRING,
            required: true,
            helperText: "Email subject line",
        },
        {
            name: "Body",
            type: TaskParamType.STRING,
            required: true,
            variant: "textarea",
            helperText: "Email body content",
        },
        {
            name: "CC Email",
            type: TaskParamType.STRING,
            required: false,
            helperText: "CC recipients (comma-separated)",
        },
        {
            name: "BCC Email",
            type: TaskParamType.STRING,
            required: false,
            helperText: "BCC recipients (comma-separated)",
        },
        {
            name: "Use TLS",
            type: TaskParamType.SELECT,
            required: false,
            options: [
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
            ],
            defaultValue: "true",
            helperText: "Use TLS encryption",
        },
        {
            name: "Body Type",
            type: TaskParamType.SELECT,
            required: false,
            options: [
                { label: "Plain Text", value: "plain" },
                { label: "HTML", value: "html" },
            ],
            defaultValue: "plain",
            helperText: "Email body format",
        },
        {
            name: "Execute Condition",
            type: TaskParamType.CONDITIONAL,
            required: false,
            helperText: "Connect to a branch node to conditionally execute this email",
        }
    ],
    outputs: [
        {
            name: "Delivery Status",
            type: TaskParamType.STRING,
        },
        {
            name: "Message ID",
            type: TaskParamType.STRING,
        }
    ],
    credits: 3
} satisfies WorkflowTask;
