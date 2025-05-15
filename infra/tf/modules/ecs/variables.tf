variable "name" {
  type        = string
  description = "Name of the ECS service"
}

variable "cluster_arn" {
  type        = string
  description = "ARN of the ECS cluster"
}

variable "image" {
  type        = string
  description = "Docker image to use for the container"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs to launch the service in"
}

variable "security_group_ids" {
  type        = list(string)
  default     = null
  description = "List of security group IDs to associate with the service"
}

variable "container_port" {
  type        = number
  default     = 80
  description = "Port exposed by the container"
}

variable "desired_count" {
  type        = number
  default     = 0
  description = "Desired number of tasks"
}

variable "cpu" {
  type        = number
  default     = 256
  description = "CPU units for the task (1024 = 1 vCPU)"
}

variable "memory" {
  type        = number
  default     = 512
  description = "Memory for the task in MB"
}

variable "env_vars" {
  type        = map(string)
  default     = {}
  description = "Environment variables for the container"
}

variable "alb_listener_arn" {
  type        = string
  default     = null
  description = "ARN of the ALB listener"
}

variable "create_load_balancer" {
  type        = bool
  default     = false
  description = "Whether to create load balancer resources"
}

variable "queue_arn" {
  type        = string
  default     = null
  description = "ARN of the SQS queue for autoscaling"
}

variable "task_exec_iam_role_policy_json" {
  type        = string
  default     = null
  description = "Optional JSON policy to attach to the ECS task execution role"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}

# Autoscaling configuration
variable "autoscaling_enabled" {
  type        = bool
  default     = false
  description = "Whether to enable autoscaling for the service"
}

variable "autoscaling_min_capacity" {
  type        = number
  default     = 0
  description = "Minimum number of tasks when autoscaling is enabled"
}

variable "autoscaling_max_capacity" {
  type        = number
  default     = 5
  description = "Maximum number of tasks when autoscaling is enabled"
}

variable "autoscaling_cpu_target" {
  type        = number
  default     = 70
  description = "Target CPU utilization (%) for autoscaling"
}

variable "autoscaling_memory_target" {
  type        = number
  default     = 70
  description = "Target memory utilization (%) for autoscaling"
}

variable "autoscaling_scale_in_cooldown" {
  type        = number
  default     = 300
  description = "Cooldown period in seconds after scaling in"
}

variable "autoscaling_scale_out_cooldown" {
  type        = number
  default     = 60
  description = "Cooldown period in seconds after scaling out"
}