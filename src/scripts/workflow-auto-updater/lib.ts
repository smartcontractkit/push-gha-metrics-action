import fs from "node:fs/promises"
import * as yaml from "yaml"
import { join } from "node:path"

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

    const metricsNode = doc.createNode({
      name: "Collect Metrics",
      id: "collect-gha-metrics",
      uses: "smartcontractkit/push-gha-metrics-action",
      with: {
        "basic-auth": "${{ secrets.GRAFANA_CLOUD_BASIC_AUTH }}",
        hostname: "${{ secrets.GRAFANA_CLOUD_HOST }}",
        "this-job-name": jobName,
      },
    })
    metricsNode.comment = "\n"
    steps.items.unshift(metricsNode)
  })

  return doc.toString({
    lineWidth: 0,
  })
}
