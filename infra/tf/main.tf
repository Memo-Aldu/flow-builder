# 1. Networking - VPC, subnets, security groups
module "networking" {
  source              = "./modules/networking"
  name_prefix         = local.name_prefix
  region              = var.aws_region
  vpc_cidr            = "10.0.0.0/16"
  az_count            = 2
  enable_nat_gateway  = var.enable_nat_gateway
  single_nat_gateway  = var.single_nat_gateway
  enable_nat_instance = var.enable_nat_instance
  nat_instance_type   = var.nat_instance_type
  enable_flow_logs    = var.enable_flow_logs
  enable_https        = var.enable_https

  tags = local.tags
}

# Create a custom parameter group for PostgreSQL
resource "aws_db_parameter_group" "postgres" {
  name        = "${local.name_prefix}-postgres-params"
  family      = "postgres17"
  description = "Custom parameter group for PostgreSQL"

  parameter {
    name         = "max_connections"
    value        = var.env == "dev" ? "100" : "200"
    apply_method = "pending-reboot"
  }
  parameter {
    name         = "rds.force_ssl"
    value        = "0"
    apply_method = "pending-reboot"
  }

  tags = local.tags
}

# 2. RDS - PostgreSQL database
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.3.0"

  identifier        = "${local.name_prefix}-db"
  engine            = "postgres"
  engine_version    = "17.4"
  family            = "postgres17"
  db_name           = var.db_name
  instance_class    = var.env == "dev" ? "db.t4g.micro" : "db.t4g.small"
  allocated_storage = var.env == "dev" ? 20 : 50

  db_subnet_group_name   = module.networking.database_subnet_group
  vpc_security_group_ids = [module.networking.db_security_group_id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  username                    = var.db_username
  password                    = var.db_password
  manage_master_user_password = false

  publicly_accessible     = false
  multi_az                = var.env == "dev" ? false : true
  skip_final_snapshot     = var.env == "dev" ? true : false
  deletion_protection     = var.env == "dev" ? false : true
  backup_retention_period = var.env == "dev" ? 1 : 7
  # Performance insights
  performance_insights_enabled = var.env == "dev" ? false : true
  # Enhanced monitoring
  create_monitoring_role = true
  monitoring_role_name   = "${local.name_prefix}-rds-monitoring-role"
  monitoring_interval    = var.env == "dev" ? 60 : 30

  parameters = []

  tags = local.tags
}

# 3. Secrets Manager - Database credentials
module "secrets" {
  source = "./modules/secrets"

  name_prefix             = local.name_prefix
  db_username             = var.db_username
  db_password             = var.db_password
  db_host                 = module.db.db_instance_address
  db_port                 = 5432
  db_name                 = module.db.db_instance_name
  recovery_window_in_days = var.env == "dev" ? 0 : 7

  tags = local.tags
}

# 4. ECR - Container repositories
module "ecr" {
  source = "./modules/ecr"

  repositories = ["api", "worker", "scheduler"]
  tags         = local.tags
}

# 5. SQS - Workflow request queue + DLQ
module "workflow_queue" {
  source                     = "./modules/sqs"
  name                       = "${local.name_prefix}-workflow-requests"
  max_receive_count          = 5
  visibility_timeout_seconds = 300
  tags                       = local.tags
}

# 6. ECS Cluster
module "ecs_cluster" {
  source       = "terraform-aws-modules/ecs/aws"
  version      = "5.7.0"
  cluster_name = "${local.name_prefix}-cluster"
  tags         = local.tags
}

# 7. Load Balancer
resource "aws_lb" "api" {
  name               = "${local.name_prefix}-alb"
  load_balancer_type = "application"
  subnets            = module.networking.public_subnets
  security_groups    = [module.networking.alb_security_group_id]
  tags               = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
      message_body = "Not found"
    }
  }
}

