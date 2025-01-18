# FlowBuilder Infrastructure

This directory contains infrastructure-related code and configuration for local development and deployment, including Terraform and Docker Compose.

---

## Local Development with Docker Compose

The `docker-compose.yml` file in this directory allows you to spin up essential local infrastructure services like PostgreSQL and LocalStack for development and testing.

### **Services**
- **PostgreSQL**: A relational database for storing application data.
- **LocalStack**: A fully functional local AWS cloud stack to emulate AWS services such as SQS, S3, and Secrets Manager.

---

### **Usage**

#### **Step 1: Start the Services**
Run the following command to start the containers in the background:
```bash
docker-compose up -d
```

This will start the following services:
1. **PostgreSQL**: Accessible on `localhost:5432`.
2. **LocalStack**: Accessible on `http://localhost:4566`.

#### **Step 2: Test Connectivity**
- **PostgreSQL**: Verify the connection to the database using a client like DBeaver or the `psql` command-line tool:
  ```
  Host: localhost
  Port: 5432
  Database: flow-builder
  Username: root
  Password: rootpassword
  ```
  Example using `psql`:
  ```bash
  psql -h localhost -U myuser -d mydb
  ```

- **LocalStack**: Use the AWS CLI or `awslocal` to interact with LocalStack. For example:
  - Create a test SQS queue:
    ```bash
    awslocal sqs create-queue --queue-name test-queue
    ```
  - List queues:
    ```bash
    awslocal sqs list-queues
    ```

#### **Step 3: Stop the Services**
To stop the running containers:
```bash
docker-compose down
```
This will stop and remove the containers but preserve the data in the named volumes (`postgres_data` and `localstack_data`).

---

### **Configuration**

#### **PostgreSQL**
- The database credentials and other settings are defined in the `docker-compose.yml` file:
  ```yaml
  POSTGRES_USER: myuser
  POSTGRES_PASSWORD: mypassword
  POSTGRES_DB: mydb
  ```

#### **LocalStack**
- Services enabled in LocalStack are specified in the `docker-compose.yml` file:
  ```yaml
  SERVICES=sqs,secretsmanager,s3
  ```

---

### **Common Issues**

#### Error: `The security token included in the request is invalid`
When using AWS CLI with LocalStack, configure dummy credentials to bypass this error:
```bash
aws configure
# Use the following:
AWS Access Key ID: test
AWS Secret Access Key: test
Default region name: us-east-1
Default output format: json
```

---

### **Clean Up**
To completely clean up all resources, including the data volumes, use:
```bash
docker-compose down --volumes
```