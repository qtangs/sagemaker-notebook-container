#!/bin/bash

docker run -t --name=sagemaker-notebook-container && \
           -p 8888:8888 && \
           -e AWS_PROFILE=default-api && \
           -v ~/.aws:/home/ec2-user/.aws:ro && \                                 # For AWS Credentials
           -v ~/.ssh:/home/ec2-user/.ssh:ro && \                                 # For Git Credentials
           -v /var/run/docker.sock:/var/run/docker.sock:ro && \                  # For Docker CLI
           -v /Users/foobar/projects/SageMaker:/home/ec2-user/SageMaker && \     # For saving work in a host directory
           # -v .:/home/ec2-user/SageMaker/sagemaker-notebook-container  && \      # For testing
           qtangs/sagemaker-notebook:python3

# Alternatively:
# docker-compose up sagemaker-notebook-container