# 8. ECS Services - API & Worker
resource "aws_iam_policy" "api_sqs_policy" {
  name        = "api-sqs-direct-access-policy"
  description = "Policy to allow API service to send messages to SQS queue"
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
        Resource = module.workflow_queue.queue_arn
      }
    ]
  })
}

module "api_service" {
  source               = "./modules/ecs"
  name                 = "api"
  aws_region           = var.aws_region
  cluster_arn          = module.ecs_cluster.cluster_id
  container_port       = 8080
  desired_count        = var.api_desired_count
  cpu                  = var.api_cpu
  memory               = var.api_memory
  image                = "${module.ecr.repository_urls["api"]}:latest"
  subnet_ids           = module.networking.private_subnets
  security_group_ids   = [module.networking.ecs_security_group_id]
  alb_listener_arn     = aws_lb_listener.http.arn
  create_load_balancer = true
  queue_arn            = module.workflow_queue.queue_arn

  # Enable autoscaling for API service
  autoscaling_enabled       = true
  autoscaling_min_capacity  = var.env == "dev" ? 0 : 1
  autoscaling_max_capacity  = var.env == "dev" ? 2 : 5
  autoscaling_cpu_target    = 70
  autoscaling_memory_target = 70

  env_vars = {
    # SQS configuration
    SQS_URL = module.workflow_queue.queue_url
    # For backward compatibility
    WORKFLOW_QUEUE_URL = module.workflow_queue.queue_url
    # Database configuration
    DB_HOST     = module.db.db_instance_address
    DB_PORT     = "5432"
    DB_USER     = var.db_username
    DB_PASSWORD = var.db_password
    DB_NAME     = module.db.db_instance_name
    # For backward compatibility
    POSTGRES_HOST     = module.db.db_instance_address
    POSTGRES_USER     = var.db_username
    POSTGRES_PASSWORD = var.db_password
    # Authentication configuration
    CLERK_SECRET_KEY   = var.clerk_secret_key
    CLERK_FRONTEND_URL = var.clerk_frontend_url
    CUSTOM_AWS_REGION  = var.aws_region
    # General configuration
    ENVIRONMENT   = var.env
    DB_SECRET_ARN = module.secrets.secret_arn
  }
  tags = local.tags
}

# Attach the SQS policy to the API service's task role
resource "aws_iam_role_policy_attachment" "api_sqs_policy_attachment" {
  role       = module.api_service.task_role_name
  policy_arn = aws_iam_policy.api_sqs_policy.arn
}

module "worker_service" {
  source                    = "./modules/ecs"
  name                      = "worker"
  aws_region                = var.aws_region
  cluster_arn               = module.ecs_cluster.cluster_id
  container_port            = 8080
  desired_count             = var.worker_min_capacity
  cpu                       = var.worker_cpu
  memory                    = var.worker_memory
  image                     = "${module.ecr.repository_urls["worker"]}:latest"
  subnet_ids                = module.networking.private_subnets
  security_group_ids        = [module.networking.ecs_security_group_id]
  queue_arn                 = module.workflow_queue.queue_arn
  autoscaling_enabled       = true
  autoscaling_min_capacity  = var.worker_min_capacity
  autoscaling_max_capacity  = var.worker_max_capacity
  autoscaling_cpu_target    = 70
  autoscaling_memory_target = 70
  # Enable SQS-based scaling
  enable_sqs_scaling   = true
  has_queue_configured = true

  env_vars = {
    # SQS configuration
    SQS_URL            = module.workflow_queue.queue_url
    WORKFLOW_QUEUE_URL = module.workflow_queue.queue_url
    # Database configuration
    DB_HOST     = module.db.db_instance_address
    DB_PORT     = "5432"
    DB_USER     = var.db_username
    DB_PASSWORD = var.db_password
    DB_NAME     = module.db.db_instance_name
    # For backward compatibility
    POSTGRES_HOST     = module.db.db_instance_address
    POSTGRES_USER     = var.db_username
    POSTGRES_PASSWORD = var.db_password
    CUSTOM_AWS_REGION = var.aws_region
    # General configuration
    ENVIRONMENT   = var.env
    DB_SECRET_ARN = module.secrets.secret_arn
  }

