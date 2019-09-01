#!/bin/bash

if [[ "$#" -ne 1 ]]; then
    echo "Usage: $0 ENVIRONMENT_FILE" >&2
    exit 1
fi

pushd "$(dirname "$0")" || exit 1

export env_name=$1

if [[ -f env_exports/${env_name}.yml ]]; then
    echo "Creating environment file for '${env_name}'."

    python create_env_file.py ${env_name}
    echo "Environment file for '${env_name}' is created."

    source deactivate
else
    echo "There's no environment export for '${env_name}'."
fi

popd