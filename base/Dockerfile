# ==================================================================
# Container mimicking SageMaker noteboook instance
# ------------------------------------------------------------------

ARG UBUNTU_VERSION=18.04
FROM ubuntu:${UBUNTU_VERSION}

ARG MINICONDA_VERSION=4.5.12
ARG CONDA_VERSION=4.5.12



# ==================================================================
# From Jupyter's base-notebook
# https://hub.docker.com/r/jupyter/base-notebook/dockerfile
# ### Modifications are commented with '###'
# ------------------------------------------------------------------

### Use ec2-user as the main user, just like the SageMaker Notebook instance ###
ENV NB_USER="ec2-user" \
    NB_UID="500" \
    NB_GID="500"

USER root

# Install all OS dependencies for notebook server that starts but lacks all
# features (e.g., download as all possible file formats)
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -yq dist-upgrade \
 && apt-get install -yq --no-install-recommends \
    wget \
    bzip2 \
    ca-certificates \
    sudo \
    locales \
    fonts-liberation \
    run-one \
 && rm -rf /var/lib/apt/lists/*

RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen

# Configure environment
ENV CONDA_DIR=/home/$NB_USER/anaconda3 \
    SHELL=/bin/bash \
    NB_USER=$NB_USER \
    NB_UID=$NB_UID \
    NB_GID=$NB_GID \
    LC_ALL=en_US.UTF-8 \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8
ENV PATH=$CONDA_DIR/bin:$PATH \
    HOME=/home/$NB_USER

# Add a script that we will use to correct permissions after running certain commands
COPY utils/jupyter/fix-permissions /usr/local/bin/fix-permissions

# Enable prompt color in the skeleton .bashrc before creating the default NB_USER
RUN sed -i 's/^#force_color_prompt=yes/force_color_prompt=yes/' /etc/skel/.bashrc

# Create NB_USER wtih name jovyan user with UID=1000 and in the 'users' group
# and make sure these dirs are writable by the `users` group.
RUN echo "auth requisite pam_deny.so" >> /etc/pam.d/su && \
    sed -i.bak -e 's/^%admin/#%admin/' /etc/sudoers && \
    sed -i.bak -e 's/^%sudo/#%sudo/' /etc/sudoers && \
    ### Add a group with the same name as the user ###
    groupadd -g $NB_GID $NB_USER && \
    useradd -m -s /bin/bash -u $NB_UID -g $NB_GID $NB_USER && \
    mkdir -p $CONDA_DIR && \
    chown $NB_USER:$NB_GID $CONDA_DIR && \
    chmod g+w /etc/passwd && \
    fix-permissions $HOME && \
    fix-permissions "$(dirname $CONDA_DIR)"

### Allow NB_USER to use sudo without password ###
RUN echo "$NB_USER ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers.d/$NB_USER

USER $NB_UID
WORKDIR $HOME

# Install conda as jovyan and check the md5 sum provided on the download site
### Take conda version from ARG instead of hardcoding it here ###
#ENV MINICONDA_VERSION=4.6.14 \
#    CONDA_VERSION=4.7.10

COPY utils/miniconda-md5 /tmp/miniconda-md5/

RUN cd /tmp && \
    wget --quiet https://repo.continuum.io/miniconda/Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh && \
    ### use the corresponding md5 file in miniconda-md5 folder to check the md5 sum ###
    echo "$(cat miniconda-md5/Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh.md5) *Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh" | md5sum -c - && \
    /bin/bash Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh -f -b -p $CONDA_DIR && \
    rm Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh && \
    echo "conda ${CONDA_VERSION}" >> $CONDA_DIR/conda-meta/pinned && \
    $CONDA_DIR/bin/conda config --system --prepend channels conda-forge && \
    $CONDA_DIR/bin/conda config --system --set auto_update_conda false && \
    $CONDA_DIR/bin/conda config --system --set show_channel_urls true && \
    $CONDA_DIR/bin/conda install --quiet --yes conda && \
    $CONDA_DIR/bin/conda update --all --quiet --yes && \
    conda list python | grep '^python ' | tr -s ' ' | cut -d '.' -f 1,2 | sed 's/$/.*/' >> $CONDA_DIR/conda-meta/pinned && \
    conda clean --all -y && \
    rm -rf /home/$NB_USER/.cache/yarn && \
    fix-permissions $CONDA_DIR && \
    fix-permissions /home/$NB_USER

