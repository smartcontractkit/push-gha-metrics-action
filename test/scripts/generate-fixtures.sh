#!/bin/bash

./scripts/get-workflow-run-attempt.sh >./$FIXTURE_PATH/api/get-workflow-run-attempt.json
./scripts/list-jobs-for-workflow-run-attempt.sh >./$FIXTURE_PATH/api/list-jobs-for-workflow-run-attempt.json
