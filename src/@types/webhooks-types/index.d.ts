import type { WorkflowStep } from "@octokit/webhooks-types"

declare module "@octokit/webhooks-types" {
  interface WorkflowStepQueued {
    name: string
    status: "queued"
    conclusion: null
    number: number
    started_at: null
    completed_at: null
  }

  type WorkflowStepAugmented = WorkflowStepQueued | WorkflowStep
}
