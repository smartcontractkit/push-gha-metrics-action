import {
  getWorkflowFilePathsFrom,
  updateWorkflow,
} from "@src/scripts/workflow-auto-updater/lib"
import path from "node:path"

async function loadTestWorkflowFilePaths(limit = 10) {
  const workflowsDirPath = path.join(__dirname, "../../../fixtures/workflows")
  const workflows = await getWorkflowFilePathsFrom(workflowsDirPath)

  return workflows.slice(0, limit || workflows.length)
}

describe(updateWorkflow.name, () => {
  it("loads workflow file paths then updates them", async () => {
    const workflowFiles = await loadTestWorkflowFilePaths(0)
    for (const workflowFile of workflowFiles) {
      const updatedWorkflow = await updateWorkflow(workflowFile, {
        includeNewline: true,
        tag: "v1",
      })

      expect(updatedWorkflow).toMatchSnapshot()
    }

    expect.assertions(41)
  })
})
