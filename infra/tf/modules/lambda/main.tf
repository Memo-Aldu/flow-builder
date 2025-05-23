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

resource "aws_iam_role_policy_attachment" "vpc_access" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_lambda_function" "this" {
  count         = var.create_function ? 1 : 0
  function_name = var.function_name
  role          = aws_iam_role.lambda_role.arn
  memory_size   = var.memory_size
  timeout       = var.timeout
  package_type  = var.package_type

  # Conditional attributes based on package type
  filename         = var.package_type == "Zip" ? var.filename : null
  source_code_hash = var.package_type == "Zip" && var.filename != null ? filebase64sha256(var.filename) : null
  handler          = var.package_type == "Zip" || var.handler != null ? var.handler : null
  runtime          = var.package_type == "Zip" ? var.runtime : null

  # Image configuration for container images
  image_uri = var.package_type == "Image" ? var.image_uri : null

  dynamic "image_config" {
    for_each = var.package_type == "Image" && var.handler != null ? [1] : []
    content {
      command = [var.handler]
    }
  }

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

output "lambda_arn" { value = var.create_function ? aws_lambda_function.this[0].arn : null }
output "lambda_name" { value = var.create_function ? aws_lambda_function.this[0].function_name : var.function_name }