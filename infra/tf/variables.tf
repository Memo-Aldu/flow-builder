variable "project" {
  type        = string
  default     = "workflow-build"
  description = "Project name used for resource naming and tagging"
}

variable "env" {
  type        = string
  default     = "dev"
  description = "Environment name (dev, staging, prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region to deploy resources"
}

# Database configuration
variable "db_username" {
  type        = string
  default     = "workflow_app"
  description = "Username for the database"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Password for the database (required)"
}

# Scaling configuration
variable "api_desired_count" {
  type        = number
  default     = 1
  description = "Desired number of API service instances"
}

variable "worker_min_capacity" {
  type        = number
  default     = 0
  description = "Minimum number of worker service instances"
}

variable "worker_max_capacity" {
  type        = number
  default     = 5
  description = "Maximum number of worker service instances"
}

# Instance sizing
variable "api_cpu" {
  type        = number
  default     = 256
  description = "CPU units for API service (1024 = 1 vCPU)"
}

variable "api_memory" {
  type        = number
  default     = 512
  description = "Memory for API service in MB"
}

variable "worker_cpu" {
  type        = number
  default     = 512
  description = "CPU units for worker service (1024 = 1 vCPU)"
}

variable "worker_memory" {
  type        = number
  default     = 1024
  description = "Memory for worker service in MB"
}

# Lambda configuration
variable "lambda_memory_size" {
  type        = number
  default     = 256
  description = "Memory size for Lambda functions in MB"
}

variable "lambda_timeout" {
  type        = number
  default     = 60
  description = "Timeout for Lambda functions in seconds"
}

# Networking configuration
variable "enable_nat_gateway" {
  type        = bool
  default     = true
  description = "Whether to enable NAT Gateway(s)"
}

variable "single_nat_gateway" {
  type        = bool
  default     = true
  description = "Whether to create a single NAT Gateway for all private subnets"
}

variable "enable_flow_logs" {
  type        = bool
  default     = false
  description = "Whether to enable VPC Flow Logs"
}

variable "enable_https" {
  type        = bool
  default     = false
  description = "Whether to enable HTTPS on the ALB"
}

# Monitoring configuration
variable "create_dashboard" {
  type        = bool
  default     = true
  description = "Whether to create CloudWatch dashboard"
}

variable "create_alarms" {
  type        = bool
  default     = false
  description = "Whether to create CloudWatch alarms"
}