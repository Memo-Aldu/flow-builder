variable "name_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "db_username" {
  type        = string
  description = "Database username"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Database password"
}

variable "db_host" {
  type        = string
  description = "Database host"
}

variable "db_port" {
  type        = number
  default     = 5432
  description = "Database port"
}

variable "db_name" {
  type        = string
  default     = "workflow_app"
  description = "Database name"
}

variable "recovery_window_in_days" {
  type        = number
  default     = 0
  description = "Number of days that AWS Secrets Manager waits before it can delete the secret"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}
