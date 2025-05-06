variable "project" {
  type    = string
  default = "workflow-build"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "db_username" {
  type    = string
}

variable "db_password" {
  type      = string
  sensitive = true
}