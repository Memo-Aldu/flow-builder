FROM python:3.10-slim

WORKDIR /app

# Copy the API code
COPY ./api /app/api

# Copy the shared code
COPY ./shared /app/shared

# Copy the API requirements
COPY ./api/requirements.txt /app

RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
