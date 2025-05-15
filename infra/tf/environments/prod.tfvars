# Production environment configuration

# General
env = "prod"
aws_region = "us-east-1"

# Database
db_username = "workflow_app"

# API Service
api_desired_count = 3
api_cpu = 1024
api_memory = 2048

# Worker Service
worker_min_capacity = 2
worker_max_capacity = 20
worker_cpu = 2048
worker_memory = 4096

# Lambda Configuration
lambda_memory_size = 1024
lambda_timeout = 300
