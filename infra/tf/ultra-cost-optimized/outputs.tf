# SQS Queue
output "workflow_queue_url" {
  value       = module.workflow_queue.queue_url
  description = "URL of the SQS queue for workflow requests"
}

# ECR Repositories
output "ecr_worker_repository_url" {
  value       = aws_ecr_repository.worker.repository_url
  description = "URL of the ECR repository for the worker image"
}

output "ecr_scheduler_repository_url" {
  value       = aws_ecr_repository.scheduler.repository_url
  description = "URL of the ECR repository for the scheduler image"
}

# ECS Resources
output "ecs_cluster_name" {
  value       = aws_ecs_cluster.worker.name
  description = "Name of the ECS cluster"
}

# Lambda Resources
output "lambda_function_name" {
  value       = module.scheduler_lambda.lambda_name
  description = "Name of the Lambda scheduler function"
}
