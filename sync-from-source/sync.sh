#!/bin/bash
set -e

# Dependencies:
# gh cli ^2.15.0 https://github.com/cli/cli/releases/tag/v2.15.0
# jq ^1.6 https://stedolan.github.io/jq/

# Echos (green colored) message to standard error
msg() {
  echo -e "\033[32m$1\033[39m" >&2
}

# Function to download a file from GitHub API
download_file() {
  local path="$1"
  msg "Downloading $path@$tag"

  gh api -XGET \
    -H "Accept: application/vnd.github.raw" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$repo_location/contents/$path" -F ref="$tag" > "$path"
}

repo_name=push-gha-metrics-action-source
repo_location=smartcontractkit/$repo_name
gitRoot=$(git rev-parse --show-toplevel)

# Determine if this sync is for a release or a snapshot
if [[ -n "$1" ]] && [[ "$1" == "--snapshot" ]]; then
  # Download from main branch directly for snapshots
  echo "Snapshot sync - will download changes from main branch"
  tag=main
else
  # Download from the most recent tagged release
  echo "Relase sync - getting latest release for $repo_location"
  release=$(gh release view -R $repo_location --json 'tagName,body')
  tag=$(echo "$release" | jq -r '.tagName')
fi

pushd "$gitRoot" >/dev/null

download_file "dist/index.js"
download_file "action.yml"
download_file "package.json"

# For testing only
if [[ -n "$1" ]] && [[ "$1" == "--snapshot" ]]; then
  echo "#testing" >> action.yml
  echo "//testing" >> dist/index.js
fi

echo "Sync complete"

popd >/dev/null
