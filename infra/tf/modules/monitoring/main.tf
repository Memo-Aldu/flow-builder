resource "aws_cloudwatch_dashboard" "main" {
  count          = var.create_dashboard ? 1 : 0
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = concat(
      # API Service Widgets
      [
        {
          type   = "metric"
          x      = 0
          y      = 0
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/ECS", "CPUUtilization", "ServiceName", var.api_service_name, "ClusterName", var.cluster_name]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "API Service CPU"
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 0
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/ECS", "MemoryUtilization", "ServiceName", var.api_service_name, "ClusterName", var.cluster_name]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "API Service Memory"
          }
        }
      ],
      # Worker Service Widgets
      [
        {
          type   = "metric"
          x      = 0
          y      = 6
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/ECS", "CPUUtilization", "ServiceName", var.worker_service_name, "ClusterName", var.cluster_name]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "Worker Service CPU"
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 6
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/ECS", "MemoryUtilization", "ServiceName", var.worker_service_name, "ClusterName", var.cluster_name]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "Worker Service Memory"
          }
        }
      ],
      # SQS Queue Widgets
      [
        {
          type   = "metric"
          x      = 0
          y      = 12
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.queue_name]
            ]
            period = 300
            stat   = "Sum"
            region = var.aws_region
            title  = "SQS Queue Depth"
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 12
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", var.queue_name]
            ]
            period = 300
            stat   = "Maximum"
            region = var.aws_region
            title  = "SQS Message Age"
          }
        }
      ],
      # Database Widgets
      [
        {
          type   = "metric"
          x      = 0
          y      = 18
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.db_instance_id]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "RDS CPU"
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 18
          width  = 12
          height = 6
          properties = {
            metrics = [
              ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.db_instance_id]
            ]
            period = 300
            stat   = "Average"
            region = var.aws_region
            title  = "RDS Free Storage"
          }
        }
      ]
    )
  })
}

# API Service Alarms
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  count               = var.create_alarms ? 1 : 0
  alarm_name          = "${var.name_prefix}-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors API service CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.api_service_name
  }
}

# Worker Service Alarms
resource "aws_cloudwatch_metric_alarm" "worker_cpu_high" {
  count               = var.create_alarms ? 1 : 0
  alarm_name          = "${var.name_prefix}-worker-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors Worker service CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.worker_service_name
  }
}

# Database Alarms
resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  count               = var.create_alarms ? 1 : 0
  alarm_name          = "${var.name_prefix}-db-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors database CPU utilization"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }
}

# SQS DLQ Alarm
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  count               = var.create_alarms ? 1 : 0
  alarm_name          = "${var.name_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This metric monitors messages in the dead-letter queue"
  alarm_actions       = var.alarm_actions

  dimensions = {
    QueueName = "${var.queue_name}-dlq"
  }
}
