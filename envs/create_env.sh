#!/bin/bash

if [[ "$#" -ne 1 ]]; then
    echo "Usage: $0 ENVIRONMENT_NAME" >&2
    exit 1
fi

pushd "$(dirname "$0")" || exit 1

export env_name=$1
export env_file=$env_name.yml
export env_name_from_file=$(grep -oP 'name: \K([\w-]+)' $env_file)

if [[ $env_name != $env_name_from_file ]]; then
    echo "Environment name '$env_name_from_file' in $env_name.yml does not match expected name '$env_name'." >&2
    exit 1
fi

echo "Creating $env_name environment using $env_file:"
cat $env_file
echo ""

conda env create --file $env_file
source activate $env_name
echo "Adding ipykernel conda_$env_name."
python -m ipykernel install --user --name conda_$env_name
source deactivate

popd