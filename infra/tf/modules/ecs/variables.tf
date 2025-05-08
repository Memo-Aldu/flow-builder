variable "name"               { type = string }
variable "cluster_arn"        { type = string }
variable "image"              { type = string }
variable "aws_region"         { type = string }
variable "subnet_ids"         { type = list(string) }

variable "container_port"     {
    type = number
    default = 80
}

variable "desired_count"      {
    type = number
    default = 0
}

variable "cpu"                {
    type = number
    default = 256
}

variable "memory"             {
    type = number
    default = 512
}

variable "env_vars"           {
    type = map(string)
    default = {}
}

variable "alb_listener_arn"   {
    type = string
    default = null
}

variable "create_load_balancer" {
    type = bool
    default = false
    description = "Whether to create load balancer resources"
}

variable "queue_arn"          {
    type = string
    default = null
}

variable "task_exec_iam_role_policy_json" {
  description = "Optional JSON policy to attach to the ECS task execution role"
  type        = string
  default     = null
}

variable "tags"               {
    type = map(string)
    default = {}
}