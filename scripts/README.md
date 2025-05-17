# RDS Access via SSM Tunnel

This directory contains scripts to help you access your RDS instance securely through AWS Systems Manager (SSM) and SSH tunneling.

## Prerequisites

1. AWS CLI installed and configured with appropriate credentials
2. AWS Session Manager plugin installed
3. PostgreSQL client installed locally

## Installation

### AWS CLI

If you don't have the AWS CLI installed, follow the instructions at:
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

### Session Manager Plugin

Install the Session Manager plugin for your operating system:

**Windows**:
1. Download the installer: https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe
2. Run the installer

**macOS**:
```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/sessionmanager-bundle.zip" -o "sessionmanager-bundle.zip"
unzip sessionmanager-bundle.zip
sudo ./sessionmanager-bundle/install -i /usr/local/sessionmanagerplugin -b /usr/local/bin/session-manager-plugin
```

**Linux**:
```bash
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
sudo yum install -y session-manager-plugin.rpm
```

### PostgreSQL Client

**Windows**:
Install from: https://www.postgresql.org/download/windows/

**macOS**:
```bash
brew install postgresql
```

**Linux**:
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

## Usage

1. Make the script executable:
   ```bash
   chmod +x rds-tunnel.sh
   ```

2. Run the script:
   ```bash
   ./rds-tunnel.sh dev 5432
   ```
   
   Where:
   - `dev` is the environment (dev, staging, prod)
   - `5432` is the local port to forward to (default is 5432)

3. Connect to the database using your PostgreSQL client:
   ```bash
   psql -h localhost -p 5432 -U workflow_app -d workflow_app
   ```

4. To stop the tunnel, press Ctrl+C in the terminal where the script is running.

## Troubleshooting

1. **Error: Bastion instance not found or not running**
   - Verify that the bastion instance is deployed and running
   - Check your AWS credentials and region

2. **Error: RDS instance not found**
   - Verify that the RDS instance is deployed and running
   - Check your AWS credentials and region

3. **Connection refused**
   - Verify that the security group rules allow the bastion to access the RDS instance
   - Check that the RDS instance is running

4. **Permission denied**
   - Verify that your IAM user has the necessary permissions to use SSM
   - Ensure the bastion instance has the AmazonSSMManagedInstanceCore policy attached
