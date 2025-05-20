# FlowBuilder Worker

This is the worker service for the FlowBuilder application. It processes workflow execution requests from an SQS queue and executes the workflows using browser automation with Playwright.

## Features

- Browser automation using Playwright/Patchright
- Support for headless and headful browser modes
- Workflow execution with multiple nodes (browser actions, data extraction, etc.)
- Integration with OpenAI for AI-powered data extraction
- Database integration for storing execution results
- Secure credential management

## Modes of Operation

The worker supports two modes of operation:

1. **SQS Polling Mode** - For local development and testing
2. **EventBridge Pipes Mode** - For production deployment with AWS EventBridge Pipes

### SQS Polling Mode

In this mode, the worker continuously polls an SQS queue for messages. This is useful for local development and testing.

To run in SQS polling mode, set the following environment variables:

```
POLLING_MODE=true
EVENTBRIDGE_PIPES_MODE=false
```

### EventBridge Pipes Mode

In this mode, the worker expects to receive messages via environment variables set by AWS EventBridge Pipes. This is the recommended mode for production deployment as it's more cost-effective (the worker only runs when there are messages to process).

To run in EventBridge Pipes mode, set the following environment variables:

```
POLLING_MODE=false
EVENTBRIDGE_PIPES_MODE=true
EXIT_AFTER_COMPLETION=true
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POLLING_MODE` | Enable SQS polling mode | `false` |
| `EVENTBRIDGE_PIPES_MODE` | Enable EventBridge Pipes mode | `true` |
| `WORKFLOW_QUEUE_URL` | URL of the SQS queue to poll | `http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/flow-builder-queue` |
| `MAX_POLL_MESSAGES` | Maximum number of messages to retrieve in polling mode | `5` |
| `POLL_WAIT_TIME` | Wait time in seconds for long polling | `20` |
| `EXIT_AFTER_COMPLETION` | Exit after processing messages in EventBridge Pipes mode | `true` |
| `DEBUG_MODE` | Enable debug logging | `true` |
| `LOG_LEVEL` | Python logging level | `DEBUG` |
| `PLAYWRIGHT_HEADLESS` | Run browser in headless mode (1=headless, 0=headful) | `1` |
| `DB_HOST` | Database host | - |
| `DB_PORT` | Database port | - |
| `DB_NAME` | Database name | - |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `SQS_ENDPOINT_URL` | Custom SQS endpoint URL (for LocalStack) | - |
| `AWS_REGION` | AWS region | `us-east-1` |
| `SQS_BODY` | Message body from EventBridge Pipes | - |
| `USE_DB_SECRETS` | Whether to use database-stored secrets | `false` |
| `SECRET_ENCRYPTION_KEY` | Encryption key for database-stored secrets | - |
| `SECRET_ENCRYPTION_SALT` | Salt for encryption key derivation | `flow-builder-salt` |
| `SECRET_ENCRYPTION_PASSWORD` | Password for encryption key derivation | `development-password-only` |

## Running Locally

### With Docker

```bash
# Build the Docker image
docker build -t flow-builder-worker -f worker/Dockerfile .

# Run in polling mode
docker run -e POLLING_MODE=true -e DB_HOST=host.docker.internal flow-builder-worker

# Run in headful mode (for debugging)
docker run -e POLLING_MODE=true -e PLAYWRIGHT_HEADLESS=0 -e DB_HOST=host.docker.internal flow-builder-worker
```

### Without Docker

```bash
cd /path/to/flow-builder
export PYTHONPATH=$PWD
export POLLING_MODE=true
python -m worker.main
```

## Deployment

### Using the Deployment Script

The worker includes a deployment script that builds and pushes the Docker image to AWS ECR:

```bash
cd worker
./deploy-worker.sh
```

### AWS EventBridge Pipes Configuration

When deploying with AWS EventBridge Pipes, the following configuration is recommended:

1. Source: SQS Queue
2. Target: ECS Task (Fargate)
3. Batch Size: 1 (to process one message at a time)
4. Environment Variables:
   - Set `SQS_BODY` to `$[0].body` to extract the message body
   - Set `POLLING_MODE=false`
   - Set `EVENTBRIDGE_PIPES_MODE=true`
   - Set `EXIT_AFTER_COMPLETION=true`

This configuration ensures that the worker processes one message at a time and exits after completion, allowing AWS to scale the service based on queue depth.

## Supported Node Types

The worker supports various node types for workflow execution:

1. **Browser Nodes**:
   - Launch Browser: Opens a browser and navigates to a URL
   - Fill Input: Fills a form input with text
   - Click Element: Clicks on an element on the page

2. **Data Extraction Nodes**:
   - Get HTML: Retrieves the HTML content of the current page
   - Get Text From HTML: Extracts text from HTML using CSS selectors
   - Condense HTML: Reduces HTML size by removing scripts and comments
   - OpenAI Call: Extracts structured data using AI

## Troubleshooting

- **Connection Issues**: Ensure the database connection parameters are correct
- **SQS Access**: Verify that the worker has permissions to access the SQS queue
- **Browser Errors**: Check if the browser is running in the correct mode (headless/headful)
- **EventBridge Pipes**: Verify that the SQS_BODY environment variable is correctly set

For more detailed logs, set `DEBUG_MODE=true` and `LOG_LEVEL=DEBUG`.