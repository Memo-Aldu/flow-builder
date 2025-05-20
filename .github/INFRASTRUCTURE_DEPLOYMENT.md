# Infrastructure Deployment Guide

This document provides instructions for deploying the Flow Builder infrastructure using GitHub Actions.

## Infrastructure Types

The Flow Builder application supports two types of infrastructure:

1. **Standard Infrastructure** (`standard`): The full infrastructure with all components.
2. **Ultra-Cost-Optimized Infrastructure** (`ultra-cost-optimized`): A cost-optimized version of the infrastructure designed for development environments.

## Deploying Infrastructure

### Using GitHub Actions

1. Go to the Actions tab in your GitHub repository
2. Select the "Deploy Infrastructure" workflow
3. Click "Run workflow"
4. Configure the workflow:
   - **Environment**: Select the environment to deploy to (dev, staging, or prod)
   - **Infrastructure Type**: Select the type of infrastructure to deploy (standard or ultra-cost-optimized)
5. Click "Run workflow"
6. Approve the deployment when prompted

### Required Secrets

The following secrets need to be configured in your GitHub repository:

- **AWS_ROLE_TO_ASSUME**: ARN of the IAM role to assume for AWS operations
- **AWS_REGION**: AWS region where resources are deployed
- **DB_PASSWORD**: Database password for Terraform
- **SECRET_ENCRYPTION_PASSWORD**: Password used for encrypting secrets
- **SECRET_ENCRYPTION_SALT**: Salt used for encrypting secrets
- **ENVIRONMENT**: Default environment (dev, staging, or prod)

## Ultra-Cost-Optimized Infrastructure

The ultra-cost-optimized infrastructure is designed for development environments and includes:

1. **Zero-Scale Architecture**: Tasks only run when messages are in the queue
2. **Fargate Spot**: Uses spot pricing for up to 70% cost reduction
3. **Minimal Resources**: Configured with minimal CPU/memory
4. **Efficient Processing**: Batch processing of messages reduces startup overhead
5. **Lambda Scheduler**: Serverless scheduling with minimal cost
6. **Reuse Existing VPC**: Uses your existing VPC with tag-based discovery

### Configuration

The ultra-cost-optimized infrastructure is configured in the `infra/tf/ultra-cost-optimized` directory. It uses the following configuration:

```hcl
# AWS and environment configuration
aws_region   = "us-east-1"
env          = "dev"
project_name = "flow-builder"

# VPC Configuration - using tag-based discovery
vpc_tag_name = "main-vpc"
public_subnet_tag_pattern = ["main-subnet-public*"]
assign_public_ip = true

# Database Configuration
db_host     = "your-database-host.com"
db_port     = "5432"
db_name     = "flowbuilder"
db_username = "root"
db_password = "your-password"  # Set this via environment variable TF_VAR_db_password

# Task Configuration
task_cpu                   = 1024  # 1 vCPU
task_memory                = 2048  # 2 GB
batch_size                 = 1
max_execution_time_seconds = 240
headless_mode              = true

# Lambda Configuration
lambda_memory_size  = 256
lambda_timeout      = 60
create_lambda       = true
schedule_expression = "rate(5 minutes)"
```

## Standard Infrastructure

The standard infrastructure is configured in the `infra/tf` directory and includes:

1. **Networking**: VPC with public, private, and database subnets
2. **Database**: RDS PostgreSQL with environment-specific configurations
3. **Secrets Management**: AWS Secrets Manager for database credentials
4. **Container Registry**: ECR repositories for container images
5. **Messaging**: SQS queues with dead-letter queues
6. **Compute**: ECS Fargate services with autoscaling
7. **Serverless**: Lambda functions for scheduling
8. **Monitoring**: CloudWatch dashboards and alarms