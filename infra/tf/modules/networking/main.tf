data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.4.0"

  name = var.name_prefix
  cidr = var.vpc_cidr

  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # Public subnets for ALB
  public_subnets = [
    for i in range(0, var.az_count) : cidrsubnet(var.vpc_cidr, 8, i)
  ]

  # Private subnets for ECS services
  private_subnets = [
    for i in range(10, 10 + var.az_count) : cidrsubnet(var.vpc_cidr, 8, i)
  ]

  # Database subnets for RDS
  database_subnets = [
    for i in range(20, 20 + var.az_count) : cidrsubnet(var.vpc_cidr, 8, i)
  ]

  create_database_subnet_group = true

  # NAT Gateway configuration
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway

  # VPC Flow Logs
  enable_flow_log                      = var.enable_flow_logs
  create_flow_log_cloudwatch_log_group = var.enable_flow_logs
  create_flow_log_cloudwatch_iam_role  = var.enable_flow_logs
  flow_log_max_aggregation_interval    = 60

  tags = var.tags
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Allow HTTP/HTTPS from internet"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags
}

resource "aws_security_group_rule" "alb_ingress_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  security_group_id = aws_security_group.alb.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_ingress_https" {
  count             = var.enable_https ? 1 : 0
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.alb.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "alb_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.alb.id
  cidr_blocks       = ["0.0.0.0/0"]
}

# Security group for RDS
resource "aws_security_group" "db" {
  name        = "${var.name_prefix}-db-sg"
  description = "Allow ECS tasks & Lambda to reach Postgres"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags
}

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

# Security group for ECS services
resource "aws_security_group" "ecs" {
  name        = "${var.name_prefix}-ecs-sg"
  description = "Allow traffic to ECS services"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags
}

resource "aws_security_group_rule" "ecs_ingress_alb" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs.id
  source_security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "ecs_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.ecs.id
  cidr_blocks       = ["0.0.0.0/0"]
}

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.name_prefix}-vpce-sg"
  description = "Allow traffic to VPC endpoints"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags
}

resource "aws_security_group_rule" "vpce_ingress" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.vpc_endpoints.id
  cidr_blocks       = module.vpc.private_subnets_cidr_blocks
}

resource "aws_security_group_rule" "vpce_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.vpc_endpoints.id
  cidr_blocks       = ["0.0.0.0/0"]
}

# VPC Endpoints for ECR
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags                = var.tags
}

resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags                = var.tags
}

# VPC Endpoint for S3 (needed for ECR to pull layers)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
  tags              = var.tags
}

# VPC Endpoint for CloudWatch Logs
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags                = var.tags
}

# VPC Endpoint for SQS
resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = module.vpc.vpc_id
  service_name        = "com.amazonaws.${var.region}.sqs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.vpc.private_subnets
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true
  tags                = var.tags
}
