resource "aws_secretsmanager_secret" "database_credentials" {
  name                    = "${var.name_prefix}/database-credentials"
  description             = "Database credentials for the application"
  recovery_window_in_days = var.recovery_window_in_days
  tags                    = var.tags
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = var.db_host
    port     = var.db_port
    database = var.db_name
  })
}

# IAM policy document for accessing the secret
data "aws_iam_policy_document" "secret_access" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [
      aws_secretsmanager_secret.database_credentials.arn
    ]
  }
}

# IAM policy for accessing the secret
resource "aws_iam_policy" "secret_access" {
  name        = "${var.name_prefix}-secret-access-policy"
  description = "Policy for accessing database credentials secret"
  policy      = data.aws_iam_policy_document.secret_access.json
}
