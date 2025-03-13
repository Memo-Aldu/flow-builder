FROM mcr.microsoft.com/playwright/python:v1.49.1-noble 

WORKDIR /app

# Copy the Worker code
COPY ./worker /app/worker

# Copy the shared code
COPY ./shared /app/shared

# Copy worker requirements
COPY ./worker/requirements.txt /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app

CMD ["python", "worker/main.py"]
