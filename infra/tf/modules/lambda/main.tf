resource "aws_iam_role" "lambda_role" {
  name = "${var.function_name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  tags = var.tags
}

# Add inline policy for SQS permissions
resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "${var.function_name}-sqs-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ],
        Resource = var.sqs_queue_arn != null ? var.sqs_queue_arn : "*"
      }
    ]
  })
}

# Add CloudWatch Logs permissions if enabled
resource "aws_iam_role_policy" "lambda_logs_policy" {
  count = var.enable_cloudwatch_logs ? 1 : 0
  name  = "${var.function_name}-logs-policy"
  role  = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "basic_exec" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  filename      = var.filename
  handler       = var.handler
  role          = aws_iam_role.lambda_role.arn
  runtime       = var.runtime
  memory_size   = var.memory_size
  timeout       = var.timeout
  source_code_hash = filebase64sha256(var.filename)

  dynamic "vpc_config" {
    for_each = var.subnet_ids != null && var.security_group_ids != null ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
  }

  environment {
    variables = var.env_vars
  }

  tags = var.tags
}

output "lambda_arn"  { value = aws_lambda_function.this.arn }
output "lambda_name" { value = aws_lambda_function.this.function_name }