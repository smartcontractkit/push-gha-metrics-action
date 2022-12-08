import type { getOctokit } from "@actions/github"

export type Octokit = ReturnType<typeof getOctokit>

// From varying sources such as github's api and the current
// runner context, we construct our own context that contains
// relevant information about the event, workflow run, and job run
type GithubContextPropertyKeys<T extends keyof GithubContext> = T
type GithubContextWorkflowRunPropertyKeys = GithubContextPropertyKeys<
  "runAttempt" | "runId" | "runNumber" | "workflowName"
>
type GithubContextJobRunPropertyKeys = GithubContextPropertyKeys<"jobName">
type EventContext = Omit<
  GithubContext,
  GithubContextJobRunPropertyKeys | GithubContextWorkflowRunPropertyKeys
>

/**
 * Overrides that's fed into the action by user input, used to account for inconsistencies between the github runner and github api
 */
export interface ContextOverrides {
  /**
   * A user supplied job name, since matrixes produce inconsistent job names between what the runner context reports vs what the github api reports
   */
  jobName?: string

  /**
   * The unix time in seconds to set when the job ended, used to set dummy times for testing
   */
  estimatedEndedAtUnixSeconds?: number
}

export interface Context {
  /**
   * The triggering event context
   */
  event: EventContext
  /**
   * The current workflow run context
   */
  workflowRun: WorkflowRunContext &
    Pick<GithubContext, GithubContextWorkflowRunPropertyKeys>
  /**
   * The current job run context
   */
  jobRun: JobRunContext & Pick<GithubContext, GithubContextJobRunPropertyKeys>
}

type JobRun = Awaited<
  ReturnType<Octokit["rest"]["actions"]["listJobsForWorkflowRunAttempt"]>
>["data"]["jobs"][number]

export interface JobRunContext {
  /**
   * The job id referred to in https://docs.github.com/en/rest/actions/workflow-jobs#get-a-job-for-a-workflow-run
   */
  id: JobRun["id"]

  /**
   * The name of the job run
   */
  name: JobRun["name"]

  /**
   * The url linking back to the job API response
   */
  url: JobRun["url"]

  /**
   * The url linking back to the job run (HTML version)
   */
  html_url: JobRun["html_url"]

  /**
   * When the current job was started, in ISO-8061 format
   */
  startedAt: JobRun["started_at"]

  /**
   * Is true if the job has failed, note that this is in context of a currently
   * executing job, future steps may fail.
   */
  hasFailed: number

  /**
   * When the current job was started, in unix time in seconds format
   */
  startedAtUnixSeconds: number

  /**
   * Whe the current job was ended, estimated by taking the post-action cleanup step timestamp of this current action
   */
  estimatedEndedAtUnixSeconds: number
}

export interface WorkflowRunContext {
  /**
   * The URL to the workflow run
   */
  url: string

  /**
   * The last time the workflow run was updated in ISO-8061 format
   */
  updatedAt: string

  /**
   * The last time the workflow run was updated in unix time format in seconds
   */
  updatedAtUnixSeconds: number

  /**
   * When the workflow run was created in ISO-8061 format
   */
  createdAt: string

  /**
   * When the workflow run was created in unix time format in seconds
   */
  createdAtUnixSeconds: number

  /**
   * The URL to the workflow file
   */
  workflowUrl: string

  /**
   * The start time of the latest run in ISO-8061 format. Resets on re-run.
   */
  runStartedAt: string

  /**
   * The start time of the latest run in unix time format in seconds. Resets on re-run.
   */
  runStartedAtUnixSeconds: number
}

/**
 * The github context
 *
 * @see https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
 * @see https://github.com/actions/toolkit/issues/65
 */
export interface GithubContext {
  /**
   * The name of the person or app that initiated the workflow. For example, `octocat`.
   */
  actor: string

  /**
   * The name of the event that triggered the workflow. For example, `workflow_dispatch`.
   */
  eventName: string

  /**
   * The [job_id](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_id) of the current job. For example, `greeting_job`.
   */
  jobName: string

  /**
   * The branch or tag ref that triggered the workflow run.
   * For branches this is the format `refs/heads/<branch_name>`,
   * for tags it is `refs/tags/<tag_name>`,
   * and for pull requests it is `refs/pull/<pr_number>/merge`.
   * This variable is only set if a branch or tag is available for the event type. For example, `refs/heads/feature-branch-1`
   */
  ref?: string

  /**
   * The owner and repository name. For example, `octocat/Hello-World`
   */
  repo: {
    /**
     * The repository portion of `owner/repo`
     */
    repo: string
    /**
     * The owner portion of `owner/repo`
     */
    owner: string
  }

  /**
   * 	A unique number for each workflow run within a repository. This number does not change if you re-run the workflow run.
   */
  runId: number

  /**
   * 	A unique number for each run of a particular workflow in a repository.
   *  This number begins at 1 for the workflow's first run,
   *  and increments with each new run. This number does not change if you re-run the workflow run.
   *
   * @deprecated runId is a unique across every workflow within a repository,
   * rather than just for a particular workflow in a repository
   */
  runNumber: number

  /**
   * A unique number for each attempt of a particular workflow run in a repository.
   * This number begins at 1 for the workflow run's first attempt, and increments with each re-run.
   */
  runAttempt: number

  /**
   * The commit SHA that triggered the workflow.
   * The value of this commit SHA depends on the event that triggered the workflow.
   * For more information, see [Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows). For example, ffac537e6cbbf934b08745a378932722df287a53.
   */
  sha: string

  /**
   * The name of the workflow. For example, `My test workflow`.
   * If the workflow file doesn't specify a name,
   * the value of this variable is the full path of the workflow file in the repository.
   */
  workflowName: string
}
