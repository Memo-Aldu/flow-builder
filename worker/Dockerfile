FROM mcr.microsoft.com/playwright/python:v1.51.0-noble

WORKDIR /app

# Copy the Worker code
COPY ./worker /app/worker

# Copy the shared code
COPY ./shared /app/shared

# Copy worker requirements
COPY ./worker/requirements.txt /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_HEADLESS=1 \
    POLLING_MODE=false \
    EVENTBRIDGE_PIPES_MODE=true \
    BATCH_SIZE=1 \
    MAX_POLL_MESSAGES=1 \
    POLL_WAIT_TIME=20 \
    MAX_EXECUTION_TIME_SECONDS=240 \
    EXIT_AFTER_COMPLETION=true

# Make start.sh executable
RUN chmod +x /app/worker/start.sh

# Use the start script
CMD ["/bin/bash", "/app/worker/start.sh"]