#!/bin/bash

if [[ "$#" -ne 1 ]]; then
    echo "Usage: $0 ENVIRONMENT_NAMES" >&2
    exit 1
fi

export envs=$1

pushd "$(dirname "$0")" || exit 1

if [[ $envs == "ALL" ]]; then
    for env_file in *.yml; do
        export env_name=$(grep -oP 'name: \K([\w-]+)' $env_file)
        ./create_env.sh $env_name
    done
elif [[ $envs != "NONE" ]]; then
    # Ensure all environment names are valid before creating any of them
    for env_name in ${envs//,/ }; do
        if [[ ! -f $env_name.yml ]]; then
            echo "The file $env_name.yml does not exist. Verify that environment name is correct: $env_name" >&2
            exit 1
        fi
    done
    for env_name in ${envs//,/ }; do
        ./create_env.sh $env_name
    done
fi

popd