# Flow Builder Infrastructure Architecture

This document provides an overview of the infrastructure architecture options available for the Flow Builder application, explaining the differences between the standard scalable infrastructure and the ultra-cost-optimized infrastructure.

## Infrastructure Options

Flow Builder supports two primary infrastructure deployment models:

1. **Standard Scalable Infrastructure**: Full-featured deployment with high availability, autoscaling, and comprehensive monitoring
2. **Ultra-Cost-Optimized Infrastructure**: Zero-scale architecture using EventBridge Pipes and Fargate Spot for minimal costs

## Standard Scalable Infrastructure

The standard infrastructure is designed for production-ready deployments with high availability, scalability, and comprehensive monitoring.

### Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Frontend   │────►│  API Service│────►│  SQS Queue  │────►│  Worker     │
│  (Next.js)  │     │  (FastAPI)  │     │             │     │  Service    │
│             │     │             │     │             │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘     └──────┬──────┘
                           │                                        │
                           ▼                                        ▼
                    ┌─────────────┐                         ┌─────────────┐
                    │             │                         │             │
                    │  Database   │◄────────────────────────┤  External   │
                    │  (RDS)      │                         │  Services   │
                    │             │                         │             │
                    └─────────────┘                         └─────────────┘
                           ▲
                           │
                    ┌─────────────┐
                    │             │
                    │  Lambda     │
                    │  Scheduler  │
                    │             │
                    └─────────────┘
```

### Key Components

1. **Networking**
   - VPC with public, private, and database subnets
   - NAT Gateway or NAT Instance for private subnet internet access
   - Security groups for controlled access between services

2. **Database**
   - RDS PostgreSQL with environment-specific configurations
   - Multi-AZ deployment for production environments
   - Performance insights and monitoring for production

3. **Compute**
   - ECS Fargate for containerized services
   - Autoscaling based on CPU, memory, and SQS queue depth
   - Load balancer for API service

4. **Messaging**
   - SQS queues with dead-letter queues for workflow requests
   - CloudWatch alarms for queue monitoring

5. **Serverless**
   - Lambda function for scheduling workflow executions

6. **Monitoring**
   - CloudWatch dashboards and alarms
   - SNS topics for alerts

### SQS-Based Autoscaling

The standard infrastructure includes SQS-based autoscaling for the worker service, which allows it to scale based on the number of messages in the queue:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  SQS Queue  │────►│ CloudWatch  │────►│ Autoscaling │
│             │     │ Alarms      │     │ Policies    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │             │
                                         │  ECS        │
                                         │  Service    │
                                         │             │
                                         └─────────────┘
```

The SQS-based autoscaling works as follows:

1. CloudWatch alarms monitor the `ApproximateNumberOfMessagesVisible` metric in the SQS queue
2. When messages are present, the "queue-not-empty" alarm triggers the scale-up policy
3. The scale-up policy sets the desired count to 1 (or more based on configuration)
4. When the queue is empty for 5 consecutive evaluation periods, the "queue-empty" alarm triggers the scale-down policy
5. The scale-down policy sets the desired count to 0, effectively scaling to zero when there's no work to do

This approach allows the worker service to scale based on workload while minimizing costs during idle periods.

## Ultra-Cost-Optimized Infrastructure

The ultra-cost-optimized infrastructure is designed for development environments or scenarios where minimizing costs is the primary concern.

### Architecture Diagram

```
                                                  ┌────────────────┐
                                                  │ Lambda         │
                                                  │ Scheduler      │
                                                  └───────┬────────┘
                                                          │
                                                          ▼
┌─────────┐    ┌───────────────┐    ┌────────────────┐   ┌─────────┐
│   SQS   │───►│ EventBridge   │───►│ ECS Fargate    │◄──┤ Existing│
│  Queue  │    │ Pipes         │    │ Spot Task      │   │ VPC     │
└─────────┘    └───────────────┘    └────────────────┘   └─────────┘
                                            │
                                            ▼
                                     ┌─────────────┐
                                     │  External   │
                                     │  Database   │
                                     │             │
                                     └─────────────┘
```

### Key Components

1. **EventBridge Pipes**
   - Connects SQS to ECS Fargate tasks
   - Only launches tasks when messages are present in the queue
   - Zero-scale architecture with no idle costs

2. **Fargate Spot**
   - Uses spot pricing for up to 70% cost reduction
   - Configured with minimal CPU/memory resources

3. **External Database**
   - Uses external managed database (e.g., Render.com free tier)
   - Eliminates RDS costs for development

4. **Existing VPC**
   - Reuses existing VPC infrastructure
   - Uses public subnets for internet access without NAT Gateway costs

5. **Lambda Scheduler**
   - Serverless scheduling with minimal cost
   - Triggers workflows on a schedule

### EventBridge Pipes Zero-Scale Architecture

The ultra-cost-optimized infrastructure uses EventBridge Pipes to implement a true zero-scale architecture:

1. EventBridge Pipes monitors the SQS queue for messages
2. When a message arrives, EventBridge Pipes automatically launches an ECS Fargate Spot task
3. The task processes the message and then terminates
4. No tasks run when the queue is empty, resulting in zero compute costs during idle periods

This approach eliminates the need for CloudWatch alarms and autoscaling policies, providing a simpler and more cost-effective solution for development environments.


## Cost Optimization Features

### Standard Infrastructure
- Scale-to-zero capability for worker service
- Configurable instance sizes based on environment
- Optional NAT Instance instead of NAT Gateway
- Single NAT Gateway option for development

### Ultra-Cost-Optimized Infrastructure
- True zero-scale architecture with EventBridge Pipes
- Fargate Spot for 70% cost reduction
- Minimal CPU/memory allocation
- No NAT Gateway costs
- External database to eliminate RDS costs
- Serverless Lambda scheduler

## Conclusion

The Flow Builder infrastructure provides flexible deployment options to meet different needs:

- Use the **Standard Scalable Infrastructure** for production environments where reliability, scalability, and comprehensive monitoring are essential.
- Use the **Ultra-Cost-Optimized Infrastructure** for development environments where minimizing costs is the primary concern.

Both options support the same application functionality while offering different trade-offs between cost, reliability, and scalability.
