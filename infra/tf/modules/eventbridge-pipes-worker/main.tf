/**
 * EventBridge Pipes Worker Module
 *
 * This module creates an ultra-cost-optimized worker service using:
 * - EventBridge Pipes to connect SQS to ECS
 * - Fargate Spot for cost savings
 * - Zero-scale architecture (only runs when messages are present)
 */

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# ECS Task Definition for the Worker
resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.name_prefix}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  ephemeral_storage {
    size_in_gib = 21
  }
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = var.container_image
      essential = true
      cpu       = var.task_cpu
      memory    = var.task_memory

      environment = [
        { name = "EVENTBRIDGE_PIPES_MODE", value = "true" },
        { name = "BATCH_SIZE", value = tostring(var.batch_size) },
        { name = "MAX_EXECUTION_TIME_SECONDS", value = tostring(var.max_execution_time_seconds) },
        { name = "EXIT_AFTER_COMPLETION", value = "true" },
        { name = "AUTO_SHUTDOWN", value = "true" },

        # AWS configuration
        { name = "WORKFLOW_QUEUE_URL", value = var.queue_url },
        { name = "CUSTOM_AWS_REGION", value = var.aws_region },

        # Database configuration
        { name = "DB_HOST", value = var.db_host },
        { name = "DB_PORT", value = var.db_port },
        { name = "DB_NAME", value = var.db_name },
        { name = "DB_USER", value = var.db_user },
        { name = "DB_PASSWORD", value = var.db_password },
        { name = "DB_SSL_MODE", value = "require" },
        { name = "USE_DB_SECRETS", value = var.use_db_secrets ? "true" : "false" },

        # Encryption configuration for database-stored secrets
        { name = "SECRET_ENCRYPTION_KEY", value = var.secret_encryption_key },
        { name = "SECRET_ENCRYPTION_SALT", value = var.secret_encryption_salt },
        { name = "SECRET_ENCRYPTION_PASSWORD", value = var.secret_encryption_password },

        # For backward compatibility
        { name = "POSTGRES_HOST", value = var.db_host },
        { name = "POSTGRES_USER", value = var.db_user },
        { name = "POSTGRES_PASSWORD", value = var.db_password },

        # Browser configuration
        { name = "PLAYWRIGHT_HEADLESS", value = var.headless_mode ? "True" : "False" },

        # Logging configuration
        { name = "LOG_LEVEL", value = "INFO" },
        { name = "ENVIRONMENT", value = var.name_prefix },
      ]

      secrets = var.task_secrets

      # Enable container insights for better monitoring
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.worker.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }

      # Ensure the container has enough time to process messages
      stopTimeout = 120

      # Add health check to ensure the container is running properly
      healthCheck = {
        command     = ["CMD-SHELL", "ps aux | grep -v grep | grep python || exit 1"]
        interval    = 60
        timeout     = 10
        retries     = 5
        startPeriod = 30
      }
    }
  ])

  tags = var.tags
}

# Create a Fargate service to run the task
resource "aws_ecs_service" "worker" {
  name            = "${var.name_prefix}-worker-service"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 0

  # Use Fargate Spot for cost savings
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    base              = 0
    weight            = 100
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = var.assign_public_ip
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes        = [desired_count]
    create_before_destroy = true
  }

  # Force recreation when task definition changes
  depends_on = [
    aws_ecs_task_definition.worker
  ]

  tags = var.tags
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${var.name_prefix}-worker-pipes"
  retention_in_days = 7
  tags              = var.tags
}

# CloudWatch Log Group for Pipe
resource "aws_cloudwatch_log_group" "pipe_logs" {
  name              = "/aws/pipes/${var.name_prefix}-worker-pipe"
  retention_in_days = 7
  tags              = var.tags
}

# We'll use a data source to reference the existing cluster
data "aws_ecs_cluster" "worker_cluster" {
  cluster_name = var.cluster_id
}

