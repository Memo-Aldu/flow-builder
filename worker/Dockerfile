FROM python:3.10-slim

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
