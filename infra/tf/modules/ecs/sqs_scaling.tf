# SQS-based autoscaling for worker service
variable "enable_sqs_scaling" {
  type        = bool
  default     = false
  description = "Whether to enable SQS-based autoscaling"
}

# Add a variable to explicitly control whether queue-based scaling should be created
variable "has_queue_configured" {
  type        = bool
  default     = false
  description = "Whether a queue is configured for this service (set to true when queue_arn is provided)"
}

# Extract queue name from ARN for CloudWatch metric dimension
locals {
  queue_name         = var.queue_arn != null ? element(split(":", var.queue_arn), length(split(":", var.queue_arn)) - 1) : ""
  create_sqs_scaling = var.enable_sqs_scaling && var.autoscaling_enabled && var.has_queue_configured
}

# Step scaling policy to scale up when queue has messages
resource "aws_appautoscaling_policy" "scale_up_on_queue" {
  count              = local.create_sqs_scaling ? 1 : 0
  name               = "${var.name}-scale-up-on-queue"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ExactCapacity"
    cooldown                = 60
    metric_aggregation_type = "Maximum"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }

  depends_on = [aws_appautoscaling_target.ecs_target]
}

# Step scaling policy to scale down when queue is empty
resource "aws_appautoscaling_policy" "scale_down_on_queue" {
  count              = local.create_sqs_scaling ? 1 : 0
  name               = "${var.name}-scale-down-on-queue"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ExactCapacity"
    cooldown                = 300
    metric_aggregation_type = "Maximum"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = 0
    }
  }

  depends_on = [aws_appautoscaling_target.ecs_target]
}

# CloudWatch alarm that triggers when queue has messages
resource "aws_cloudwatch_metric_alarm" "queue_messages_visible" {
  count               = local.create_sqs_scaling ? 1 : 0
  alarm_name          = "${var.name}-queue-not-empty"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "This alarm triggers when there are messages in the queue"
  alarm_actions       = [aws_appautoscaling_policy.scale_up_on_queue[0].arn]
  dimensions = {
    QueueName = local.queue_name
  }

  depends_on = [aws_appautoscaling_policy.scale_up_on_queue]
}

# CloudWatch alarm that triggers when queue is empty
resource "aws_cloudwatch_metric_alarm" "queue_messages_empty" {
  count               = local.create_sqs_scaling ? 1 : 0
  alarm_name          = "${var.name}-queue-empty"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "This alarm triggers when the queue is empty"
  alarm_actions       = [aws_appautoscaling_policy.scale_down_on_queue[0].arn]
  dimensions = {
    QueueName = local.queue_name
  }

  depends_on = [aws_appautoscaling_policy.scale_down_on_queue]
}
