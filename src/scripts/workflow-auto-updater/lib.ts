import fs from "node:fs/promises"
import * as yaml from "yaml"
import { join } from "node:path"

/**
 * Given a directory that contains workflow files, update the workflows with our metrics action.
 *
 * @usage
 * ```sh
 * # In the root of this repository
 * pnpm update-workflow ~/src/cl/chainlink/.github/workflows
 *
 * # You can supply the DRY_RUN environment variable to see what workflows would be updated
 * DRY_RUN=true pnpm update-workflow ~/src/cl/chainlink/.github/workflows
 * ```
 */
export async function main() {
  const workflowDirPath = process.argv[2]
  const workflowFilePaths = await getWorkflowFilePathsFrom(workflowDirPath)

  for (const workflowFilePath of workflowFilePaths) {
    const updatedWorkflow = await updateWorkflow(workflowFilePath)
    if (process.env.DRY_RUN) {
      console.log(updatedWorkflow)
      continue
    }

    await fs.writeFile(workflowFilePath, updatedWorkflow, "utf-8")
  }
}

/**
 * Get an array of absolute workflow file paths based on a supplied directory
 *
 * @param dir The path to load the workflow files from
 */
export async function getWorkflowFilePathsFrom(dir: string): Promise<string[]> {
  console.log("Loading workflows from:", dir)

  const workflowFilePaths = await fs
    .readdir(dir)
    .then(files => files.map(f => join(dir, f)))

  // Only include .yml and .yaml files
  const filteredWorkflowPaths = workflowFilePaths
    .filter(w => w.includes(".yml") || w.includes(".yaml"))
    .sort()

  return filteredWorkflowPaths
}

/**
 * Render an existing workflow with our metrics action.
 *
 * Blindly inserts the action definition as the first step in every job
 * within the specified workflow.
 *
 * @param workflowPath The absolute file path to the workflow to edit
 *
 * @returns A string representation of the edited workflow
 */
export async function updateWorkflow(workflowPath: string): Promise<string> {
  console.log(`Updating workflow file at path: ${workflowPath}`)

  const workflowFile = await fs.readFile(workflowPath, "utf-8")
  const doc = yaml.parseDocument(workflowFile)

  const jobs = doc.getIn(["jobs"])
  if (!yaml.isMap(jobs)) {
    throw Error(`Could not get "jobs" property from workflow file`)
  }

  jobs.items.forEach(job => {
    if (!yaml.isMap(job.value) || !yaml.isScalar(job.key)) {
      throw Error(`Could not parse "jobs" property within workflow file`)
    }

    const name = job.value.get("name")
    const jobName = typeof name === "string" ? name : job.key.value

    const steps = job.value.get("steps")
    if (!yaml.isSeq(steps)) {
      throw Error(`Could not access "steps" property within "jobs"`)
    }

    const metricsStepId = "collect-gha-metrics"
    const metricsNode = doc.createNode({
      name: "Collect Metrics",
      id: metricsStepId,
      uses: "smartcontractkit/push-gha-metrics-action",
      with: {
        "basic-auth": "${{ secrets.GRAFANA_CLOUD_BASIC_AUTH }}",
        hostname: "${{ secrets.GRAFANA_CLOUD_HOST }}",
        "this-job-name": jobName,
      },
      "continue-on-error": true,
    })
    metricsNode.comment = "\n"

    const metricsIdx = findMetricsStepIndex(steps, metricsStepId)

    if (metricsIdx !== undefined) {
      console.log(
        ` The job "${jobName}" already contains a metrics step. Updating metrics step.`,
      )

      steps.items[metricsIdx] = metricsNode
    } else {
      steps.items.unshift(metricsNode)
    }
  })

  return doc.toString({
    lineWidth: 0,
  })
}

function findMetricsStepIndex(
  steps: yaml.YAMLSeq<unknown>,
  metricsStepId: string,
): number | undefined {
  for (let i = 0; i < steps.items.length; i++) {
    const step = steps.items[i]
    if (yaml.isMap(step) && step.get("id") === metricsStepId) {
      return i
    }
  }

  return undefined
}
