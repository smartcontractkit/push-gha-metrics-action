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

# Remove v from the version number
stripped_tag=${tag//v}

asset_dir_name=$repo_name-$stripped_tag
mkdir -p $asset_dir_name/dist

download_url_dist_index=$(gh api -XGET \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/smartcontractkit/push-gha-metrics-action-source/contents/dist -F ref=$tag | jq -r '.[0].download_url')

echo "Downloading dist/index.js"
curl --silent $download_url_dist_index --output $asset_dir_name/dist/index.js

download_url_action=$(gh api -XGET \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/smartcontractkit/push-gha-metrics-action-source/contents/ -F ref=$tag | jq -r '.[] | select(.name | contains("action.yml")).download_url')

echo "Downloading action.yml"
curl --silent $download_url_action --output $asset_dir_name/action.yml

download_url_action=$(gh api -XGET \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/smartcontractkit/push-gha-metrics-action-source/contents/ -F ref=$tag | jq -r '.[] | select(.name | contains("package.json")).download_url')

echo "Downloading package.json"
curl --silent $download_url_action --output $asset_dir_name/package.json

cp -rf $asset_dir_name/dist "." || true
cp -rf $asset_dir_name/action.yml "." || true
cp -rf $asset_dir_name/package.json "." || true

msg "Cleaning up"
rm -rf $asset_dir_name
