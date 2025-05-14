FROM public.ecr.aws/lambda/python:3.12

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy requirements file
COPY scheduler_lambda/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy function code
COPY scheduler_lambda/handler.py .

# Copy shared code
COPY shared/ ./shared/

# Set the CMD to your handler
CMD [ "handler.lambda_handler" ]
