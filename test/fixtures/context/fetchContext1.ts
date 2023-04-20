import { Context } from '@src/context.types'

export const mockContext: Context = {
  event: {
    actor: 'HenryNguyen5',
    eventName: 'pull_request',
    ref: 'refs/pull/21/merge',
    repo: {
      owner: 'mockOwner',
      repo: 'mockRepo',
    },
    sha: '512d1a168cf626018888b44dc35cdd6e79b9df8a',
  },
  workflowRun: {
    url: 'https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/runs/2499110858',
    updatedAt: '2022-06-15T01:01:17Z',
    updatedAtUnixSeconds: 1655254877,
    createdAt: '2022-06-15T01:01:00Z',
    createdAtUnixSeconds: 1655254860,
    workflowUrl:
      'https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/workflows/28123629',
    runStartedAt: '2022-06-15T01:01:00Z',
    runStartedAtUnixSeconds: 1655254860,
    runAttempt: 1,
    runId: 2499110858,
    runNumber: 28,
    workflowName: 'Push Metrics CI',
  },
  jobRun: {
    id: 6891428337,
    name: 'generate-fixtures-name-1',
    url: 'https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337',
    hasFailed: 0,
    startedAt: '2022-06-15T01:01:13Z',
    startedAtUnixSeconds: 1655254873,
    estimatedEndedAtUnixSeconds: 1655254904,
    jobName: 'generate-fixtures-name-1',
  },
}
