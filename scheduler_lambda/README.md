# FlowBuilder Scheduler Lambda

This is the scheduler Lambda function for the FlowBuilder application. It periodically checks for workflows that are due to run and sends execution requests to the SQS queue.

## Features

- Serverless execution using AWS Lambda
- Scheduled execution using EventBridge rules
- Database integration for retrieving workflow information
- SQS integration for sending workflow execution requests
- Containerized deployment using Docker and ECR

## How It Works

1. The Lambda function is triggered by an EventBridge rule on a schedule (e.g., every 5 minutes)
2. It connects to the PostgreSQL database and queries for workflows that are due to run
3. For each due workflow, it:
   - Updates the workflow's next run time based on its cron expression
   - Creates a new execution record in the database
   - Sends a message to the SQS queue with the workflow and execution IDs
4. The worker service then picks up these messages and executes the workflows

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | - |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `flow-builder` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | - |
| `DB_SSL_MODE` | SSL mode for database connection | `require` |
| `SQS_URL` | URL of the SQS queue for workflow requests | - |
| `CUSTOM_AWS_REGION` | AWS region | `us-east-1` |
| `USE_DB_SECRETS` | Whether to use database-stored secrets | `false` |

## Building and Deploying

### Using the Build Script

The scheduler includes a build script that builds and pushes the Docker image to AWS ECR:

```bash
cd scheduler_lambda
./build_and_push.sh
```

This script:
1. Builds a Docker image for the Lambda function
2. Pushes the image to Amazon ECR
3. Updates the Lambda function to use the new image

### Manual Deployment

1. Build the Docker image:
```bash
docker build -t flow-builder-scheduler -f scheduler_lambda/Dockerfile .
```

2. Tag and push to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker tag flow-builder-scheduler:latest <account-id>.dkr.ecr.<region>.amazonaws.com/flow-builder-scheduler:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/flow-builder-scheduler:latest
```

3. Update the Lambda function:
```bash
aws lambda update-function-code \
  --function-name flow-builder-scheduler \
  --image-uri <account-id>.dkr.ecr.<region>.amazonaws.com/flow-builder-scheduler:latest
```

## Terraform Configuration

The Lambda function is deployed using Terraform in the ultra-cost-optimized infrastructure:

```hcl
module "scheduler_lambda" {
  source          = "../modules/lambda"
  function_name   = "${local.name_prefix}-scheduler"
  package_type    = "Image"
  image_uri       = "${aws_ecr_repository.scheduler.repository_url}:latest"
  memory_size     = var.lambda_memory_size
  timeout         = var.lambda_timeout
  create_function = var.create_lambda
  sqs_queue_arn   = module.workflow_queue.queue_arn

  # Environment variables
  env_vars = {
    # SQS configuration
    SQS_URL = module.workflow_queue.queue_url

    # Database configuration
    DB_HOST     = var.db_host
    DB_PORT     = var.db_port
    DB_NAME     = var.db_name
    DB_USER     = var.db_username
    DB_PASSWORD = var.db_password
    DB_SSL_MODE = "require"

    # Add custom AWS region to ensure proper region is used
    CUSTOM_AWS_REGION = var.aws_region

    # Explicitly disable DB secrets to use direct database connection
    USE_DB_SECRETS = "false"
  }
}
```

## Monitoring

- CloudWatch Logs: Check the Lambda logs in the `/aws/lambda/flow-builder-scheduler` log group
- CloudWatch Metrics: Monitor Lambda invocation count, duration, and errors
- EventBridge: Check the scheduler rule for Lambda invocation

## Troubleshooting

- **Database Connection Issues**: Ensure the database connection parameters are correct
- **SQS Access**: Verify that the Lambda function has permissions to send messages to the SQS queue
- **Timeout Errors**: Increase the Lambda timeout if the function is timing out
- **Memory Errors**: Increase the Lambda memory if the function is running out of memory

For more detailed logs, check the CloudWatch Logs for the Lambda function.
