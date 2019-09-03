FROM qtangs/sagemaker-notebook:python3

# ==================================================================
# Create environment(s)
# ------------------------------------------------------------------

USER $NB_UID

RUN $HOME/envs/create_env_file.sh mxnet_p36 && \
    $HOME/envs/create_env.sh mxnet_p36