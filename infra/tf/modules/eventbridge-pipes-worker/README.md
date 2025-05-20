# EventBridge Pipes Worker Module

This module creates an ultra-cost-optimized worker service using:
- EventBridge Pipes to connect SQS to ECS
- Fargate Spot for cost savings
- Zero-scale architecture (only runs when messages are present)

## Architecture

```
┌─────────┐    ┌───────────────┐    ┌────────────────┐
│   SQS   │───►│ EventBridge   │───►│ ECS Fargate    │
│  Queue  │    │ Pipes         │    │ Spot Task      │
└─────────┘    └───────────────┘    └────────────────┘
```

## Cost Optimization

This architecture provides significant cost savings compared to a traditional always-on worker:

1. **Zero-Scale Architecture**: Tasks only run when messages are in the queue
2. **Fargate Spot**: Uses spot pricing for up to 70% cost reduction
3. **Minimal Resources**: Configured with minimal CPU/memory (0.25 vCPU, 0.5GB RAM)
4. **Efficient Processing**: Batch processing of messages reduces startup overhead

## Usage

```hcl
module "ultra_cost_worker" {
  source = "./modules/eventbridge-pipes-worker"

  name_prefix = "my-app"
  aws_region  = "us-east-1"
  
  # Container image from ECR
  container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/worker:latest"
  
  # SQS queue configuration
  queue_url = "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue"
  queue_arn = "arn:aws:sqs:us-east-1:123456789012:my-queue"
  dlq_name  = "my-app-dlq"
  
  # Network configuration
  subnet_ids         = ["subnet-12345678", "subnet-87654321"]
  security_group_ids = ["sg-12345678"]
  
  # Task configuration
  task_cpu    = 256  # 0.25 vCPU
  task_memory = 512  # 0.5 GB
  
  # Alarm configuration
  create_dlq_alarm = true
  alarm_actions    = ["arn:aws:sns:us-east-1:123456789012:my-topic"]
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0.0 |
| aws | >= 4.0.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| name_prefix | Prefix to use for resource names | `string` | n/a | yes |
| aws_region | AWS region | `string` | n/a | yes |
| container_image | Docker image to use for the worker container | `string` | n/a | yes |
| queue_url | URL of the SQS queue | `string` | n/a | yes |
| queue_arn | ARN of the SQS queue | `string` | n/a | yes |
| dlq_name | Name of the Dead Letter Queue | `string` | n/a | yes |
| subnet_ids | List of subnet IDs to launch the task in | `list(string)` | n/a | yes |
| security_group_ids | List of security group IDs to associate with the task | `list(string)` | n/a | yes |
| task_cpu | CPU units for the task (1024 = 1 vCPU) | `number` | `256` | no |
| task_memory | Memory for the task in MB | `number` | `512` | no |
| batch_size | Maximum number of messages to process in a batch | `number` | `10` | no |
| maximum_batching_window_in_seconds | Maximum time to wait for a batch to fill up | `number` | `30` | no |
| max_execution_time_seconds | Maximum execution time for the worker task in seconds | `number` | `240` | no |
| headless_mode | Whether to run the browser in headless mode | `bool` | `true` | no |
| task_secrets | List of secrets to pass to the task | `list(object)` | `[]` | no |
| secrets_arns | List of ARNs of secrets that the task can access | `list(string)` | `["*"]` | no |
| create_dlq_alarm | Whether to create a CloudWatch alarm for the DLQ | `bool` | `true` | no |
| alarm_actions | List of ARNs to notify when the DLQ alarm fires | `list(string)` | `[]` | no |
| tags | Tags to apply to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| task_definition_arn | ARN of the task definition |
| task_role_arn | ARN of the task role |
| task_execution_role_arn | ARN of the task execution role |
| pipe_arn | ARN of the EventBridge Pipe |
| log_group_name | Name of the CloudWatch log group |
