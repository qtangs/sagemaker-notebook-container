#!/bin/bash

pushd "$(dirname "$0")" || exit 1

while read env_name; do
    if source activate ${env_name} &> /dev/null ; then
        echo "Getting environment exports for '${env_name}'."

        conda env export > ${env_name}.yml
        pip freeze > ${env_name}_pip.txt

        echo "Environment exports for '${env_name}' have been saved."

        source deactivate
    else
        echo "There's no conda environment named '${env_name}'."
    fi
done < environment_list.txt

popd