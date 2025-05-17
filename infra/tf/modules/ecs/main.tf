# Get VPC information from subnet IDs
data "aws_vpc" "selected" {
  filter {
    name   = "vpc-id"
    values = [data.aws_subnet.first_subnet.vpc_id]
  }
}

data "aws_subnet" "first_subnet" {
  id = var.subnet_ids[0]
}

# Create CloudWatch log group with retention
resource "aws_cloudwatch_log_group" "service" {
  name              = "/ecs/${var.name}"
  retention_in_days = 30
  tags              = var.tags
}

# Create IAM role for task execution
resource "aws_iam_role" "task_execution_role" {
  name = "${var.name}-task-execution-role"

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

# Create IAM role for the task itself (for application code)
resource "aws_iam_role" "task_role" {
  name = "${var.name}-task-role"

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

# Attach policies to the task execution role
resource "aws_iam_role_policy_attachment" "task_execution_role_policy" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Add ECR permissions
resource "aws_iam_role_policy" "ecr_policy" {
  name = "${var.name}-ecr-policy"
  role = aws_iam_role.task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetAuthorizationToken"
        ],
        Resource = "*"
      }
    ]
  })
}

# Add permissions for SQS to task execution role
resource "aws_iam_role_policy" "sqs_policy" {
  name = "${var.name}-sqs-policy"
  role = aws_iam_role.task_execution_role.id

  policy = var.task_exec_iam_role_policy_json != null ? var.task_exec_iam_role_policy_json : jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ],
        Resource = var.queue_arn != null ? var.queue_arn : "*"
      }
    ]
  })
}

# Add permissions for Secrets Manager to task execution role
resource "aws_iam_role_policy" "secrets_policy" {
  name = "${var.name}-secrets-policy"
  role = aws_iam_role.task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        Resource = "*"
      }
    ]
  })
}

# Add permissions for SQS to task role (for application code)
resource "aws_iam_role_policy" "task_sqs_policy" {
  name = "${var.name}-task-sqs-policy"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ],
        # Ensure we have permissions for the specific queue and all queues if needed
        Resource = var.queue_arn != null ? [var.queue_arn, "${var.queue_arn}*"] : ["*"]
      }
    ]
  })
}

# Add permissions for Secrets Manager to task role (for application code)
resource "aws_iam_role_policy" "task_secrets_policy" {
  name = "${var.name}-task-secrets-policy"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        Resource = "*"
      }
    ]
  })
}

module "service" {
  source  = "terraform-aws-modules/ecs/aws//modules/service"
  version = "5.7.0"

  name        = var.name
  cluster_arn = var.cluster_arn
  cpu         = var.cpu
  memory      = var.memory
  desired_count = var.desired_count

  # Use our custom task execution role
  task_exec_iam_role_arn = aws_iam_role.task_execution_role.arn

  # Use our custom task role
  tasks_iam_role_arn = aws_iam_role.task_role.arn

  container_definitions = {
    "${var.name}" = {
      name      = var.name
      image     = var.image
      essential = true
      port_mappings = [{
        containerPort = var.container_port
        hostPort      = var.container_port
      }]
      environment = [for k, v in var.env_vars : {
        name  = k
        value = v
      }]
      log_configuration = {
        logDriver = "awslogs"
        options = {
          "awslogs-region"        = var.aws_region
          "awslogs-group"         = aws_cloudwatch_log_group.service.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  }

  load_balancer = var.create_load_balancer ? [{
    target_group_arn = aws_lb_target_group.tg[0].arn
    container_name   = var.name
    container_port   = var.container_port
  }] : []

  subnet_ids        = var.subnet_ids
  security_group_ids = var.security_group_ids != null ? var.security_group_ids : null
  tags              = var.tags
}

# Load balancer resources
resource "aws_lb_target_group" "tg" {
  count       = var.create_load_balancer ? 1 : 0
  name        = "tg-${var.name}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.selected.id
  target_type = "ip"

  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 30
    unhealthy_threshold = 3
  }

  tags = var.tags
}

resource "aws_lb_listener_rule" "rule" {
  count             = var.create_load_balancer ? 1 : 0
  listener_arn      = var.alb_listener_arn
  priority          = 100 + count.index

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg[0].arn
  }

  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}

# Autoscaling resources
resource "aws_appautoscaling_target" "ecs_target" {
  count              = var.autoscaling_enabled ? 1 : 0
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${var.cluster_arn}/${module.service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based autoscaling
resource "aws_appautoscaling_policy" "cpu_policy" {
  count              = var.autoscaling_enabled ? 1 : 0
  name               = "${var.name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_target
    scale_in_cooldown  = var.autoscaling_scale_in_cooldown
    scale_out_cooldown = var.autoscaling_scale_out_cooldown
  }
}

# Memory-based autoscaling
resource "aws_appautoscaling_policy" "memory_policy" {
  count              = var.autoscaling_enabled ? 1 : 0
  name               = "${var.name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.autoscaling_memory_target
    scale_in_cooldown  = var.autoscaling_scale_in_cooldown
    scale_out_cooldown = var.autoscaling_scale_out_cooldown
  }
}