# Install Tini
RUN conda install --quiet --yes 'tini=0.18.0' && \
    conda list tini | grep tini | tr -s ' ' | cut -d ' ' -f 1,2 >> $CONDA_DIR/conda-meta/pinned && \
    conda clean --all -y && \
    fix-permissions $CONDA_DIR && \
    fix-permissions /home/$NB_USER

ARG JUPYTER_NB_VERSION=6.0.0
ARG JUPYTER_LAB_VERSION=1.0.4

# Install Jupyter Notebook, Lab, and Hub
# Generate a notebook server config
# Cleanup temporary files
# Correct permissions
# Do all this in a single RUN command to avoid duplicating all of the
# files across image layers when the permissions change
### skip Jupyter Hub for now ###
RUN conda install --quiet --yes \
    "notebook=$JUPYTER_NB_VERSION" \
    #'jupyterhub=1.0.0' \
    "jupyterlab=$JUPYTER_LAB_VERSION" && \
    conda clean --all -y && \
    # npm cache clean --force && \
    jupyter notebook --generate-config && \
    rm -rf $CONDA_DIR/share/jupyter/lab/staging && \
    rm -rf /home/$NB_USER/.cache/yarn && \
    fix-permissions $CONDA_DIR && \
    fix-permissions /home/$NB_USER



# ==================================================================
# From Jupyter's minimal-notebook
# https://hub.docker.com/r/jupyter/minimal-notebook/dockerfile
# ### Modifications are commented with '###'
# ------------------------------------------------------------------

USER root

# Install all OS dependencies for fully functional notebook server
### Comment out large packages and move them to INSTALL_OPTIONAL_PACKAGES section ###
RUN apt-get update && apt-get install -yq --no-install-recommends \
    build-essential \
    # emacs \
    git \
    # inkscape \
    jed \
    libsm6 \
    libxext-dev \
    libxrender1 \
    lmodern \
    netcat \
    pandoc \
    python-dev \
    # texlive-fonts-extra \
    texlive-fonts-recommended \
    texlive-generic-recommended \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-xetex \
    tzdata \
    unzip \
    nano \
    && rm -rf /var/lib/apt/lists/*



# ==================================================================
# Install ffmpeg for matplotlib anim
# Copy from https://hub.docker.com/r/jupyter/scipy-notebook/dockerfile
# ------------------------------------------------------------------

USER root

# ffmpeg for matplotlib anim
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*



# ==================================================================
# Set up Conda Tab
# ------------------------------------------------------------------

USER $NB_UID

RUN conda install --yes 'nb_conda=2.2.1' && \
    conda clean --all -y && \
    jupyter nbextension install nb_conda --py --sys-prefix --symlink && \
    jupyter nbextension enable nb_conda --py --sys-prefix && \
    jupyter serverextension enable nb_conda --py --sys-prefix

# Fix bug: https://github.com/Anaconda-Platform/nb_conda/issues/66
RUN sed -ie "s/\(for env in info.'envs'.\)/\1 if env != root_env['dir']/g" $CONDA_DIR/lib/python*/site-packages/nb_conda/envmanager.py

# Disable auto detection of new Conda envs
RUN python -m nb_conda_kernels.install --disable



# ==================================================================
# Set up SageMaker Examples Tab
# ------------------------------------------------------------------

USER $NB_UID

RUN conda install --yes 'nbexamples' && \
    conda clean --all -y && \
    jupyter nbextension install --py nbexamples --sys-prefix && \
    jupyter nbextension enable --py nbexamples --sys-prefix && \
    jupyter serverextension enable --py nbexamples --sys-prefix

