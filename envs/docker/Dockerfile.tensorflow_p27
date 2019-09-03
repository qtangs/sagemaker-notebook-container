FROM qtangs/sagemaker-notebook-base

# ==================================================================
# Create environment(s)
# ------------------------------------------------------------------

USER $NB_UID

COPY . $HOME/envs/

# Fix permissions on $HOME/envs/ as root
USER root
RUN fix-permissions $HOME/envs/

USER $NB_UID

RUN $HOME/envs/create_env_file.sh tensorflow_p27 && \
    $HOME/envs/create_env.sh tensorflow_p27