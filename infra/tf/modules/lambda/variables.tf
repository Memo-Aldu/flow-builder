variable "function_name" {
  type        = string
  description = "Name of the Lambda function"
}

variable "handler" {
  type        = string
  description = "Handler function (e.g., index.handler)"
}

variable "filename" {
  type        = string
  default     = null
  description = "Path to the Lambda deployment package (for ZIP package type)"
}

variable "image_uri" {
  type        = string
  default     = null
  description = "ECR image URI for container image (for Image package type)"
}

variable "package_type" {
  type        = string
  default     = "Zip"
  description = "Lambda package type (Zip or Image)"
  validation {
    condition     = contains(["Zip", "Image"], var.package_type)
    error_message = "Package type must be either Zip or Image."
  }
}

variable "runtime" {
  type        = string
  default     = "python3.12"
  description = "Lambda runtime environment (not required for Image package type)"
}

variable "memory_size" {
  type        = number
  default     = 256
  description = "Amount of memory in MB for the Lambda function"
}

variable "timeout" {
  type        = number
  default     = 60
  description = "Timeout in seconds for the Lambda function"
}

variable "subnet_ids" {
  type        = list(string)
  default     = null
  description = "List of subnet IDs for VPC configuration (optional)"
}

variable "security_group_ids" {
  type        = list(string)
  default     = null
  description = "List of security group IDs for VPC configuration (optional)"
}

variable "sqs_queue_arn" {
  type        = string
  default     = null
  description = "ARN of the SQS queue to grant permissions to (optional)"
}

variable "enable_cloudwatch_logs" {
  type        = bool
  default     = true
  description = "Whether to enable CloudWatch Logs permissions"
}

variable "env_vars" {
  type        = map(string)
  default     = {}
  description = "Environment variables for the Lambda function"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}