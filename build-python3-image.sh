#!/bin/bash

docker build -t qtangs/sagemaker-notebook:python3 -f envs_docker/Dockerfile.python3 .

# Alternatively:
# docker-compose build sagemaker-notebook-container