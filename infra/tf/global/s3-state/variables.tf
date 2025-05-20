variable "project" {
  type        = string
  default     = "workflow-build"
  description = "Project name used for resource naming and tagging"
}

variable "env" {
  type        = string
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

variable "tags" {
  type = map(string)
  default = {
    ManagedBy = "terraform"
  }
  description = "Tags to apply to all resources"
}
