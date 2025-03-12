#!/usr/bin/env bash
set -eo pipefail

echo "=== LocalStack Init Script: Creating resources ==="

AWS_REGION=${AWS_REGION:-us-east-1}
LAMBDA_NAME=${LAMBDA_NAME:-scheduler-lambda}
LAMBDA_HANDLER=${LAMBDA_HANDLER:-handler.lambda_handler}
LAMBDA_RUNTIME=${LAMBDA_RUNTIME:-python3.9}
ZIP_PATH=${ZIP_PATH:-/tmp/scheduler_lambda.zip.zip}

# 1) Create an SQS queue
echo "Creating SQS queue: flow-builder-queue"
awslocal sqs create-queue \
  --queue-name flow-builder-queue \
  --attributes VisibilityTimeout=30

# 2) Create a dummy IAM role for the Lambda
echo "Creating IAM role: lambda-execution-role"
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

awslocal iam create-role \
  --role-name lambda-execution-role \
  --assume-role-policy-document file:///tmp/trust-policy.json

# Attach minimal policy so Lambda can write logs & send SQS messages
cat > /tmp/lambda-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "*"
    }
  ]
}
EOF

awslocal iam put-role-policy \
  --role-name lambda-execution-role \
  --policy-name lambda-logs-sqs \
  --policy-document file:///tmp/lambda-policy.json

# 3) Create the Lambda function
echo "Creating Lambda function: $LAMBDA_NAME"
awslocal lambda create-function \
  --function-name $LAMBDA_NAME \
  --runtime $LAMBDA_RUNTIME \
  --zip-file fileb://$ZIP_PATH \
  --handler $LAMBDA_HANDLER \
  --role arn:aws:iam::000000000000:role/lambda-execution-role \
  --environment "Variables={DB_HOST=postgres,DB_PORT=5432,DB_USER=root,DB_PASSWORD=rootpassword,DB_NAME=flow-builder}"


# 4) Create an EventBridge rule that runs every minute
echo "Creating EventBridge rule: every-minute"
RULE_ARN=$(awslocal events put-rule \
  --name "every-minute" \
  --schedule-expression "cron(0/1 * * * ? *)" \
  --query 'RuleArn' \
  --output text)

# 5) Attach the Lambda as a target to that rule
awslocal events put-targets \
  --rule "every-minute" \
  --targets "Id"="1","Arn"="arn:aws:lambda:$AWS_REGION:000000000000:function:${LAMBDA_NAME}"

# 6) Permit EventBridge to invoke the Lambda
awslocal lambda add-permission \
  --function-name $LAMBDA_NAME \
  --statement-id allowEventBridge \
  --action "lambda:InvokeFunction" \
  --principal events.amazonaws.com \
  --source-arn "$RULE_ARN"

echo "=== LocalStack init done! ==="
