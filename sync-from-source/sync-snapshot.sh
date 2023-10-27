#!/bin/bash
set -e

# Dependencies:
# gh cli ^2.15.0 https://github.com/cli/cli/releases/tag/v2.15.0
# jq ^1.6 https://stedolan.github.io/jq/

repo_name=push-gha-metrics-action-source
repo_location=smartcontractkit/$repo_name
gitRoot=$(git rev-parse --show-toplevel)

msg() {
  echo -e "\033[32m$1\033[39m" >&2
}

# Function to download a file from GitHub API
download_file() {
  local path="$1"

  msg "Downloading $path@main"
  gh api -XGET \
    -H "Accept: application/vnd.github.raw" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$repo_location/contents/$path" -F ref=main > "$path"
}

pushd "$gitRoot" >/dev/null

download_file "dist/index.js"
download_file "action.yml"
download_file "package.json"

echo "Sync complete"

popd >/dev/null
