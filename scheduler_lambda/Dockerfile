FROM public.ecr.aws/lambda/python:3.12

# Copy function code
COPY scheduler_lambda/handler.py ${LAMBDA_TASK_ROOT}/

# Copy shared code
COPY shared/ ${LAMBDA_TASK_ROOT}/shared/

# Copy requirements file
COPY scheduler_lambda/requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Set the CMD to your handler
CMD [ "handler.lambda_handler" ]