# EventBridge Pipe
resource "aws_pipes_pipe" "worker_pipe" {
  name          = "${var.name_prefix}-worker-pipe"
  role_arn      = aws_iam_role.pipe_role.arn
  source        = var.queue_arn
  target        = data.aws_ecs_cluster.worker_cluster.arn
  desired_state = "RUNNING"

  source_parameters {
    sqs_queue_parameters {
      batch_size                         = var.batch_size
      maximum_batching_window_in_seconds = var.maximum_batching_window_in_seconds
    }
  }

  target_parameters {
    ecs_task_parameters {
      capacity_provider_strategy {
        capacity_provider = "FARGATE_SPOT"
        base              = 0
        weight            = 100
      }
      task_definition_arn = aws_ecs_task_definition.worker.arn
      task_count          = 1

      overrides {
        container_override {
          name = "worker"
          # Explicitly set container CPU and memory to match task definition
          cpu    = var.task_cpu
          memory = var.task_memory
          # Use <$.body> for direct access to the message body
          # EventBridge Pipes delivers SQS messages as arrays even with batch_size=1
          environment {
            name  = "SQS_BODY"
            value = "$.body"
          }
          environment {
            name  = "DEBUG_MODE"
            value = "true"
          }
          environment {
            name  = "LOG_LEVEL"
            value = "DEBUG"
          }
        }
      }

      network_configuration {
        aws_vpc_configuration {
          subnets          = var.subnet_ids
          security_groups  = var.security_group_ids
          assign_public_ip = var.assign_public_ip ? "ENABLED" : "DISABLED"
        }
      }
    }
  }

  # Add logging configuration for better debugging
  log_configuration {
    level                  = "INFO"
    include_execution_data = ["ALL"]

    # Add CloudWatch Logs as a log destination
    cloudwatch_logs_log_destination {
      log_group_arn = aws_cloudwatch_log_group.pipe_logs.arn
    }
  }

  depends_on = [
    aws_ecs_task_definition.worker
  ]

  tags = var.tags
}

# IAM Role for Task Execution
resource "aws_iam_role" "task_execution_role" {
  name = "${var.name_prefix}-worker-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Role for Task
resource "aws_iam_role" "task_role" {
  name = "${var.name_prefix}-worker-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Role for EventBridge Pipe
resource "aws_iam_role" "pipe_role" {
  name = "${var.name_prefix}-worker-pipe-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "pipes.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach policies to roles
resource "aws_iam_role_policy_attachment" "task_execution_role_policy" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Add additional permissions for ECR and Secrets Manager
resource "aws_iam_role_policy" "task_execution_role_ecr_policy" {
  name = "${var.name_prefix}-worker-execution-ecr-policy"
  role = aws_iam_role.task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = length(var.secrets_arns) > 0 ? var.secrets_arns : ["*"]
      }
    ]
  })
}

resource "aws_iam_role_policy" "task_role_policy" {
  name = "${var.name_prefix}-worker-task-policy"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ],
        Resource = var.queue_arn
      },
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = length(var.secrets_arns) > 0 ? var.secrets_arns : ["*"]
      }
    ]
  })
}

resource "aws_iam_role_policy" "pipe_role_policy" {
  name = "${var.name_prefix}-worker-pipe-policy"
  role = aws_iam_role.pipe_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ChangeMessageVisibility",
          "sqs:ChangeMessageVisibilityBatch"
        ],
        Resource = var.queue_arn
      },
      {
        Effect = "Allow",
        Action = [
          "ecs:RunTask",
          "ecs:StartTask",
          "ecs:StopTask",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:DescribeClusters",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:UpdateService",
          "ecs:ListServices",
          "ecs:DescribeServices"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "iam:PassRole"
        ],
        Resource = [
          aws_iam_role.task_execution_role.arn,
          aws_iam_role.task_role.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "ecs:TagResource",
          "ecs:CreateService",
          "ecs:UpdateService"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ],
        Resource = [
          aws_cloudwatch_log_group.pipe_logs.arn,
          "${aws_cloudwatch_log_group.pipe_logs.arn}:*",
          aws_cloudwatch_log_group.worker.arn,
          "${aws_cloudwatch_log_group.worker.arn}:*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "pipes:*"
        ],
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Alarm for DLQ
resource "aws_cloudwatch_metric_alarm" "dlq_not_empty" {
  count               = var.create_dlq_alarm ? 1 : 0
  alarm_name          = "${var.name_prefix}-worker-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "This alarm monitors for messages in the worker DLQ"
  alarm_actions       = var.alarm_actions
  dimensions = {
    QueueName = var.dlq_name
  }
  tags = var.tags
}
