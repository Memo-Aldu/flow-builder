# GitHub Actions Workflows

This directory contains GitHub Actions workflows for building, testing, and deploying the Flow Builder application.

## Workflows

### Build and Deploy Services

These workflows build Docker images for the services and push them to Amazon ECR:

- **build-api.yml**: Builds and deploys the API service
- **build-worker.yml**: Builds and deploys the Worker service
- **build-lambda.yml**: Builds and deploys the Lambda function

These workflows are triggered when:
- Code is pushed to the `main` branch and changes are detected in the respective service directories or the shared directory
- Manually triggered via the GitHub Actions UI

### Deploy Infrastructure

The **deploy-infrastructure.yml** workflow deploys the infrastructure using Terraform:

1. **Terraform Plan**: Creates an execution plan
2. **Approval**: Requires manual approval before proceeding
3. **Terraform Apply**: Applies the changes

This workflow is triggered when:
- Code is pushed to the `main` branch and changes are detected in the `infra/tf` directory
- Manually triggered via the GitHub Actions UI

## Required Secrets

The following secrets need to be configured in your GitHub repository:

- **AWS_ROLE_TO_ASSUME**: ARN of the IAM role to assume for AWS operations
- **AWS_REGION**: AWS region where resources are deployed
- **DB_PASSWORD**: Database password for Terraform
- **ENVIRONMENT**: Default environment (dev, staging, or prod)

## Manual Deployment

To manually deploy the infrastructure:

1. Go to the Actions tab in your GitHub repository
2. Select the "Deploy Infrastructure" workflow
3. Click "Run workflow"
4. Select the environment (dev, staging, or prod)
5. Click "Run workflow"
6. Approve the deployment when prompted

## Best Practices

- **Secrets Management**: Never store sensitive information in the repository
- **Least Privilege**: Use IAM roles with minimal permissions
- **Approval Gates**: Require manual approval for production deployments
- **Automated Testing**: Add tests to ensure code quality before deployment
- **Versioning**: Tag releases for better traceability
