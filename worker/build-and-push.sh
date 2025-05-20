#!/bin/bash
set -e

# Get the ECR repository URL from Terraform output
ECR_REPO="$(aws ecr describe-repositories --repository-names flow-builder-dev-worker --query 'repositories[0].repositoryUri' --output text)"
AWS_REGION="us-east-1"

if [ -z "$ECR_REPO" ]; then
  echo "Error: Could not get ECR repository URL from Terraform output."
  echo "Make sure you've applied the Terraform configuration first."
  exit 1
fi

echo "Building worker Docker image..."
docker build -t "$ECR_REPO:latest" -f Dockerfile ../

echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPO"

echo "Pushing image to ECR..."
docker push "$ECR_REPO:latest"

echo "Image successfully pushed to $ECR_REPO:latest"
