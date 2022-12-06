import type { context as RawGithubContext } from "@actions/github"
import * as core from "@actions/core"
import * as types from "./context.types"
import { iso8601ToUnixTimeSeconds, unixNowSeconds } from "./utils"
import {WorkflowStep} from "@octokit/webhooks-types"

const MetricCollectionStepName = "Post Collect Metrics"
const JobPollingAttempts = 20
const JobPollingIntervalMilliseconds = 1000

/**
 * Fetch the current context, includes relevant information about the triggering event, workflow run, and job run
 *
 * @param rawGithubContext
 * @param githubClient
 * @returns
 */
export async function fetchContext(
  githubClient: types.Octokit,
  rawGithubContext: typeof RawGithubContext,
  contextOverrides?: types.ContextOverrides,
): Promise<types.Context> {
  const githubContext = getGithubContext(rawGithubContext, contextOverrides)
  const jobRunContext = await fetchJobRunContext(
    githubClient,
    githubContext,
    contextOverrides,
  )
  const workflowRunContext = await fetchWorkflowRunContext(
    githubClient,
    githubContext,
  )

  const { runAttempt, runId, runNumber, workflowName, jobName, ...rest } =
    githubContext

  const mergedJobRunContext: types.Context["jobRun"] = {
    ...jobRunContext!,
    jobName,
  }
  const mergedWorkflowRunContext: types.Context["workflowRun"] = {
    ...workflowRunContext,
    runAttempt,
    runId,
    runNumber,
    workflowName,
  }

  return {
    event: rest,
    workflowRun: mergedWorkflowRunContext,
    jobRun: mergedJobRunContext,
  }
}

/**
 * Convert the github context into a JSON stringify
 * friendly format
 */
