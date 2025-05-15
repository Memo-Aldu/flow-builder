# Staging environment configuration

# General
env = "staging"
aws_region = "us-east-1"

# Database
db_username = "workflow_app"

# API Service
api_desired_count = 2
api_cpu = 512
api_memory = 1024

# Worker Service
worker_min_capacity = 1
worker_max_capacity = 10
worker_cpu = 1024
worker_memory = 2048

# Lambda Configuration
lambda_memory_size = 512
lambda_timeout = 120