  tags = local.tags
}

# 9. CloudWatch Alarm for SQS queue depth
resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  alarm_name          = "${local.name_prefix}-queue-depth"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  dimensions = {
    QueueName = module.workflow_queue.queue_name
  }
  alarm_actions = var.env != "dev" ? [aws_sns_topic.alerts[0].arn] : []
  tags          = local.tags
}

# 10. SNS Topic for alerts (not created in dev)
resource "aws_sns_topic" "alerts" {
  count = var.env != "dev" ? 1 : 0
  name  = "${local.name_prefix}-alerts"
  tags  = local.tags
}

# 11. Lambda scheduler
module "scheduler_lambda" {
  source          = "./modules/lambda"
  function_name   = "${local.name_prefix}-scheduler"
  package_type    = "Image"
  image_uri       = "${module.ecr.repository_urls["scheduler"]}:latest"
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout
  create_function = var.create_lambda
  sqs_queue_arn   = module.workflow_queue.queue_arn
  # VPC configuration for database access
  subnet_ids         = module.networking.private_subnets
  security_group_ids = [module.networking.ecs_security_group_id]
  # Enable CloudWatch Logs
  enable_cloudwatch_logs = true
  # Environment variables
  env_vars = {
    # SQS configuration
    SQS_URL = module.workflow_queue.queue_url
    # Database configuration
    DB_HOST           = module.db.db_instance_address
    DB_PORT           = "5432"
    DB_USER           = var.db_username
    DB_PASSWORD       = var.db_password
    DB_NAME           = module.db.db_instance_name
    CUSTOM_AWS_REGION = var.aws_region
    ENVIRONMENT       = var.env
    DB_SECRET_ARN     = module.secrets.secret_arn
  }
  tags = local.tags
}

# 12. EventBridge rule every 5 min
resource "aws_cloudwatch_event_rule" "every5" {
  name                = "${local.name_prefix}-every-5"
  schedule_expression = "rate(5 minutes)"
  tags                = local.tags
}

resource "aws_cloudwatch_event_target" "scheduler_target" {
  count = var.env == "dev" ? 0 : 1
  rule  = aws_cloudwatch_event_rule.every5.name
  arn   = module.scheduler_lambda.lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  count         = var.env == "dev" ? 0 : 1
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.scheduler_lambda.lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every5.arn
}

# 13. Monitoring and Dashboards
module "monitoring" {
  source              = "./modules/monitoring"
  name_prefix         = local.name_prefix
  aws_region          = var.aws_region
  create_dashboard    = var.create_dashboard
  create_alarms       = var.create_alarms
  cluster_name        = module.ecs_cluster.cluster_name
  api_service_name    = module.api_service.service_name
  worker_service_name = module.worker_service.service_name
  queue_name          = module.workflow_queue.queue_name
  db_instance_id      = module.db.db_instance_identifier
  alarm_actions       = var.env != "dev" ? [aws_sns_topic.alerts[0].arn] : []
}

# 14. SSM Bastion for RDS access
module "ssm_bastion" {
  source                          = "./modules/ssm_bastion"
  count                           = var.enable_ssm_bastion ? 1 : 0
  name_prefix                     = local.name_prefix
  vpc_id                          = module.networking.vpc_id
  subnet_id                       = module.networking.private_subnets[0]
  db_security_group_id            = module.networking.db_security_group_id
  vpc_endpoints_security_group_id = module.networking.vpc_endpoints_security_group_id
  region                          = var.aws_region
  instance_type                   = var.bastion_instance_type
  db_host                         = module.db.db_instance_address
  db_name                         = var.db_name
  db_username                     = var.db_username
  db_password                     = var.db_password
  tags                            = local.tags
}
