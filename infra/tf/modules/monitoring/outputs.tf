output "dashboard_name" {
  value       = var.create_dashboard ? aws_cloudwatch_dashboard.main[0].dashboard_name : null
  description = "Name of the CloudWatch dashboard"
}

output "api_cpu_alarm_arn" {
  value       = var.create_alarms ? aws_cloudwatch_metric_alarm.api_cpu_high[0].arn : null
  description = "ARN of the API CPU alarm"
}

output "worker_cpu_alarm_arn" {
  value       = var.create_alarms ? aws_cloudwatch_metric_alarm.worker_cpu_high[0].arn : null
  description = "ARN of the Worker CPU alarm"
}

output "db_cpu_alarm_arn" {
  value       = var.create_alarms ? aws_cloudwatch_metric_alarm.db_cpu_high[0].arn : null
  description = "ARN of the DB CPU alarm"
}

output "dlq_alarm_arn" {
  value       = var.create_alarms ? aws_cloudwatch_metric_alarm.dlq_messages[0].arn : null
  description = "ARN of the DLQ alarm"
}
