variable "name_prefix" {
  type        = string
  description = "Prefix for resource names"
}

variable "region" {
  type        = string
  description = "AWS region"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "CIDR block for the VPC"
}

variable "az_count" {
  type        = number
  default     = 2
  description = "Number of availability zones to use"
}

variable "enable_nat_gateway" {
  type        = bool
  default     = false
  description = "Whether to create NAT Gateway(s)"
}

variable "single_nat_gateway" {
  type        = bool
  default     = true
  description = "Whether to create a single NAT Gateway for all private subnets"
}

variable "enable_nat_instance" {
  type        = bool
  default     = true
  description = "Whether to create a NAT Instance (EC2)"
}

variable "nat_instance_type" {
  type        = string
  default     = "t3.nano"
  description = "Instance type for the NAT instance"
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

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}
