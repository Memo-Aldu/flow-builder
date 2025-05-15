variable "name_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "create_dashboard" {
  type        = bool
  default     = true
  description = "Whether to create CloudWatch dashboard"
}

variable "create_alarms" {
  type        = bool
  default     = true
  description = "Whether to create CloudWatch alarms"
}

variable "cluster_name" {
  type        = string
  description = "Name of the ECS cluster"
}

variable "api_service_name" {
  type        = string
  description = "Name of the API service"
}

variable "worker_service_name" {
  type        = string
  description = "Name of the Worker service"
}

variable "queue_name" {
  type        = string
  description = "Name of the SQS queue"
}

variable "db_instance_id" {
  type        = string
  description = "ID of the RDS instance"
}

variable "alarm_actions" {
  type        = list(string)
  default     = []
  description = "List of ARNs to notify when alarms trigger"
}
