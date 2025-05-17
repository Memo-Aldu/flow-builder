FROM mcr.microsoft.com/playwright/python:v1.51.0-noble

WORKDIR /app

# Copy requirements first for better layer caching
COPY ./worker/requirements.txt /app

# Install dependencies and browsers
RUN pip install --no-cache-dir -r requirements.txt && \
    python -m playwright install chromium && \
    python -m playwright install-deps chromium

# Copy the Worker code
COPY ./worker /app/worker

# Copy the shared code
COPY ./shared /app/shared

# Set environment variables
ENV PYTHONPATH=/app
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Run in headless mode
ENV PLAYWRIGHT_HEADLESS=1

CMD ["python", "worker/main.py"]
