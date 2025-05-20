# EventBridge Pipes Worker Architecture

This document explains how the EventBridge Pipes worker module provides an ultra-cost-optimized infrastructure for processing messages from SQS queues.

## Overview

The EventBridge Pipes worker module creates a true zero-scale architecture that only runs tasks when there are messages to process. It uses AWS EventBridge Pipes to connect an SQS queue to ECS Fargate Spot tasks, eliminating the need for always-on worker services and reducing costs significantly.

## Architecture

```
┌─────────┐    ┌───────────────┐    ┌────────────────┐
│   SQS   │───►│ EventBridge   │───►│ ECS Fargate    │
│  Queue  │    │ Pipes         │    │ Spot Task      │
└─────────┘    └───────────────┘    └────────────────┘
```

## How It Works

1. **Message Arrival**: When a message arrives in the SQS queue, EventBridge Pipes detects it.

2. **Task Launch**: EventBridge Pipes automatically launches an ECS Fargate Spot task to process the message.

3. **Message Processing**: The task processes the message and then terminates.

4. **Zero-Scale**: When there are no messages in the queue, no tasks are running, resulting in zero compute costs.

## Key Components

### 1. EventBridge Pipe

The EventBridge Pipe connects the SQS queue to the ECS task:

```hcl
resource "aws_pipes_pipe" "worker_pipe" {
  name          = "${var.name_prefix}-worker-pipe"
  role_arn      = aws_iam_role.pipe_role.arn
  source        = var.queue_arn
  target        = data.aws_ecs_cluster.worker_cluster.arn
  desired_state = "RUNNING"

  source_parameters {
    sqs_queue_parameters {
      batch_size                         = var.batch_size
      maximum_batching_window_in_seconds = var.maximum_batching_window_in_seconds
    }
  }

  target_parameters {
    ecs_task_parameters {
      capacity_provider_strategy {
        capacity_provider = "FARGATE_SPOT"
        base              = 0
        weight            = 100
      }
      task_definition_arn = aws_ecs_task_definition.worker.arn
      task_count          = 1

      overrides {
        container_override {
          name = "worker"
          environment {
            name  = "SQS_BODY"
            value = "$.body"
          }
          # Other environment variables...
        }
      }
    }
  }
}
```

### 2. ECS Task Definition

The ECS task definition specifies the container configuration:

```hcl
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.name_prefix}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  ephemeral_storage {
    size_in_gib = 21
  }
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = var.container_image
      essential = true
      # Container configuration...
    }
  ])
}
```

### 3. IAM Roles

The module creates several IAM roles:

- **Pipe Role**: Allows EventBridge Pipes to read from SQS and launch ECS tasks
- **Task Execution Role**: Allows ECS to pull container images and write logs
- **Task Role**: Allows the container to access AWS services

## Message Handling

EventBridge Pipes delivers SQS messages to the ECS task through environment variables:

```
SQS_BODY = "$.body"
```

The worker container can access the message body through this environment variable. Note that EventBridge Pipes delivers SQS messages as arrays even with batch_size=1, requiring the JSONPath `$.body` to access the message body.

## Cost Optimization Features

1. **Zero-Scale Architecture**: Tasks only run when messages are in the queue, resulting in zero compute costs during idle periods.

2. **Fargate Spot**: Uses spot pricing for up to 70% cost reduction compared to regular Fargate.

3. **Minimal Resources**: Configured with minimal CPU/memory resources (e.g., 0.25 vCPU, 0.5GB RAM).

4. **Efficient Processing**: Batch processing of messages reduces startup overhead.

5. **No CloudWatch Alarms**: Eliminates the need for CloudWatch alarms and autoscaling policies, reducing complexity and costs.

## Usage Example

```hcl
module "worker_pipes" {
  source = "../modules/eventbridge-pipes-worker"

  name_prefix = "flow-builder-dev"
  aws_region  = "us-east-1"

  # Container image from ECR
  container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/worker:latest"

  # SQS queue configuration
  queue_url = module.workflow_queue.queue_url
  queue_arn = module.workflow_queue.queue_arn
  dlq_name  = "flow-builder-dev-workflow-requests-dlq"

  # Network configuration
  subnet_ids         = ["subnet-12345678", "subnet-87654321"]
  security_group_ids = ["sg-12345678"]
  cluster_id         = aws_ecs_cluster.worker.id
  assign_public_ip   = true

  # Task configuration
  task_cpu    = 1024  # 1 vCPU
  task_memory = 2048  # 2 GB
  batch_size  = 1

  # Environment variables
  environment_variables = {
    DB_HOST     = "your-database-host.com"
    DB_PORT     = "5432"
    DB_NAME     = "flowbuilder"
    DB_USERNAME = "root"
    DB_PASSWORD = "your-password"
    HEADLESS    = "true"
  }
}
```

## Comparison with SQS-Based Autoscaling

| Feature | EventBridge Pipes | SQS-Based Autoscaling |
|---------|-------------------|------------------------|
| Scaling Mechanism | Direct task launch | CloudWatch alarms + Autoscaling policies |
| Scaling Latency | Low (seconds) | Higher (minutes) |
| Complexity | Simple | More complex |
| Cost | Lower | Higher |
| Infrastructure | Minimal | More resources |
| Best For | Development, low-volume workloads | Production, high-volume workloads |

## Conclusion

The EventBridge Pipes worker module provides an ultra-cost-optimized infrastructure for processing messages from SQS queues. By using a true zero-scale architecture with Fargate Spot, it minimizes costs while ensuring that messages are processed promptly when they arrive.

This approach is ideal for development environments or low-volume workloads where cost optimization is the primary concern. For production environments with higher volumes or stricter reliability requirements, the standard infrastructure with SQS-based autoscaling may be more appropriate.
