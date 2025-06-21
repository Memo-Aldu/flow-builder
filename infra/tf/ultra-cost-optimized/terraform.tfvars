# Configuration for ultra-cost-optimized worker
aws_region   = "us-east-1"
env          = "dev"
project_name = "flow-builder"

# VPC Configuration
vpc_tag_name = "main-vpc"
public_subnet_tag_pattern = ["main-subnet-public*"]
assign_public_ip = true

# Database Configuration
db_host     = "aws-0-us-east-1.pooler.supabase.com"
db_port     = "6543"
db_name     = "postgres"
db_username = "postgres.uctqyckvmrgpxzxkzhxv"
# db_password = "" # Set this via environment variable TF_VAR_db_password

# Database secrets and encryption configuration
use_db_secrets             = true
#secret_encryption_key      =  ""
# Set via environment variables
# secret_encryption_salt     = ""
# secret_encryption_password = ""

# Task Configuration
task_cpu                   = 1024 # 1 vCPU
task_memory                = 2048 # 2 GB
batch_size                 = 1
max_execution_time_seconds = 240
headless_mode              = false

# Lambda Configuration
lambda_memory_size  = 256
lambda_timeout      = 60
create_lambda       = true
schedule_expression = "rate(5 minutes)"
