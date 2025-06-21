# AWS and environment configuration
variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "env" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)"
}

variable "project_name" {
  type        = string
  description = "Project name"
}

# VPC configuration
variable "vpc_tag_name" {
  type        = string
  description = "Name tag of the existing VPC (e.g., 'main-vpc')"
  default     = "main-vpc"
}

variable "public_subnet_tag_pattern" {
  type        = list(string)
  description = "List of Name tag patterns to match public subnets (e.g., ['main-subnet-public*'])"
  default     = ["main-subnet-public*"]
}

variable "assign_public_ip" {
  type        = bool
  description = "Whether to assign public IPs to tasks (set to true to ensure internet access to external database and ECR)"
}

# Database configuration
variable "db_host" {
  type        = string
  description = "Database host"
}

variable "db_port" {
  type        = string
  description = "Database port"
}

variable "db_name" {
  type        = string
  description = "Database name"
}

variable "db_username" {
  type        = string
  description = "Database username"
}

variable "db_password" {
  type        = string
  description = "Database password"
  sensitive   = true
}

variable "use_db_secrets" {
  type        = bool
  default     = false
  description = "Whether to use database-stored secrets instead of AWS Secrets Manager"
}

# Encryption configuration for database-stored secrets
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

# Task configuration
variable "task_cpu" {
  type        = number
  description = "CPU units for the task (1024 = 1 vCPU)"
}

variable "task_memory" {
  type        = number
  description = "Memory for the task in MB"
}

variable "batch_size" {
  type        = number
  description = "Maximum number of messages to process in a batch"
}

variable "max_execution_time_seconds" {
  type        = number
  description = "Maximum execution time for the worker task in seconds"
}

variable "headless_mode" {
  type        = bool
  description = "Whether to run the browser in headless mode"
}

# Lambda configuration
variable "lambda_memory_size" {
  type        = number
  description = "Memory size for Lambda functions in MB"
}

variable "lambda_timeout" {
  type        = number
  description = "Timeout for Lambda functions in seconds"
}

variable "create_lambda" {
  type        = bool
  description = "Whether to create the Lambda function"
}

variable "schedule_expression" {
  type        = string
  description = "Schedule expression for the EventBridge rule (e.g., rate(5 minutes), cron(0/5 * * * ? *))"
}
