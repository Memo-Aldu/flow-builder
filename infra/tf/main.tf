# Get two AZs for high availability
data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.4.0"

  name = local.name_prefix
  cidr = "10.0.0.0/16"
  azs  = slice(data.aws_availability_zones.available.names, 0, 2)

  # 10.0.0.0/24, 10.0.1.0/24
  public_subnets  = [for i in range(0, 2)  : cidrsubnet("10.0.0.0/16", 8, i)]
  # 10.0.10.0/24, 10.0.11.0/24
  private_subnets = [for i in range(10, 12) : cidrsubnet("10.0.0.0/16", 8, i)]

  # 10.0.20.0/24, 10.0.21.0/24
  database_subnets              = [for i in range(20, 22) : cidrsubnet("10.0.0.0/16", 8, i)]
  create_database_subnet_group  = true

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = local.tags
}

# 2. RDS – Postgres 15 in isolated subnets (no public route)
resource "aws_security_group" "db" {
  name        = "${local.name_prefix}-db-sg"
  description = "Allow ECS tasks & Lambda to reach Postgres"
  vpc_id      = module.vpc.vpc_id
  tags        = local.tags
}

# Allow ingress only from private VPC cidr blocks (app/worker/Lambda live there)
resource "aws_security_group_rule" "db_ingress" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.db.id
  cidr_blocks       = concat(module.vpc.private_subnets_cidr_blocks, module.vpc.database_subnets_cidr_blocks)
}

resource "aws_security_group_rule" "db_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.db.id
  cidr_blocks       = ["0.0.0.0/0"]
}

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.3.0"

  identifier              = "${local.name_prefix}-db"
  engine                  = "postgres"
  engine_version          = "17.4"
  family                  = "postgres17"
  instance_class          = "db.t4g.micro"  # cheapest for dev
  allocated_storage       = 20

  db_subnet_group_name    = module.vpc.database_subnet_group
  vpc_security_group_ids  = [aws_security_group.db.id]

  username                    = var.db_username
  password                    = var.db_password
  manage_master_user_password = false

  publicly_accessible     = false
  multi_az                = false
  skip_final_snapshot     = true

  # Enhanced monitoring
  create_monitoring_role  = true
  monitoring_role_name    = "${local.name_prefix}-rds-monitoring-role"

  tags = local.tags
}

# 3. ECR – one repo per image
module "ecr" {
  source = "./modules/ecr"

  repositories = ["api", "worker", "scheduler"]
  tags         = local.tags
}

# 4. SQS  – workflow request queue + DLQ
module "workflow_queue" {
  source = "./modules/sqs"

  name                       = "${local.name_prefix}-workflow-requests"
  max_receive_count          = 5
  visibility_timeout_seconds = 300
  tags                       = local.tags
}

# 5. ECS Cluster
module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "5.7.0"

  cluster_name = "${local.name_prefix}-cluster"
  tags         = local.tags
}

# 6. ECS Services – API & Worker
module "api_service" {
  source = "./modules/ecs"

  name                = "api"
  aws_region          = var.aws_region
  cluster_arn         = module.ecs_cluster.cluster_id
  container_port      = 8080
  desired_count       = var.api_desired_count
  cpu                 = var.api_cpu
  memory              = var.api_memory
  image               = "${module.ecr.repository_urls["api"]}:latest"
  subnet_ids          = module.vpc.private_subnets
  alb_listener_arn    = aws_lb_listener.http.arn
  create_load_balancer = true

  env_vars = {
    POSTGRES_HOST     = module.db.db_instance_endpoint
    POSTGRES_USER     = var.db_username
    POSTGRES_PASSWORD = var.db_password
    SQS_URL           = module.workflow_queue.queue_url
    ENVIRONMENT       = var.env
  }

  tags = local.tags
}

module "worker_service" {
  source = "./modules/ecs"

  name           = "worker"
  aws_region     = var.aws_region
  cluster_arn    = module.ecs_cluster.cluster_id
  container_port = 8080
  desired_count  = var.worker_min_capacity  # scale‑to‑0 by default
  cpu            = var.worker_cpu
  memory         = var.worker_memory
  image          = "${module.ecr.repository_urls["worker"]}:latest"
  subnet_ids     = module.vpc.private_subnets
  queue_arn      = module.workflow_queue.queue_arn

  env_vars = {
    POSTGRES_HOST     = module.db.db_instance_endpoint
    POSTGRES_USER     = var.db_username
    POSTGRES_PASSWORD = var.db_password
    SQS_URL           = module.workflow_queue.queue_url
    ENVIRONMENT       = var.env
  }

  tags = local.tags
}

# 6a. Worker auto‑scaling driven by SQS depth
resource "aws_appautoscaling_target" "worker" {
  max_capacity       = var.worker_max_capacity
  min_capacity       = var.worker_min_capacity
  resource_id        = module.worker_service.service_autoscaling_resource_id
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  depends_on         = [module.worker_service]
}

resource "aws_appautoscaling_policy" "worker_queue" {
  name               = "${local.name_prefix}-worker-queue-scaling"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.worker.resource_id
  scalable_dimension = aws_appautoscaling_target.worker.scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 60
    metric_aggregation_type = "Average"

    step_adjustment {
      scaling_adjustment          = 1
      metric_interval_lower_bound = 1
    }
  }
}

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
  alarm_actions = [aws_appautoscaling_policy.worker_queue.arn]
  tags          = local.tags
}

# 8. Lambda scheduler
module "scheduler_lambda" {
  source = "./modules/lambda"

  function_name = "${local.name_prefix}-scheduler"
  filename      = "../scheduler_lambda/scheduler_lambda.zip"
  handler       = "handler.main"
  runtime       = "python3.12"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  # Grant permissions to the SQS queue
  sqs_queue_arn = module.workflow_queue.queue_arn

  # Enable CloudWatch Logs
  enable_cloudwatch_logs = true

  # Environment variables
  env_vars = {
    SQS_URL     = module.workflow_queue.queue_url
    ENVIRONMENT = var.env
  }

  tags = local.tags
}

# EventBridge rule every 5 min
resource "aws_cloudwatch_event_rule" "every5" {
  name                = "${local.name_prefix}-every-5"
  schedule_expression = "rate(5 minutes)"
  tags                = local.tags
}

resource "aws_cloudwatch_event_target" "scheduler_target" {
  rule = aws_cloudwatch_event_rule.every5.name
  arn  = module.scheduler_lambda.lambda_arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = module.scheduler_lambda.lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.every5.arn
}