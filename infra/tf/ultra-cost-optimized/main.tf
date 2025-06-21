/**
 * # Ultra Cost-Optimized Worker Infrastructure
 *
 * This is an isolated Terraform configuration for an ultra-cost-optimized worker service using:
 * - EventBridge Pipes to connect SQS to ECS
 * - Fargate Spot for cost savings
 * - Zero-scale architecture (only runs when messages are present)
 * - Lambda scheduler for triggering workflows on a schedule
 */

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.env
      Project     = "flow-builder"
      ManagedBy   = "terraform"
      Component   = "ultra-cost-worker"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.env}"
  tags = {
    Environment = var.env
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Find the VPC by tag
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_tag_name]
  }
}

# No VPC endpoints needed - the existing VPC has internet access via IGW

# Find public subnets by tag
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  filter {
    name   = "tag:Name"
    values = var.public_subnet_tag_pattern
  }
}

# Create security group for worker tasks
resource "aws_security_group" "worker" {
  name        = "${local.name_prefix}-worker-sg"
  description = "Security group for worker tasks"
  vpc_id      = data.aws_vpc.main.id

  # Allow all outbound traffic for internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic for internet access"
  }

  # Explicitly allow PostgreSQL outbound traffic to external database
  egress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow PostgreSQL outbound traffic to external database"
  }

  # Explicitly allow HTTPS outbound traffic for ECR and other AWS services
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound traffic for ECR and other AWS services"
  }

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-worker-sg"
  })
}

# Create SQS queue and DLQ
module "workflow_queue" {
  source                     = "../modules/sqs"
  name                       = "${local.name_prefix}-workflow-requests"
  max_receive_count          = 5
  visibility_timeout_seconds = 300
  tags                       = local.tags
}

# Create ECR repository for the worker
resource "aws_ecr_repository" "worker" {
  name                 = "${local.name_prefix}-worker"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

# Create ECS cluster
resource "aws_ecs_cluster" "worker" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.tags
}

# Add capacity providers to the ECS cluster
resource "aws_ecs_cluster_capacity_providers" "worker" {
  cluster_name = aws_ecs_cluster.worker.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
    base              = 0
  }
}

# Create CloudWatch log group
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${local.name_prefix}-worker"
  retention_in_days = 7
  tags              = local.tags
}

# Create SNS topic for alarms
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
  tags = local.tags
}

# Create EventBridge Pipes worker
module "worker_pipes" {
  source = "../modules/eventbridge-pipes-worker"

  name_prefix = local.name_prefix
  aws_region  = var.aws_region

  # Container image from ECR
  container_image = "${aws_ecr_repository.worker.repository_url}:latest"

  # SQS queue configuration
  queue_url = module.workflow_queue.queue_url
  queue_arn = module.workflow_queue.queue_arn
  dlq_name  = "${local.name_prefix}-workflow-requests-dlq"

  # Network configuration - using public subnets from data source
  subnet_ids         = data.aws_subnets.public.ids
  security_group_ids = [aws_security_group.worker.id]
  cluster_id         = aws_ecs_cluster.worker.id
  assign_public_ip   = var.assign_public_ip

  # Task configuration
  task_cpu                           = var.task_cpu
  task_memory                        = var.task_memory
  batch_size                         = var.batch_size
  maximum_batching_window_in_seconds = var.max_execution_time_seconds
  max_execution_time_seconds         = var.max_execution_time_seconds
  headless_mode                      = var.headless_mode

  # Database configuration
  db_host        = var.db_host
  db_port        = var.db_port
  db_name        = var.db_name
  db_user        = var.db_username
  db_password    = var.db_password
  use_db_secrets = var.use_db_secrets

  # Encryption configuration for database-stored secrets
  secret_encryption_key      = var.secret_encryption_key
  secret_encryption_salt     = var.secret_encryption_salt
  secret_encryption_password = var.secret_encryption_password

  # Empty task secrets and secrets ARNs
  task_secrets = []
  secrets_arns = []

  # Alarm configuration
  create_dlq_alarm = true
  alarm_actions    = [aws_sns_topic.alerts.arn]

  tags = local.tags
}

# Lambda Scheduler

# Create ECR repository for the scheduler Lambda
resource "aws_ecr_repository" "scheduler" {
  name                 = "${local.name_prefix}-scheduler"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

# Create Lambda scheduler
module "scheduler_lambda" {
  source          = "../modules/lambda"
  function_name   = "${local.name_prefix}-scheduler"
  package_type    = "Image"
  image_uri       = "${aws_ecr_repository.scheduler.repository_url}:latest"
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout
  create_function = var.create_lambda
  sqs_queue_arn   = module.workflow_queue.queue_arn
  # Remove VPC configuration to allow direct internet access

  # Enable CloudWatch Logs
  enable_cloudwatch_logs = true

  # Environment variables
  env_vars = {
    # SQS configuration
    SQS_URL = module.workflow_queue.queue_url

    # Database configuration
    DB_HOST     = var.db_host
    DB_PORT     = var.db_port
    DB_NAME     = var.db_name
    DB_USER     = var.db_username
    DB_PASSWORD = var.db_password
    # Enable SSL for Supabase database
    DB_USE_SSL  = true
    DB_SSL_MODE = "allow"
    DB_POOL_MODE = "session"

    CUSTOM_AWS_REGION = var.aws_region
    USE_DB_SECRETS = var.use_db_secrets ? "true" : "false"
  }

  tags = local.tags
}

# Create EventBridge rule to trigger Lambda on a schedule
resource "aws_cloudwatch_event_rule" "scheduler" {
  count               = var.create_lambda ? 1 : 0
  name                = "${local.name_prefix}-scheduler-rule"
  description         = "Trigger the scheduler Lambda function"
  schedule_expression = var.schedule_expression

  tags = local.tags
}

# Create EventBridge target for Lambda
resource "aws_cloudwatch_event_target" "scheduler" {
  count     = var.create_lambda ? 1 : 0
  rule      = aws_cloudwatch_event_rule.scheduler[0].name
  target_id = "lambda"
  arn       = module.scheduler_lambda.lambda_arn
}

# Create Lambda permission for EventBridge
resource "aws_lambda_permission" "scheduler" {
  count         = var.create_lambda ? 1 : 0
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.scheduler_lambda.lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scheduler[0].arn
}