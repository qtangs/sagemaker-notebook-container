## Description
Custom scripts to create 1 or multiple Conda's environments based on a set of YAML files. Currently included: `python2.yml`, `python3.yml`, `mxnet_p36.yml`, `tensorflow_p36.yml`.

These scripts are copied to `/home/ec2-users/envs` folder so that if users can use them to add more environments after the container starts.

Currently only these packages are included, others can be added manually for now:
* `ipykernel`
* `ipython`
* `ipywidgets`
* `jsonschema`
* `matplotlib`
* `numpy`
* `pandas`
* `seaborn`
* `scikit-learn`
* `scipy`