export function getGithubContext(
  rawGithubContext: typeof RawGithubContext,
  contextOverrides?: types.ContextOverrides,
): types.GithubContext {
  // The event path must exist
  // since it contains a JSON file with the payload
  if (!process.env.GITHUB_EVENT_PATH) {
    throw Error(`GITHUB_EVENT_PATH must exist to obtain context`)
  }

  const runAttempt = process.env.GITHUB_RUN_ATTEMPT
  if (!runAttempt) {
    throw Error(`GITHUB_RUN_ATTEMPT must exist to get workflow run attempt`)
  }

  // both issue and repo are getters
  //https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts#L55
  // so naively copying over enumerable properties via spread syntax does not work
  const issue = rawGithubContext.issue
  const repo = rawGithubContext.repo
  const restContext = { ...rawGithubContext }
  const fullContext = { ...restContext, issue, repo, runAttempt }

  return {
    actor: fullContext.actor,
    eventName: fullContext.eventName,
    jobName: contextOverrides?.jobName || fullContext.job,
    ref: fullContext.ref,
    repo: fullContext.repo,
    runAttempt: Number(fullContext.runAttempt),
    runId: fullContext.runId,
    runNumber: fullContext.runNumber,
    sha: fullContext.sha,
    workflowName: fullContext.workflow,
  }
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

function isJobFailed(steps: WorkflowStep[]): number {
    for (const step of steps) {
      if (step.conclusion === "failure") {
        core.info(`job failure found`)
        return 1
      }
    }
  return 0
}

// checks if job is finalized, when all steps except our Post Collect Metrics have not null conclusion
function isJobFinalized(steps: WorkflowStep[]): boolean {
  for (let i = 0; i < steps.length; i ++) {
    if (steps[i].name === MetricCollectionStepName) {
      const prevStep = steps[i-1]
      core.info(`previous step: ${JSON.stringify(prevStep, null, 1)}`)
      if (steps[i-1].conclusion !== null) {
        core.info(`job is finalized`)
        return true
      }
    }
  }
  return false
}

// poll job data until job is
// 1. relevant, we need only current job
// 2. finalized, all steps before Post Collect Metrics are finished
async function pollJobData(
    client: types.Octokit,
    githubContext: types.GithubContext,
    contextOverrides?: types.ContextOverrides
): Promise<types.JobRunContext | undefined> {
  const jobRuns = await client.rest.actions.listJobsForWorkflowRunAttempt({
    attempt_number: githubContext.runAttempt,
    run_id: githubContext.runId,
    ...githubContext.repo,
  })
  const { jobs } = jobRuns.data
  const relevantJobs = jobs.filter(
      j => j.name === githubContext.jobName && j.status === "in_progress",
  )

  // This should never happen, as job names reported by the API always have a number post-fixed to them if the default
  // name is not unique within the context of matrix execution
  if (relevantJobs.length > 1) {
    throw Error(
        `More than one job found during self-lookup, non-unique matrix job names being used will result in metrics ambiguity`,
    )
  }

  // Non-exhaustive situations where this could happen in order of likelihood:
  // 1. Invalid job name given for a lookup
  // 2. could be nullable if the run is queued, but has not started yet which
  // can occur due to eventual consistency between the current runner
  // that's executing this workflow run, and what is being reported by github api's
  if (relevantJobs.length === 0) {
    throw Error(
        `No job for job name: "${
            githubContext.jobName
        }" found during self-lookup, invalid job name given?
      Available jobs names + ids: ${jobs.map(j => `${j.name}|${j.id}`)}
      `,
    )
  }
  const [job] = relevantJobs
  if (!isJobFinalized(job.steps! as WorkflowStep[])) {
    return undefined
  }
  return {
    id: job.id,
    name: job.name,
    url: job.url,
    hasFailed: isJobFailed(job.steps! as WorkflowStep[]),
    startedAt: job.started_at,
    startedAtUnixSeconds: iso8601ToUnixTimeSeconds(job.started_at),
    estimatedEndedAtUnixSeconds: unixNowSeconds(
        contextOverrides?.estimatedEndedAtUnixSeconds,
    ),
  }
}

/**
 * Get the context of the currently executing job run
 *
 * @see https://github.community/t/get-action-job-id/17365/10
 * @param client
 * @param githubContext
 */
export async function fetchJobRunContext(
  client: types.Octokit,
  githubContext: types.GithubContext,
  contextOverrides?: types.ContextOverrides,
): Promise<types.JobRunContext | undefined> {

  for (let i = 0; i < JobPollingAttempts; i++) {
    const jobRunContext = await pollJobData(client, githubContext, contextOverrides)
    if (jobRunContext != undefined) {
      return jobRunContext
    }
    await delay(JobPollingIntervalMilliseconds)
  }
  throw Error(`JobRun context is not finalized until timeout, job name: ${githubContext.jobName}`)
}

/**
 * Given the github context, make an API call to github to gather context around the current workflow run
 *
 * @param client
 * @param githubContext
 */
export async function fetchWorkflowRunContext(
  client: types.Octokit,
  githubContext: types.GithubContext,
): Promise<types.WorkflowRunContext> {
  const workflowRun = await client.rest.actions.getWorkflowRunAttempt({
    ...githubContext.repo,
    attempt_number: githubContext.runAttempt,
    run_id: githubContext.runId,
  })

  const { data } = workflowRun
  const { url, updated_at, created_at, workflow_url, run_started_at } = data

  // This can happen when the github runner state hasn't been synchronized with the github API state yet
  if (!run_started_at) {
    throw Error(
      `Could not find "run_started_at" for workflow run attempt runId:${githubContext.runId}|attemptNumber:${githubContext.runAttempt}, github api down / inconsistent?`,
    )
  }

  const workflowRunContext: types.WorkflowRunContext = {
    url,
    updatedAt: updated_at,
    updatedAtUnixSeconds: iso8601ToUnixTimeSeconds(updated_at),
    createdAt: created_at,
    createdAtUnixSeconds: iso8601ToUnixTimeSeconds(created_at),
    workflowUrl: workflow_url,
    runStartedAt: run_started_at,
    runStartedAtUnixSeconds: iso8601ToUnixTimeSeconds(run_started_at),
  }

  return workflowRunContext
}