# Use nbexamples from SageMaker
COPY utils/nbexamples-sagemaker $CONDA_DIR/lib/python3.7/site-packages/nbexamples/
COPY utils/nbexamples-sagemaker/static $CONDA_DIR/share/jupyter/nbextensions/nbexamples/

ENV SAMPLE_NOTEBOOKS_DIR=$HOME/sample-notebooks

# Copy script to set up examples
COPY utils/sample-notebooks $SAMPLE_NOTEBOOKS_DIR

# Fix permissions on $SAMPLE_NOTEBOOKS_DIR as root
USER root
RUN fix-permissions $SAMPLE_NOTEBOOKS_DIR

USER $NB_UID

# Download examples
RUN $SAMPLE_NOTEBOOKS_DIR/update_examples.sh



# ==================================================================
# Add Git to JupyterLab
# ------------------------------------------------------------------

USER root

# Install openssh-client for git connection using SSH
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssh-client && \
    rm -rf /var/lib/apt/lists/*

USER $NB_UID

RUN conda install --yes "jupyterlab-git" && \
    conda clean --all -y && \
    jupyter labextension install @jupyterlab/git && \
    jupyter serverextension enable --py jupyterlab_git && \
    npm cache clean --force



# ==================================================================
# Install other important tools including docker cli, awscli
# docker installation guide: https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-using-the-repository
# ------------------------------------------------------------------

USER $NB_UID

ARG DOCKER_VERSION=19.03.1

# Install Docker cli, the actual docker daemon is expected to be running on host with a mount of /var/run/docker.sock
RUN cd /tmp && \
    export CODE_NAME=$(cat /etc/*-release | grep -oP "UBUNTU_CODENAME=\K\w+") && \
    wget https://download.docker.com/linux/ubuntu/dists/${CODE_NAME}/pool/stable/amd64/docker-ce-cli_${DOCKER_VERSION}~3-0~ubuntu-${CODE_NAME}_amd64.deb -O docker-ce-cli.deb && \
    sudo dpkg -i docker-ce-cli.deb && \
    rm -f docker-ce-cli.deb

# Allow $NB_USER to run docker without having to specify sudo everytime
RUN echo "alias docker='sudo /usr/bin/docker'" >> $HOME/.bashrc

RUN df -h

RUN pip install --no-cache-dir awscli



# ==================================================================
# Install optional packages (downside: these result in larger images)
# ------------------------------------------------------------------

USER root

# Optional packages, example: emacs inkscape texlive-fonts-extra
ARG INSTALL_OPTIONAL_PACKAGES

RUN if [ ! -z $INSTALL_OPTIONAL_PACKAGES]; then \
    apt-get update && apt-get install -yq --no-install-recommends $INSTALL_OPTIONAL_PACKAGES; \
    fi \
    && rm -rf /var/lib/apt/lists/*



# ==================================================================
# Start service
# ------------------------------------------------------------------

USER $NB_UID

ENV NOTEBOOK_DIR=$HOME/SageMaker

RUN mkdir $NOTEBOOK_DIR && \
    sed -ie "/^#c.NotebookApp.notebook_dir/c\c.NotebookApp.notebook_dir = '$NOTEBOOK_DIR'" ~/.jupyter/jupyter_notebook_config.py

# Add custom.js
COPY utils/custom $HOME/.jupyter/custom

# Add local files as late as possible to avoid cache busting
COPY utils/jupyter/start.sh /usr/local/bin/
COPY utils/jupyter/start-notebook.sh /usr/local/bin/
COPY utils/jupyter/start-singleuser.sh /usr/local/bin/
COPY utils/jupyter/jupyter_notebook_config.py /etc/jupyter/

# Fix permissions on /etc/jupyter as root
USER root
RUN fix-permissions /etc/jupyter/

USER $NB_UID

EXPOSE 8888

# Configure container startup
ENTRYPOINT ["tini", "-g", "--"]
CMD ["start-notebook.sh"]