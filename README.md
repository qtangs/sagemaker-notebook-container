# Amazon SageMaker Notebook Container

SageMaker Notebook Container is a sandboxed local environment that replicates the [Amazon Sagemaker Notebook Instance](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html), 
including installed software and libraries, file structure and permissions, environment variables, context objects and behaviors. 

* [Background](#background)
* [Prerequisites](#prerequisites)
* [Run Container](#run-container)
  * [Using `docker`](#using-docker)
  * [Using `docker-compose`](#using-docker-compose)
  * [Accessing Jupyter Notebook](#accessing-jupyter-notebook)
* [Optional additions](#optional-additions)
  * [Docker CLI](#docker-cli)
  * [Git integration](#git-integration)
  * [Shared `SageMaker` directory](#shared-sagemaker-directory)
* [Sample scripts](#sample-scripts)


## Background
Amazon SageMaker provides an AWS-hosted Notebook instance, a notably convenient way for any data scientists or developers to access a complete server for working with Amazon SageMaker.

Nonetheless, it costs money, requires all data to be uploaded online, requires Internet access and especially AWS Console sign-in, and can be difficult to customize.

To overcome these drawbacks, this Docker container has been created to offer a similar setup usable locally on a laptop/desktop.

The replicated features include full Jupyter Notebook and Lab server, multiple kernels, AWS & SageMaker SDKs, AWS and Docker CLIs, Git integration, Conda and SageMaker Examples Tabs.

The AWS-hosted instance and the local container aren't mutually exclusive and should be used together to enhance the data science experience.

A detailed write-up on the rationale behind this container can be found on [Medium](https://towardsdatascience.com/run-amazon-sagemaker-notebook-locally-with-docker-container-8dcc36d8524a).

#### Why Docker image?
The most important aim is to achieve a repeatable setup that can be replicated in any laptop or server.

Most features can be replicated by installing and configuring your laptop/desktop directly.

However, this comes at a cost of maintenance headache, each time the libraries and tools are upgraded, you have to manage those upgrades yourselves.

Additionally, if you work in a team, different machines are set up differently, leading to incompatibility issues, what works in 1 machine may not work in another.


## Prerequisites

#### Docker

At the minimum, you'll need [Docker](https://docs.docker.com/install/#supported-platforms) engine installed.

#### AWS Credentials
For AWS SDK and CLI to work, you need to have AWS Credentials configured in the notebook.

It's recommended to have AWS Credentials configured on your local machine 
so that you can use the same for the container (via volume mount) 
and avoid the need to configure every time the container starts.

1. First install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) on your machine.
2. Then configure the [AWS Credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html#cli-quick-configuration-multi-profiles) using your Access Key ID and Secret Access Key. 
It's recommended to specify a profile name when configuring this, in case you have many accounts or many different user profiles in future:
```bash
aws configure --profile default-api
```
3. Note the profile name you have specified, it should be used as the value of the environment variable AWS_PROFILE for the container.

When running a container later on, you just need to add this volume mount `-v ~/.aws:/home/ec2-user/.aws:ro` (For Windows, replace `~` with `%USERPROFILE%`).


## Run Container

#### Using `docker`
The simplest way to start the `sagemaker-notebook-container` is to use `docker run` command:

**Unix:**
```bash
export CONTAINER_NAME=sagemaker-notebook-container
export IMAGE_NAME=qtangs/sagemaker-notebook:tensorflow-p36
export WORKDDIR=/home/ec2-user
export AWS_PROFILE=default-api

docker run -t --name=${CONTAINER_NAME} \
           -p 8888:8888 \
           -e AWS_PROFILE=${AWS_PROFILE} \
           -v ~/.aws:${WORKDDIR}/.aws:ro \
           ${IMAGE_NAME} 
```

**Windows:**
```bat
set CONTAINER_NAME=sagemaker-notebook-container
set IMAGE_NAME=qtangs/sagemaker-notebook:tensorflow-p36
set WORKDDIR=/home/ec2-user
set AWS_PROFILE=default-api

docker run -t --name=%CONTAINER_NAME% ^
           -p 8888:8888 ^
           -e AWS_PROFILE=%AWS_PROFILE% ^
           -v %USERPROFILE%/.aws:%WORKDDIR%/.aws:ro ^
           %IMAGE_NAME%
```
*(Replace `default-api` with the appropriate profile name from your own `~/.aws/credentials`)*

#### Using `docker-compose`
If you have [Docker Compose](https://docs.docker.com/compose/install/) (already included in [Docker Desktop](https://docs.docker.com/install/#supported-platforms) for Windows and Mac),
you can use `docker-compose.yml` file so that you don't have to type the full docker run command.

```yaml
# docker-compose.yml
version: "3"
services:
  sagemaker-notebook-container:
    image: qtangs/sagemaker-notebook:tensorflow-p36
    container_name: sagemaker-notebook-container
    ports:
      - 8888:8888
    environment:
      AWS_PROFILE: 'default-api'
    volumes:
      - ~/.aws:/home/ec2-user/.aws:ro                    # For AWS Credentials
```
*(For Windows, replace `~` with `${USERPROFILE}`)*

*(Replace `default-api` with the appropriate profile name from your own `~/.aws/credentials`)*

With that, you can simply run this each time:
```bash
docker-compose up
```
or
```bash
docker-compose up sagemaker-notebook-container
```


#### Accessing Jupyter Notebook
You should see the following output, simply click on the `http://127.0.0.1:8888/...` link
(or copy paste to your browser) to access Jupyter:
```text
[I 03:10:12.757 NotebookApp] Writing notebook server cookie secret to /home/ec2-user/.local/share/jupyter/runtime/notebook_cookie_secret
[I 03:10:13.335 NotebookApp] JupyterLab extension loaded from /home/ec2-user/anaconda3/lib/python3.7/site-packages/jupyterlab
[I 03:10:13.335 NotebookApp] JupyterLab application directory is /home/ec2-user/anaconda3/share/jupyter/lab
[I 03:10:13.352 NotebookApp] [nb_conda] enabled
[I 03:10:13.373 NotebookApp] Serving notebooks from local directory: /home/ec2-user/SageMaker
[I 03:10:13.373 NotebookApp] The Jupyter Notebook is running at:
[I 03:10:13.373 NotebookApp] http://02b8db3c9e73:8888/?token=a22fc474c429a74650cb9ce74faf0ef2eedee182fc2eddec
[I 03:10:13.373 NotebookApp]  or http://127.0.0.1:8888/?token=a22fc474c429a74650cb9ce74faf0ef2eedee182fc2eddec
[I 03:10:13.373 NotebookApp] Use Control-C to stop this server and shut down all kernels (twice to skip confirmation).
```

## Optional additions

#### Docker CLI
Many SageMaker examples use docker to build custom images for training.

Instead of installing a full Docker on Docker, which is a complex operation, these images make use of the host's Docker Engine instead. 

To achieve that, the Docker CLI is already installed on the base image and the Docker socket of the host machine is used to connect the host's Docker Engine. 

This is achieved by including  when running the container.

```bash
-v /var/run/docker.sock:/var/run/docker.sock:ro
```

*(For Windows, update the mount to: `-v //var/run/docker.sock:/var/run/docker.sock:ro`)*

#### Git Integration
Git is installed on the base image to allow git access directly from the container. 

Furthermore, the [jupyterlab-git](https://github.com/jupyterlab/jupyterlab-git) extension is installed on Jupyter Lab for quick GUI interaction with Git.

If you use connect to Git repository using SSH, then you need to mount the `.ssh` folder:
```bash
-v ~/.ssh:/home/ec2-user/.ssh:ro
```

*(For Windows, replace `~` with `${USERPROFILE}`)*

#### Shared `SageMaker` directory
To save all work created in the container, mount a directory to act as the `SageMaker` directory under `/home/ec2-user`:
```bash
-v /Users/foobar/projects/SageMaker:/home/ec2-user/SageMaker
```
*(Replace `/Users/foobar/projects/SageMaker` with the appropriate folder from your own machine)*

## Sample scripts
Following sample scripts have been provided to show an example of running a container using `qtangs/sagemaker-notebook:python3` image:
1. `run-python3-container.sh`:
```bash
docker run -t --name=sagemaker-notebook-container && \
           -p 8888:8888 && \
           -e AWS_PROFILE=default-api && \
           -v ~/.aws:/home/ec2-user/.aws:ro && \
           -v ~/.ssh:/home/ec2-user/.ssh:ro && \
           -v /Users/foobar/projects/SageMaker:/home/ec2-user/SageMaker && \
           qtangs/sagemaker-notebook:python3
```
2. `docker-compose.yml`:
```yaml
version: "3"
services:
  sagemaker-notebook-container:
    image: qtangs/sagemaker-notebook:python3
    container_name: sagemaker-notebook-container
    ports:
      - 8888:8888
    environment:
      AWS_PROFILE: "default-api"
    volumes:
      - ~/.aws:/home/ec2-user/.aws:ro                    # For AWS Credentials
      - ~/.ssh:/home/ec2-user/.ssh:ro                    # For Git Credentials
      - /var/run/docker.sock:/var/run/docker.sock:ro     # For Docker CLI
      - /Users/foobar/projects/SageMaker:/home/ec2-user/SageMaker    # For saving work in a host directory
```
*(Replace `/Users/foobar/projects/SageMaker` with the appropriate folder from your own machine)*

With that, the container can be started using:
```bash
docker-compose up sagemaker-notebook-container
```
