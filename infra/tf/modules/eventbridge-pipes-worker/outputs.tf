output "task_definition_arn" {
  value       = aws_ecs_task_definition.worker.arn
  description = "ARN of the task definition"
}

output "task_role_arn" {
  value       = aws_iam_role.task_role.arn
  description = "ARN of the task role"
}

output "task_execution_role_arn" {
  value       = aws_iam_role.task_execution_role.arn
  description = "ARN of the task execution role"
}

output "pipe_arn" {
  value       = aws_pipes_pipe.worker_pipe.arn
  description = "ARN of the EventBridge Pipe"
}

output "log_group_name" {
  value       = aws_cloudwatch_log_group.worker.name
  description = "Name of the CloudWatch log group"
}