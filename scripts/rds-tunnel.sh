#!/bin/bash

# Script to establish an SSH tunnel to RDS through SSM
# Usage: ./rds-tunnel.sh <environment> <local_port>
# Example: ./rds-tunnel.sh dev 5432

# Default values
ENV=${1:-dev}
LOCAL_PORT=${2:-5432}
REMOTE_PORT=5432

# Get the bastion instance ID
BASTION_NAME="workflow-build-${ENV}-bastion"
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=${BASTION_NAME}" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" == "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "Error: Bastion instance not found or not running."
  exit 1
fi

# Get the RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --filters "Name=tag:Environment,Values=${ENV}" \
  --query "DBInstances[0].Endpoint.Address" \
  --output text)

if [ "$RDS_ENDPOINT" == "None" ] || [ -z "$RDS_ENDPOINT" ]; then
  echo "Error: RDS instance not found."
  exit 1
fi

echo "Starting SSH tunnel to RDS through SSM..."
echo "Bastion instance: $INSTANCE_ID"
echo "RDS endpoint: $RDS_ENDPOINT"
echo "Local port: $LOCAL_PORT"
echo "Remote port: $REMOTE_PORT"
echo ""
echo "Connect to the database using:"
echo "  psql -h localhost -p $LOCAL_PORT -U <username> -d <dbname>"
echo ""
echo "Press Ctrl+C to stop the tunnel."
echo ""

# Start the SSH tunnel through SSM
aws ssm start-session \
  --target $INSTANCE_ID \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"$REMOTE_PORT\"], \"localPortNumber\":[\"$LOCAL_PORT\"]}"
