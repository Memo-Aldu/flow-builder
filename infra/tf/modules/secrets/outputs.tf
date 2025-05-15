output "secret_arn" {
  value       = aws_secretsmanager_secret.database_credentials.arn
  description = "ARN of the database credentials secret"
}

output "secret_name" {
  value       = aws_secretsmanager_secret.database_credentials.name
  description = "Name of the database credentials secret"
}

output "secret_access_policy_arn" {
  value       = aws_iam_policy.secret_access.arn
  description = "ARN of the IAM policy for accessing the secret"
}
