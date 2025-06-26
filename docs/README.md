# Flow Builder Documentation

Welcome to the comprehensive documentation for Flow Builder, a powerful workflow automation platform. This documentation is organized to help you understand, deploy, and contribute to the system.

## Documentation Overview

### System Architecture & Design

**[System Architecture](ARCHITECTURE.md)**
- Complete system overview and component interaction
- High-level architecture diagrams
- Core components and their responsibilities
- Scalability and performance considerations
- Monitoring and observability

**[Workflow System](WORKFLOW_SYSTEM.md)**
- Detailed workflow execution flow
- Scheduling system with cron expressions
- Lambda-SQS-Fargate pipeline
- Node execution system
- Error handling and monitoring

**[Infrastructure](INFRASTRUCTURE.md)**
- AWS services and Terraform modules
- Standard vs ultra-cost-optimized deployments
- Cost optimization strategies
- Security considerations
- Troubleshooting guide

### Development & Integration

**[Nodes & Integrations](NODES_AND_INTEGRATIONS.md)**
- All workflow node types
- Browser automation capabilities
- External service integrations (OpenAI, Twilio, Bright Data)
- Credit system and costs
- Usage examples

**[Authentication & Security](AUTHENTICATION_SECURITY.md)**
- Clerk authentication integration
- Guest access system
- Hybrid rate limiting
- Credential management
- Security best practices

### Component Documentation

**[API Service](../api/README.md)**
- FastAPI backend architecture
- API endpoints and documentation
- Environment configuration
- Deployment instructions

**[Frontend Application](../frontend/README.md)**
- Next.js React application
- Component architecture
- State management
- UI/UX features

**[Worker Service](../worker/README.md)**
- Workflow execution engine
- Browser automation setup
- Node execution modes
- Troubleshooting

**[Scheduler Lambda](../scheduler_lambda/README.md)**
- Workflow scheduling service
- Lambda function configuration
- EventBridge integration
- Monitoring

**[Infrastructure Setup](../infra/README.md)**
- Local development infrastructure
- Docker Compose configuration
- LocalStack setup
- Common issues

## Quick Navigation

### For New Developers
1. **Start Here**: [Developer Guide](DEVELOPER_GUIDE.md) - Complete setup instructions
2. **Understand the System**: [Architecture](ARCHITECTURE.md) - System overview
3. **Learn Workflows**: [Workflow System](WORKFLOW_SYSTEM.md) - How workflows work

### For DevOps/Infrastructure
1. **Infrastructure Overview**: [Infrastructure](INFRASTRUCTURE.md) - Deployment options
2. **Cost Optimization**: [Infrastructure](INFRASTRUCTURE.md#cost-optimization-strategies) - Save money
3. **Security**: [Authentication & Security](AUTHENTICATION_SECURITY.md) - Security features

### For Product/Business
1. **System Capabilities**: [Nodes & Integrations](NODES_AND_INTEGRATIONS.md) - What the system can do
2. **Use Cases**: [README](../README.md#use-cases--value-proposition) - Business value
3. **Architecture**: [Architecture](ARCHITECTURE.md) - Technical overview

### For Technical Recruiters
1. **Technology Stack**: [README](../README.md#technology-stack) - Technologies used
2. **System Scale**: [Architecture](ARCHITECTURE.md) - System complexity
3. **Code Quality**: [Developer Guide](DEVELOPER_GUIDE.md#code-quality) - Development practices

## Documentation Features

### Comprehensive Coverage
- **Complete System Documentation**: Every component and integration documented
- **Visual Diagrams**: Mermaid diagrams for architecture and flows
- **Code Examples**: Real implementation examples throughout
- **Configuration Details**: Complete environment and deployment configuration

### Developer-Friendly
- **Step-by-Step Guides**: Detailed setup and deployment instructions
- **Troubleshooting Sections**: Common issues and solutions
- **Best Practices**: Security, performance, and code quality guidelines
- **Contribution Guidelines**: How to contribute to the project

### Business-Oriented
- **Value Proposition**: Clear business benefits and use cases
- **Cost Analysis**: Detailed cost breakdowns and optimization strategies
- **Scalability Information**: How the system scales with business needs
- **Security Overview**: Enterprise-grade security features

## Documentation Standards

### Writing Guidelines
- **Clear and Concise**: Easy to understand for all technical levels
- **Well-Structured**: Logical organization with clear headings
- **Code Examples**: Practical examples for all concepts
- **Visual Aids**: Diagrams and charts where helpful

### Maintenance
- **Regular Updates**: Documentation updated with code changes
- **Version Control**: Documentation versioned with the codebase
- **Community Contributions**: Open to improvements and additions
- **Quality Assurance**: Regular reviews for accuracy and completeness

---

## Document Index

| Document | Purpose | Audience |
|----------|---------|----------|
| [Architecture](ARCHITECTURE.md) | System design and components | Developers, DevOps, Architects |
| [Workflow System](WORKFLOW_SYSTEM.md) | Workflow execution details | Developers, Product |
| [Infrastructure](INFRASTRUCTURE.md) | Deployment and AWS setup | DevOps, Infrastructure |
| [Nodes & Integrations](NODES_AND_INTEGRATIONS.md) | Feature capabilities | Product, Developers |
| [Authentication & Security](AUTHENTICATION_SECURITY.md) | Security features | Security, Developers |
| [API Service](../api/README.md) | Backend service | Backend Developers |
| [Frontend App](../frontend/README.md) | Frontend application | Frontend Developers |
| [Worker Service](../worker/README.md) | Execution engine | Developers |
| [Scheduler](../scheduler_lambda/README.md) | Scheduling service | Developers, DevOps |
| [Infrastructure Setup](../infra/README.md) | Local development | Developers |

