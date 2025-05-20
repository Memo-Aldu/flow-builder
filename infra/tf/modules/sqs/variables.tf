variable "name" {
  type    = string
  default = "workflow-build"
}

variable "max_receive_count" {
  type    = number
  default = 5
}

variable "visibility_timeout_seconds" {
  type    = number
  default = 300
}

variable "tags" {
  type    = map(string)
  default = {}
}