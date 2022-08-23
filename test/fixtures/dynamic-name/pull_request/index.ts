import {
  getWorkflowRunAttempt1,
  getWorkflowRunAttempt2,
  listJobsForWorkflowRunAttempt1,
  listJobsForWorkflowRunAttempt2,
} from "./api"
import { context1, context2 } from "./context"

export const fixtures = [
  {
    api: {
      getWorkflowRunAttempt: getWorkflowRunAttempt1,
      listJobsForWorkflowRunAttempt: listJobsForWorkflowRunAttempt1,
    },
    context: context2,
    index: 1,
  },

  {
    api: {
      getWorkflowRunAttempt: getWorkflowRunAttempt2,
      listJobsForWorkflowRunAttempt: listJobsForWorkflowRunAttempt2,
    },
    context: context1,
    index: 2,
  },
]
