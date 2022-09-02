import {
  getWorkflowFilePathsFrom,
  updateWorkflow,
} from "@src/scripts/workflow-auto-updater/lib"
import path from "node:path"
import { execSync } from "node:child_process"

function gitRoot() {
  const root = execSync("git rev-parse --show-toplevel")

  return root.toString("utf-8").trimEnd()
}

async function loadTestWorkflowFilePaths(limit = 10) {
  const workflowsDirPath = path.join(__dirname, "../../../fixtures/workflows")
  const workflows = await getWorkflowFilePathsFrom(workflowsDirPath)

  return workflows.slice(0, limit || workflows.length)
}

describe(updateWorkflow.name, () => {
  it("loads workflow file paths then updates them", async () => {
    const workflowFiles = await loadTestWorkflowFilePaths(0)
    for (const workflowFile of workflowFiles) {
      try {
        const updatedWorkflow = await updateWorkflow(workflowFile, {
          includeNewline: true,
          tag: "v1",
        })
        expect(updatedWorkflow).toMatchSnapshot()
      } catch (e) {
        if (e instanceof Error) {
          // Strip non-deterministic paths
          const strippedPath = e.message.replace(gitRoot(), ".")
          expect(strippedPath).toMatchSnapshot()
        }
      }
    }
    expect.assertions(41)
  })
})
