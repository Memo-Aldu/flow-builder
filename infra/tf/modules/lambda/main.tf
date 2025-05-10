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
        Action = "sqs:SendMessage",
        Resource = "*"
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
  memory_size   = 256
  timeout       = 60
  source_code_hash = filebase64sha256(var.filename)
  environment {
    variables = var.env_vars
  }
  tags = var.tags
}

output "lambda_arn"  { value = aws_lambda_function.this.arn }
output "lambda_name" { value = aws_lambda_function.this.function_name }