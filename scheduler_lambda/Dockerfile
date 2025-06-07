FROM --platform=linux/amd64 public.ecr.aws/lambda/python:3.12

COPY scheduler_lambda/requirements.txt ${LAMBDA_TASK_ROOT}/

RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Copy function code
COPY scheduler_lambda/handler.py ${LAMBDA_TASK_ROOT}/

# Copy shared code
COPY shared/ ${LAMBDA_TASK_ROOT}/shared/

CMD [ "handler.lambda_handler" ]
