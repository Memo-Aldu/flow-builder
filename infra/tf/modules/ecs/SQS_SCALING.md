# SQS-Based Autoscaling for ECS Services

This document explains how the SQS-based autoscaling functionality works in the ECS module, allowing services to scale based on SQS queue depth.

## Overview

SQS-based autoscaling enables ECS services to automatically scale up when there are messages in an SQS queue and scale down when the queue is empty. This is particularly useful for worker services that process messages from a queue, as it allows the service to scale to zero when there's no work to do, reducing costs.

## Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│             │     │                     │     │                     │
│  SQS Queue  │────►│ CloudWatch Alarm    │────►│ Step Scaling Policy │
│             │     │ (queue-not-empty)   │     │ (scale-up)          │
│             │     │                     │     │                     │
└─────────────┘     └─────────────────────┘     └─────────────────────┘
      │                                                    │
      │                                                    │
      │                                                    ▼
      │                                           ┌─────────────────────┐
      │                                           │                     │
      │                                           │  ECS Service        │
      │                                           │  (desired count)    │
      │                                           │                     │
      │                                           └─────────────────────┘
      │                                                    ▲
      │                                                    │
      ▼                                                    │
┌─────────────────────┐     ┌─────────────────────┐        │
│                     │     │                     │        │
│ CloudWatch Alarm    │────►│ Step Scaling Policy │────────┘
│ (queue-empty)       │     │ (scale-down)        │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

## How It Works

1. **Monitoring Queue Depth**: CloudWatch alarms monitor the `ApproximateNumberOfMessagesVisible` metric in the SQS queue.

2. **Scaling Up**:
   - When the number of visible messages is ≥ 1, the "queue-not-empty" alarm triggers.
   - This alarm invokes the scale-up policy, which sets the desired task count to 1.
   - The ECS service starts a new task to process the messages.

3. **Scaling Down**:
   - When the queue has been empty (0 messages) for 5 consecutive evaluation periods (5 minutes), the "queue-empty" alarm triggers.
   - This alarm invokes the scale-down policy, which sets the desired task count to 0.
   - The ECS service terminates all running tasks.

4. **Cooldown Periods**:
   - Scale-up cooldown: 60 seconds (to prevent rapid scaling up)
   - Scale-down cooldown: 300 seconds (to prevent premature scaling down)

## Configuration

The SQS-based autoscaling functionality is controlled by the following variables in the ECS module:

```hcl
variable "enable_sqs_scaling" {
  type        = bool
  default     = false
  description = "Whether to enable SQS-based autoscaling"
}

variable "has_queue_configured" {
  type        = bool
  default     = false
  description = "Whether a queue is configured for this service (set to true when queue_arn is provided)"
}

variable "queue_arn" {
  type        = string
  default     = null
  description = "ARN of the SQS queue for autoscaling"
}
```

The module automatically extracts the queue name from the ARN for use in CloudWatch alarm dimensions:

```hcl
locals {
  queue_name         = var.queue_arn != null ? element(split(":", var.queue_arn), length(split(":", var.queue_arn)) - 1) : ""
  create_sqs_scaling = var.enable_sqs_scaling && var.autoscaling_enabled && var.has_queue_configured
}
```

## Usage Example

To enable SQS-based autoscaling for a worker service:

```hcl
module "worker_service" {
  source                    = "./modules/ecs"
  name                      = "worker"
  aws_region                = var.aws_region
  cluster_arn               = module.ecs_cluster.cluster_id
  container_port            = 8080
  desired_count             = 0  # Start with 0 tasks
  cpu                       = 1024
  memory                    = 2048
  image                     = "${module.ecr.repository_urls["worker"]}:latest"
  subnet_ids                = module.networking.private_subnets
  security_group_ids        = [module.networking.ecs_security_group_id]
  queue_arn                 = module.workflow_queue.queue_arn
  
  # Enable autoscaling
  autoscaling_enabled       = true
  autoscaling_min_capacity  = 0
  autoscaling_max_capacity  = 5
  
  # Enable SQS-based scaling
  enable_sqs_scaling   = true
  has_queue_configured = true
  
  # Environment variables
  env_vars = {
    SQS_URL = module.workflow_queue.queue_url
    # Other environment variables...
  }
}
```

## Benefits

1. **Cost Optimization**: Services can scale to zero when there's no work to do, eliminating idle costs.
2. **Automatic Scaling**: Services automatically scale up when there's work to do, without manual intervention.
3. **Responsive**: Quick response to queue activity ensures messages are processed promptly.
4. **Configurable**: Easily enabled or disabled through module variables.

## Comparison with EventBridge Pipes

While SQS-based autoscaling provides scale-to-zero capability, it still relies on CloudWatch alarms and autoscaling policies, which can introduce some latency in scaling. For even more cost-effective scaling, consider the EventBridge Pipes approach used in the ultra-cost-optimized infrastructure:

```
┌─────────┐    ┌───────────────┐    ┌────────────────┐
│   SQS   │───►│ EventBridge   │───►│ ECS Fargate    │
│  Queue  │    │ Pipes         │    │ Spot Task      │
└─────────┘    └───────────────┘    └────────────────┘
```

EventBridge Pipes provides a true zero-scale architecture by directly launching tasks in response to queue messages, without the need for CloudWatch alarms or autoscaling policies.

## Conclusion

SQS-based autoscaling provides an effective way to optimize costs for worker services by scaling based on queue depth. By enabling services to scale to zero when there's no work to do, it helps minimize infrastructure costs while ensuring that messages are processed promptly when they arrive.
