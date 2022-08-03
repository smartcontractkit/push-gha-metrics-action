#!/bin/bash

./scripts/get-workflow-run-attempt.sh >./fixtures/$EVENT_NAME/api/$RUN_ID-$ATTEMPT_NUMBER-get-workflow-run-attempt.json
./scripts/list-jobs-for-workflow-run-attempt.sh >./fixtures/$EVENT_NAME/api/$RUN_ID-$ATTEMPT_NUMBER-list-jobs-for-workflow-run-attempt.json
./scripts/list-jobs-for-workflow-run.sh >./fixtures/$EVENT_NAME/api/$RUN_ID-list-jobs-for-workflow-run.json
