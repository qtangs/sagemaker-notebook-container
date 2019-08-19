#!/bin/bash

if [[ "$#" -ne 1 ]]; then
    echo "Usage: $0 ENVIRONMENT_FILE" >&2
    exit 1
fi

export env_file=$1
export env_name=$(grep -oP 'name: \K([\w-]+)' $env_file)

echo "Creating $env_name environment using $env_file:"
cat $env_file
echo ""

conda env create --file $env_file
source activate $env_name
python -m ipykernel install --user --name conda_$env_name
source deactivate