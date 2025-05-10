variable "function_name" { type = string }
variable "handler"       { type = string }
variable "filename"      { type = string }

variable "runtime"       { 
    type = string 
    default = "python3.12" 
}

variable "env_vars"      { 
    type = map(string) 
    default = {} 
}

variable "tags"          { 
    type = map(string) 
    default = {} 
}