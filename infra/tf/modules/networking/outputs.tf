output "vpc_id" {
  value       = module.vpc.vpc_id
  description = "The ID of the VPC"
}

output "public_subnets" {
  value       = module.vpc.public_subnets
  description = "List of IDs of public subnets"
}

output "private_subnets" {
  value       = module.vpc.private_subnets
  description = "List of IDs of private subnets"
}

output "database_subnets" {
  value       = module.vpc.database_subnets
  description = "List of IDs of database subnets"
}

output "database_subnet_group" {
  value       = module.vpc.database_subnet_group
  description = "ID of database subnet group"
}

output "alb_security_group_id" {
  value       = aws_security_group.alb.id
  description = "ID of the ALB security group"
}

output "db_security_group_id" {
  value       = aws_security_group.db.id
  description = "ID of the database security group"
}

output "ecs_security_group_id" {
  value       = aws_security_group.ecs.id
  description = "ID of the ECS security group"
}

output "private_subnets_cidr_blocks" {
  value       = module.vpc.private_subnets_cidr_blocks
  description = "List of CIDR blocks of private subnets"
}

output "database_subnets_cidr_blocks" {
  value       = module.vpc.database_subnets_cidr_blocks
  description = "List of CIDR blocks of database subnets"
}

output "vpc_endpoints_security_group_id" {
  value       = aws_security_group.vpc_endpoints.id
  description = "ID of the VPC endpoints security group"
}

output "ecr_dkr_endpoint_id" {
  value       = aws_vpc_endpoint.ecr_dkr.id
  description = "ID of the ECR Docker endpoint"
}

output "ecr_api_endpoint_id" {
  value       = aws_vpc_endpoint.ecr_api.id
  description = "ID of the ECR API endpoint"
}

output "s3_endpoint_id" {
  value       = aws_vpc_endpoint.s3.id
  description = "ID of the S3 endpoint"
}

output "logs_endpoint_id" {
  value       = aws_vpc_endpoint.logs.id
  description = "ID of the CloudWatch Logs endpoint"
}

output "sqs_endpoint_id" {
  value       = aws_vpc_endpoint.sqs.id
  description = "ID of the SQS endpoint"
}
