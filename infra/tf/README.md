# Flow Builder Infrastructure

This directory contains the Terraform code for deploying the Flow Builder application infrastructure to AWS.

## Architecture

The infrastructure is organized into modular components:

```
tf/
├── environments/
│   ├── dev/
│   │   ├── main.tf        # Calls modules with dev-specific values
│   │   ├── variables.tf
│   │   └── backend.tf     # Dev state configuration
│   ├── staging/
│   │   ├── main.tf        # Calls modules with staging-specific values
│   │   ├── variables.tf
│   │   └── backend.tf     # Staging state configuration
│   └── prod/
│       ├── main.tf        # Calls modules with prod-specific values
│       ├── variables.tf
│       └── backend.tf     # Prod state configuration
├── modules/
│   ├── networking/        # VPC, subnets, security groups
│   ├── secrets/           # AWS Secrets Manager resources
│   ├── ecs/               # ECS service with autoscaling
│   ├── ecr/               # ECR repositories
│   ├── sqs/               # SQS queues with DLQ
│   ├── lambda/            # Lambda functions
│   └── monitoring/        # CloudWatch dashboards and alarms
└── global/
    └── s3-state/          # Terraform state bucket setup
```

## Infrastructure Components

- **Networking**: VPC with public, private, and database subnets
- **Database**: RDS PostgreSQL with environment-specific configurations
- **Secrets Management**: AWS Secrets Manager for database credentials
- **Container Registry**: ECR repositories for container images
- **Messaging**: SQS queues with dead-letter queues
- **Compute**: ECS Fargate services with autoscaling
- **Serverless**: Lambda functions for scheduling
- **Monitoring**: CloudWatch dashboards and alarms

## Cost Optimization for Development

The development environment is optimized for cost:

- **Scale-to-Zero**: API and Worker services can scale down to 0 when not in use
- **Minimal Database**: Uses the smallest RDS instance with minimal storage
- **Single NAT Gateway**: Uses a single NAT gateway instead of one per AZ
- **Minimal Monitoring**: Reduced monitoring and logging retention
- **No Multi-AZ**: Database runs in a single AZ for development

## Prerequisites

- Terraform 1.8.0 or later
- AWS CLI configured with appropriate credentials
- Docker for building container images

## Initial Setup

Before deploying the infrastructure, you need to create the S3 bucket and DynamoDB table for Terraform state:

```bash
cd global/s3-state
terraform init
terraform apply -var="env=dev"
```

## Deployment

### Initialize Terraform

```bash
terraform init -backend-config=backend.dev.tfbackend
```

### Plan Changes

```bash
terraform plan -var-file=environments/dev.tfvars -var="db_password=your_secure_password"
```

### Apply Changes

```bash
terraform apply -var-file=environments/dev.tfvars -var="db_password=your_secure_password"
```

### Destroy Infrastructure

```bash
terraform destroy -var-file=environments/dev.tfvars -var="db_password=your_secure_password"
```

## Environment-Specific Configurations

The infrastructure supports multiple environments through environment-specific variable files:

- **Dev**: Optimized for cost and development speed
- **Staging**: Similar to production but with smaller resources
- **Production**: Optimized for reliability and performance

## Security Considerations

- Sensitive values like passwords are never stored in version control
- Database credentials are stored in AWS Secrets Manager
- All services run in private subnets
- Security groups restrict access to the minimum required
- Database backups and snapshots are enabled in production

## Extending the Infrastructure

To add new components:

1. Create a new module in the `modules` directory if needed
2. Add the module to `main.tf`
3. Add any required variables to `variables.tf`
4. Update environment-specific variable files in the `environments` directory

## Monitoring and Alerting

- CloudWatch dashboards provide visibility into all services
- Alarms are configured for critical metrics in production
- SNS topics deliver alerts to appropriate channels

## Autoscaling

Both the API and Worker services support autoscaling:

- **API Service**: Scales based on CPU and memory utilization
- **Worker Service**: Scales based on SQS queue depth

## Upgrading to Production

When ready to move from development to production:

1. Increase instance sizes and counts
2. Enable multi-AZ for high availability
3. Enable more extensive monitoring and alerting
4. Configure longer backup retention periods
5. Enable HTTPS with ACM certificates
