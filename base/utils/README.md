## Description
These are utility folders used during Docker image build:

1. `custom`: Contains `custom.js` to modify Jupyter's Notebook UI, in this case to add **Open JupyterLab button** link.
2. `envs`: Custom scripts to create 1 or multiple Conda's environments based on a set of YAML files. Currently included: `python2.yml`, `python3.yml`, `mxnet_p36.yml`, `tensorflow_p36.yml`.
3. `jupyter`: Jupyter's utilities copied from [https://github.com/jupyter/docker-stacks/tree/master/base-notebook]
4. `miniconda-md5`: Contains md5 signatures of different versions of the file Miniconda-*.sh downloaded from [https://repo.continuum.io/miniconda]
5. `nbexamples-sagemaker`: Contains custom nbexamples code copied from SageMaker's Notebook instance. These are responsible for the **SageMaker Examples** tab.
6. `sample-notebooks`: Contains a script to download examples from AWS's [SageMaker examples](https://github.com/awslabs/amazon-sagemaker-examples) and, in the future, other sources.