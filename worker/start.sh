#!/bin/bash
set -e

# Check if we need to run in non-headless mode
if [ "$PLAYWRIGHT_HEADLESS" = "False" ]; then
    echo "Starting Xvfb for non-headless browser..."
    # Start Xvfb
    Xvfb :99 -screen 0 1280x1024x24 &
    export DISPLAY=:99

    # Wait for Xvfb to start
    sleep 2

    echo "Xvfb started successfully"
fi

# Ensure we're in the right directory
cd /app

# Check if SQS_BODY is set
if [ -n "$SQS_BODY" ]; then
    echo "SQS_BODY is set, processing message..."
    if [ "$DEBUG_MODE" = "true" ]; then
        echo "$SQS_BODY" > /tmp/sqs_message.json
        echo "Message saved to /tmp/sqs_message.json"
    fi
else
    echo "WARNING: SQS_BODY is not set. This might cause the worker to exit immediately."
    export SQS_BODY='{"dummy": true}'
fi

# Determine the worker mode
if [ "$POLLING_MODE" = "true" ]; then
    echo "Starting worker in SQS polling mode..."
    export POLLING_MODE=true
    export EVENTBRIDGE_PIPES_MODE=false
else
    echo "Starting worker in EventBridge Pipes mode..."
    export POLLING_MODE=false
    export EVENTBRIDGE_PIPES_MODE=true
fi

# Run the worker
echo "Starting worker..."
python -m worker.main

# Print exit status
EXIT_CODE=$?
echo "Worker exited with status $EXIT_CODE"
exit $EXIT_CODE
