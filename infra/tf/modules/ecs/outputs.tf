output "service_name" {
  value       = module.service.name
  description = "Name of the ECS service"
}

output "service_autoscaling_resource_id" {
  value       = "service/${var.cluster_arn}/${module.service.name}"
  description = "Resource ID for autoscaling"
}

output "task_definition_arn" {
  value       = module.service.task_definition_arn
  description = "ARN of the task definition"
}

output "lb_target_group_arn" {
  value       = var.create_load_balancer ? aws_lb_target_group.tg[0].arn : null
  description = "ARN of the load balancer target group"
}

output "autoscaling_enabled" {
  value       = var.autoscaling_enabled
  description = "Whether autoscaling is enabled for the service"
}

output "autoscaling_target_arn" {
  value       = var.autoscaling_enabled ? aws_appautoscaling_target.ecs_target[0].arn : null
  description = "ARN of the autoscaling target"
}

output "task_role_name" {
  value       = aws_iam_role.task_role.name
  description = "Name of the task role"
}

output "task_execution_role_name" {
  value       = aws_iam_role.task_execution_role.name
  description = "Name of the task execution role"
}
