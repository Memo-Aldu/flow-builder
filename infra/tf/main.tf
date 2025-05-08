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