#!/bin/bash
set -e

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY=flow-builder-dev-scheduler
IMAGE_TAG=latest

# Navigate to the project root
cd "$(dirname "$0")/.."

# Ensure the ECR repository exists
aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} || \
  aws ecr create-repository --repository-name ${ECR_REPOSITORY}

# Get ECR login token
aws ecr get-login-password | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build the Docker image
echo "Building Docker image..."
docker buildx build --platform linux/amd64 -t ${ECR_REPOSITORY}:${IMAGE_TAG} -f scheduler_lambda/Dockerfile .

# Tag the image for ECR
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

# Push the image to ECR
echo "Pushing image to ECR..."
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "Image pushed successfully: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}"


# Update the Lambda function
echo "Updating Lambda function..."
aws lambda update-function-code \
  --function-name flow-builder-dev-scheduler \
  --image-uri ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}

echo "Lambda function updated successfully!"
