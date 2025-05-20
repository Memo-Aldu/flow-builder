# GitHub Actions Setup Guide

This document provides instructions for setting up and troubleshooting GitHub Actions workflows for the Flow Builder application.

## Required Secrets

The following secrets need to be configured in your GitHub repository:

- **AWS_ROLE_TO_ASSUME**: ARN of the IAM role to assume for AWS operations
- **AWS_REGION**: AWS region where resources are deployed (e.g., `us-east-1`)
- **DB_PASSWORD**: Database password for Terraform
- **SECRET_ENCRYPTION_PASSWORD**: Password used for encrypting secrets
- **SECRET_ENCRYPTION_SALT**: Salt used for encrypting secrets
- **ENVIRONMENT**: Default environment (e.g., `dev`, `staging`, or `prod`)

## IAM Role Configuration

The GitHub Actions workflows use OpenID Connect (OIDC) to authenticate with AWS. You need to create an IAM role with the following permissions:

### Required IAM Policies

1. **ECR Permissions**:
   - Create and manage ECR repositories
   - Push and pull images

2. **ECS Permissions**:
   - Update ECS services

3. **Lambda Permissions**:
   - Update Lambda functions

4. **DynamoDB Permissions**:
   - Read and write to the Terraform state lock table

5. **S3 Permissions**:
   - Read and write to the Terraform state bucket

### Example IAM Policy for GitHub Actions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:ListTagsForResource",
        "ecr:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeClusters",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/workflow-build-tf-lock-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::workflow-build-tf-state-*",
        "arn:aws:s3:::workflow-build-tf-state-*/*"
      ]
    }
  ]
}
```

## Workflow Behavior

### ECR Repository Creation

The workflows will automatically create ECR repositories if they don't exist. The repository names follow this pattern:

- `flow-builder-{environment}-worker`
- `flow-builder-{environment}-scheduler`
- `flow-builder-{environment}-api` (if deployed on AWS)

### ECS Service Updates

The workflows will attempt to update the ECS services after pushing new images. They will check for services with both simple names (e.g., `worker`) and fully qualified names (e.g., `flow-builder-dev-worker`) to handle different naming conventions.

### Terraform State Locking

The workflows will check for DynamoDB permissions and disable state locking if the permissions are not available. This allows the workflows to run even if the DynamoDB permissions are not properly configured, but it's recommended to add the proper permissions to avoid potential state conflicts.

### Required Variables Checking

The Terraform workflow will check for required variables and fail immediately if any are missing:

- `DB_PASSWORD`: Required for database access
- `SECRET_ENCRYPTION_PASSWORD`: Required for secret encryption
- `SECRET_ENCRYPTION_SALT`: Required for secret encryption

The workflow will exit with an error if any of these variables are not set as GitHub secrets. This prevents deployment failures later in the process due to missing credentials.

### Docker Build Retries

The workflows include retry logic for Docker builds to handle transient network issues. Each build will be attempted up to 3 times before failing.