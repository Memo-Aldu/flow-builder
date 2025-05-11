# Development environment configuration

# General
env = "dev"
aws_region = "us-east-1"

# Database
db_username = "workflow_app"

# API Service
api_desired_count = 0  # Start with 0 and let autoscaling handle it
api_cpu = 256
api_memory = 512

# Worker Service
# Scale to zero when not in use
worker_min_capacity = 0  
worker_max_capacity = 5
worker_cpu = 512
worker_memory = 1024

# Lambda Configuration
lambda_memory_size = 256
lambda_timeout = 60

# Networking
enable_nat_gateway = true
single_nat_gateway = true
enable_flow_logs = false
enable_https = false

# Monitoring
create_dashboard = true
create_alarms = false
