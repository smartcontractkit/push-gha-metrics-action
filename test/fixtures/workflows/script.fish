#!/bin/fish

# This script grabs all workflows specified in the path and copies the file to the 'test/fixtures/workflows' directory.
# The final file name is the original path with the following modifications:
# - strips the entire parent path up to and including the '/workflows' sub-path
# - replace any subdirectories with the '-' character
#
# Examples:
# 1. /home/parallels/src/cl/chainlink-starknet/.github/workflows/graveyard/foo.yaml -> graveyard-fooyaml
# 2. /home/parallels/src/cl/external-adapters-js/.github/workflows/ci.yml -> ci.yml
#
# Unaccounted for:
# - Non-unique combinations of workflow name + workflow subdirectory will simply be overwritten.
# - This was only tested on my local computer.
fd -apH  '.github/workflows/.*ya?ml' \
  ~/src/cl/smartcontractkit/{chainlink,external-adapters-js,chainlink-starknet,chainlink-testing-framework} \
  -x fish -c "cp {} test/fixtures/workflows/(echo {} | sed -e 's/^\/home.*workflows\///g' | sed -e 's/\//-/g')"
