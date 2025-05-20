# Flow Builder - Workflow Automation App

## Overview
Flow Builder is a workflow automation application that allows users to create, schedule, and run workflows with a drag-and-drop editor. The app supports various features like task orchestration, browser automation, AI-based data extraction, and integration with external APIs.

## Project Structure
- **frontend/**: Next.js application with React Flow for the workflow editor UI
- **api/**: FastAPI service for workflow management and orchestration
- **worker/**: Python-based worker service that executes workflow tasks using Playwright
- **scheduler_lambda/**: AWS Lambda function for triggering scheduled workflows
- **shared/**: Common code shared between services
- **infra/**: Infrastructure-as-code using Terraform to provision AWS resources

## Architecture
The application is built with a microservices architecture:

1. **Frontend**: React-based UI for workflow creation and management
2. **API Service**: Handles user requests, workflow CRUD operations, and queues execution requests
3. **Worker Service**: Processes workflow execution requests from SQS and runs browser automation tasks
4. **Scheduler**: Lambda function that triggers workflows based on their cron schedules
5. **Database**: PostgreSQL database for storing workflow definitions and execution results

## Infrastructure Options
The application supports multiple infrastructure deployment options:

1. **Standard Infrastructure**: Full-featured deployment with high availability
2. **Ultra-Cost-Optimized**: Zero-scale architecture using EventBridge Pipes and Fargate Spot for minimal costs

## Getting Started
Clone the repository:
```bash
git clone git@github.com:Memo-Aldu/flow-builder.git
cd flow-builder
```

### Local Development
1. Start the local infrastructure:
```bash
cd infra
docker-compose up -d
```

2. Run the API service:
```bash
cd api
pip install -r requirements.txt
uvicorn app.main:app --reload
```

3. Run the frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Run the worker in polling mode:
```bash
cd worker
pip install -r requirements.txt
export POLLING_MODE=true
python -m worker.main
```

## Deployment
See the [infrastructure documentation](infra/README.md) for deployment instructions.
