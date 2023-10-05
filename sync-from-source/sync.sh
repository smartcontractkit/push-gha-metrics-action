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

echo "Getting latest release for tag for $repo_name"
release=$(gh release view -R $repo_location --json 'tagName,body')
tag=$(echo "$release" | jq -r '.tagName')

echo "Getting release $tag for $repo_name"

# Function to download a file from GitHub API
download_file() {
  local path="$1"

  msg "Downloading $path"
  gh api -XGET \
    -H "Accept: application/vnd.github.raw" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    /repos/smartcontractkit/push-gha-metrics-action-source/contents/"$path" -F ref="$tag" >"$path"
}

pushd "$gitRoot" >/dev/null

download_file "dist/index.js"
download_file "action.yml"
download_file "package.json"

echo "Sync complete"

popd >/dev/null
