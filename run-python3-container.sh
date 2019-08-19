#!/bin/bash

docker run -t --name=sagemaker-notebook-container && \
           -p 8888:8888 && \
           -e AWS_PROFILE=default-api && \
           -v ~/.aws:/home/ec2-user/.aws:ro && \
           -v ~/.ssh:/home/ec2-user/.ssh:ro && \
           -v /Users/foobar/projects/SageMaker:/home/ec2-user/SageMaker && \
           qtangs/sagemaker-notebook:python3

# Alternatively:
# docker-compose up sagemaker-notebook-container