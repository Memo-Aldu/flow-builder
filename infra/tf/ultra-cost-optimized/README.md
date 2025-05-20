# Ultra Cost-Optimized Worker Infrastructure

This is an isolated Terraform configuration for an ultra-cost-optimized worker service using:
- EventBridge Pipes to connect SQS to ECS
- Fargate Spot for cost savings
- Zero-scale architecture (only runs when messages are present)
- Tag-based VPC and subnet discovery for easier management
- Lambda scheduler for triggering workflows on a schedule

## Architecture

```
                                                  ┌────────────────┐
                                                  │ Lambda         │
                                                  │ Scheduler      │
                                                  └───────┬────────┘
                                                          │
                                                          ▼
┌─────────┐    ┌───────────────┐    ┌────────────────┐   ┌─────────┐
│   SQS   │───►│ EventBridge   │───►│ ECS Fargate    │◄──┤ Existing│
│  Queue  │    │ Pipes         │    │ Spot Task      │   │ VPC     │
└─────────┘    └───────────────┘    └────────────────┘   └─────────┘
```

## Cost Optimization Features

1. **Zero-Scale Architecture**: Tasks only run when messages are in the queue
2. **Fargate Spot**: Uses spot pricing for up to 70% cost reduction
3. **Minimal Resources**: Configured with minimal CPU/memory
4. **Efficient Processing**: Batch processing of messages reduces startup overhead
5. **Lambda Scheduler**: Serverless scheduling with minimal cost
6. **Reuse Existing VPC**: Uses your existing VPC with tag-based discovery

## Prerequisites

- AWS account with appropriate permissions
- Terraform 1.0.0 or later installed locally
- Existing VPC with public subnets that have internet access and appropriate Name tags
- External PostgreSQL database (e.g., Render.com)

## Setup Instructions

1. Edit `terraform.tfvars` with your specific configuration:

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

2. Initialize Terraform:

```bash
terraform init
```

3. Plan the deployment:

```bash
terraform plan -var="db_password=your-secure-password" -out=plan.out
```

4. Apply the configuration:

```bash
terraform apply plan.out
```

## VPC and Subnet Tag Requirements

For the tag-based discovery to work, your AWS resources must have the following tags:

1. **VPC**: Must have a `Name` tag matching the value of `vpc_tag_name` (default: `main-vpc`)
2. **Public Subnets**: Must have `Name` tags matching the pattern in `public_subnet_tag_pattern` (default: `main-subnet-public*`)

You can use wildcards (`*`) in the subnet tag pattern to match multiple subnets.

## Integration with Existing Application

To use this infrastructure with your existing application:

1. Configure your API service to send messages to the SQS queue created by this configuration:
   - Use the `workflow_queue_url` output from Terraform
   - Update your API's IAM permissions to allow sending messages to this queue

2. Build and push your Docker images to the ECR repositories:

```bash
# Build and push the worker Docker image
cd worker
./deploy-worker.sh

# Build and push the scheduler Docker image
cd ../scheduler_lambda
./build_and_push.sh
```

## Worker Configuration

The worker service is configured to:

1. Run in EventBridge Pipes mode
2. Process one message at a time
3. Exit after completion to save resources
4. Connect to your external database
5. Run browser automation in headless mode

## Scheduler Configuration

The Lambda scheduler is configured to:

1. Run on a schedule (default: every 5 minutes)
2. Query the database for due workflows
3. Send execution requests to the SQS queue
4. Connect to your external database

## Troubleshooting

### VPC and Subnet Discovery Issues

If Terraform can't find your VPC or subnets, check:

1. The VPC has a `Name` tag matching your `vpc_tag_name` value
2. The subnets have `Name` tags matching your `public_subnet_tag_pattern`
3. Your AWS credentials have permission to describe VPCs and subnets

To list the tags on your VPC and subnets:

```bash
# List VPCs and their tags
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,Tags]' --output json

# List subnets and their tags
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,Tags]' --output json
```

## Monitoring

- CloudWatch Logs:
  - Check the worker logs in the `/ecs/flow-builder-dev-worker` log group
  - Check the Lambda logs in the `/aws/lambda/flow-builder-dev-scheduler` log group
- CloudWatch Alarms: An alarm is set up to notify you if messages appear in the DLQ
- SNS Topic: Notifications are sent to the created SNS topic

## Cleanup

To destroy all resources created by this configuration:

```bash
terraform destroy -var="db_password=your-secure-password"
```
