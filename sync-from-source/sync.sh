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

err() {
  echo -e "\033[31m$1\033[39m" >&2
}

fail() {
  err "$1"
  exit 1
}

echo "Getting latest release for tag for $repo_name"
release=$(gh release view -R $repo_location --json 'tagName,body')
tag=$(echo "$release" | jq -r '.tagName')

echo "Getting release $tag for $repo_name"

echo "Downloading ${repo_location}:${tag}..."
echo ""
gh release download "$tag" -R "$repo_location" -A tar.gz

# Remove v from the version number
stripped_tag=${tag//v}

asset_dir_name=$repo_name-$stripped_tag
asset_name=$asset_dir_name.tar.gz
echo "Unpacking assets $asset_name"
tar -xvzf $asset_name

# msg ""
# cp -rf package/. "." || true

msg "Cleaning up"
# rm -r package
rm -rf $asset_dir_name
rm -rf $asset_name
