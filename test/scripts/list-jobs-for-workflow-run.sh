#!/bin/bash

# https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run
# GitHub CLI api
# https://cli.github.com/manual/gh_api

OWNER=smartcontractkit
REPO=releng

gh api \
  -H "Accept: application/vnd.github.v3+json" \
  "/repos/$OWNER/$REPO/actions/runs/$RUN_ID/jobs"
