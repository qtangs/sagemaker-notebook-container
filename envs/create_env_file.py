import collections
import re
import sys


def main():
    env_name = sys.argv[1]

    with open('env_exports/{0}.yml'.format(env_name), 'r') as f:
        conda_libs = f.read().strip()
        
        # Get the first few lines of the environment file to get name and channels
        start_lines = conda_libs[:conda_libs.index('dependencies')]

    with open('env_exports/{0}_pip.txt'.format(env_name), 'r') as f:
        # Change new line to space and add a space to the first line to enable searching for exact library names later
        pip_libs = f.read().strip().replace('\n',' ')
        pip_libs = ' {0}'.format(pip_libs)

    with open('include_libraries.txt', 'r') as f:
        libraries = f.readlines()

    python_version = re.search(r" python=([0-9\.]+)", conda_libs).group(1)

    conda_libraries = collections.OrderedDict()
    pip_libraries = collections.OrderedDict()

    for library in sorted(libraries):
        library = library.strip()
        if library != "":
            # Find library version from conda env, note the space before library name and single equal sign
            library_conda_version = None
            test = re.search(r" {0}=([0-9\.]+)".format(library), conda_libs)
            if test is not None:
                library_conda_version = test.group(1)

            # Find library version from pip freeze, note the space before library name and double equal signs
            library_pip_version = None
            test = re.search(r" {0}==([0-9\.]+)".format(library), pip_libs)
            if test is not None:
                library_pip_version = test.group(1)

            # Use the version from conda or pip if only 1 is present, if both are present, use the higher version
            if library_conda_version is not None and library_pip_version is None:
                conda_libraries[library] = library_conda_version

            elif library_conda_version is None and library_pip_version is not None:
                pip_libraries[library] = library_pip_version

            elif library_conda_version is not None and library_pip_version is not None:
                if version_compare(library_conda_version, library_pip_version) >= 0:
                    conda_libraries[library] = library_conda_version
                else:
                    pip_libraries[library] = library_pip_version

    write_env_file(env_name, start_lines, python_version, conda_libraries, pip_libraries)


def write_env_file(env_name, start_lines, python_version, conda_libraries, pip_libraries):
    with open('{0}.yml'.format(env_name), 'w') as env_file:
        env_file.write(start_lines)
        env_file.write('dependencies:\n')

        env_file.write('  - python={0}\n'.format(python_version))

        for library in conda_libraries:
            env_file.write('  - {0}={1}\n'.format(library, conda_libraries[library]))

        if len(pip_libraries) > 0:
            env_file.write('  - pip:\n')
            for library in pip_libraries:
                env_file.write('      - {0}=={1}\n'.format(library, pip_libraries[library]))


# Method to compare two versions.
# Return 1 if v2 is smaller,
# -1 if v1 is smaller,,
# 0 if equal
# https://www.geeksforgeeks.org/compare-two-version-numbers/
def version_compare(v1, v2):
    # This will split both the versions by '.'
    arr1 = v1.split(".")
    arr2 = v2.split(".")

    # Initializer for the version arrays
    i = 0

    # We have taken into consideration that both the
    # versions will contains equal number of delimiters
    while (i < len(arr1)):

        # Version 2 is greater than version 1
        if int(arr2[i]) > int(arr1[i]):
            return -1

        # Version 1 is greater than version 2
        if int(arr1[i]) > int(arr2[i]):
            return 1

        # We can't conclude till now
        i += 1

    # Both the versions are equal
    return 0


if __name__ == '__main__':
    main()