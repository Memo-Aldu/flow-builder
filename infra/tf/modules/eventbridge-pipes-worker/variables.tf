variable "name_prefix" {
  type        = string
  description = "Prefix to use for resource names"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "container_image" {
  type        = string
  description = "Docker image to use for the worker container"
}

variable "queue_url" {
  type        = string
  description = "URL of the SQS queue"
}

variable "queue_arn" {
  type        = string
  description = "ARN of the SQS queue"
}

variable "dlq_name" {
  type        = string
  description = "Name of the Dead Letter Queue"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs to launch the task in"
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs to associate with the task"
}

variable "cluster_id" {
  type        = string
  description = "ID of the ECS cluster to run the task in"
}

variable "assign_public_ip" {
  type        = bool
  default     = true
  description = "Whether to assign public IPs to tasks (set to true to ensure internet access)"
}

variable "task_cpu" {
  type        = number
  default     = 1024
  description = "CPU units for the task (1024 = 1 vCPU)"
}

variable "task_memory" {
  type        = number
  default     = 2048
  description = "Memory for the task in MB"
}

variable "batch_size" {
  type        = number
  default     = 1
  description = "Maximum number of messages to process in a batch"
}

variable "maximum_batching_window_in_seconds" {
  type        = number
  default     = 60
  description = "Maximum time to wait for a batch to fill up"
}

variable "max_execution_time_seconds" {
  type        = number
  default     = 240
  description = "Maximum execution time for the worker task in seconds"
}

variable "headless_mode" {
  type        = bool
  default     = true
  description = "Whether to run the browser in headless mode"
}

variable "task_secrets" {
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default     = []
  description = "List of secrets to pass to the task"
}

variable "secrets_arns" {
  type        = list(string)
  default     = ["*"]
  description = "List of ARNs of secrets that the task can access"
}

variable "create_dlq_alarm" {
  type        = bool
  default     = true
  description = "Whether to create a CloudWatch alarm for the DLQ"
}

# Database configuration
variable "db_host" {
  type        = string
  description = "Database host"
}

variable "db_port" {
  type        = string
  description = "Database port"
  default     = "5432"
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "flowbuilder"
}

variable "db_user" {
  type        = string
  description = "Database username"
  default     = "root"
}

variable "db_password" {
  type        = string
  description = "Database password"
  sensitive   = true
}

variable "use_db_secrets" {
  type        = bool
  description = "Whether to use database-stored secrets instead of AWS Secrets Manager"
  default     = true
}

variable "secret_encryption_key" {
  type        = string
  description = "Base64-encoded encryption key for database-stored secrets"
  sensitive   = true
}

variable "secret_encryption_salt" {
  type        = string
  description = "Salt for encryption key derivation"
}

variable "secret_encryption_password" {
  type        = string
  description = "Password for encryption key derivation"
  sensitive   = true
}

variable "alarm_actions" {
  type        = list(string)
  default     = []
  description = "List of ARNs to notify when the DLQ alarm fires"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}
