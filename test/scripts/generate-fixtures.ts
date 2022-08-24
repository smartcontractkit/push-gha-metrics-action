import * as github from "@actions/github"
import * as prettier from "prettier"
import * as fs from "node:fs/promises"
import {
  Octokit,
  ActionsEndpointResponseData,
  OctokitActions,
} from "@src/context.types"
import camelCase from "camelcase"
async function main() {
  const token = process.env.GH_TOKEN
  const repoFullName = process.env.REPO_FULL_NAME
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT
  if (!token) {
    throw Error(`A github token must be supplied`)
  }
  if (!repoFullName) {
    throw Error(
      `A full repository name must be supplied, like "smartcontractkit/chainlink"`,
    )
  }
  if (!runAttempt) {
    throw Error(`GITHUB_RUN_ATTEMPT must exist to get workflow run attempt`)
  }

  const [owner, repoName] = repoFullName.split("/")
  const workflowRunMetadata = {
    owner,
    repo: repoName,
    attempt_number: Number(runAttempt),
    run_id: github.context.runId,
  }

  const octokit = github.getOctokit(token)
  const { actions } = octokit.rest

  const { data: workflowRun } = await actions.getWorkflowRunAttempt(
    workflowRunMetadata,
  )
  const { data: jobs } = await actions.listJobsForWorkflowRunAttempt(
    workflowRunMetadata,
  )
  const { context } = github
  const { eventName } = context

  const filesToCreate: {
    dir: "api" | "context"
    children: { data: any; name: string }[]
    childIndex: IndexFile
  }[] = [
    {
      dir: "api",
      children: [
        { data: workflowRun, name: "get-workflow-run-attempt" },
        {
          data: jobs,
          name: "list-jobs-for-workflow-run-attempt",
        },
      ],
      childIndex: { imports: {}, exports: {}, data: "" },
    },
    {
      dir: "context",
      childIndex: { imports: {}, exports: {}, data: "" },
      children: [
        {
          data: context,
          name: "context",
        },
      ],
    },
  ]

  interface ParentIndexFile {
    imports: Record<string, string>
    data: string
    fixtures: { api: Record<string, string>; context: string; index: number }
  }

  const parentIndex: ParentIndexFile = {
    imports: {},
    data: "",
    fixtures: { api: {}, context: "", index: 1 },
  }

  for (const { childIndex, children, dir } of filesToCreate) {
    for (const { name } of children) {
      const { filePath, importExportName, camelCaseName } =
        generateFileMetadata(workflowRunMetadata, name)
      childIndex.imports[importExportName] = `./${filePath}`
      childIndex.exports[importExportName] = true
      parentIndex.imports[importExportName] = `./${dir}`
      switch (dir) {
        case "api": {
          parentIndex.fixtures[dir][camelCaseName] = importExportName
          break
        }
        case "context": {
          parentIndex.fixtures[dir] = importExportName
          break
        }
      }
    }
    const childIndexData = `
  ${Object.values(childIndex.imports)
    .map(([k, v]) => `import ${k} from "${v}"`)
    .join("\n")}

   export { ${Object.keys(childIndex.exports).join(",\n")} } 
  `
    childIndex.data = childIndexData
  }

  const parentIndexData = `
  ${Object.values(parentIndex.imports)
    .map(([k, v]) => `import {${k}} from "${v}"`)
    .join("\n")}

  export const fixtures = [${JSON.stringify(parentIndex.fixtures)}]
  `
  parentIndex.data = parentIndexData
}

interface WorkflowRunMetadata {
  owner: string
  repo: string
  attempt_number: number
  run_id: number
}

interface IndexFile {
  exports: Record<string, boolean>
  // a map of import names by path
  imports: Record<string, string>
  data: string
}

function generateFileMetadata(
  workflowRunMetadata: WorkflowRunMetadata,
  name: string,
) {
  const filePostfix = `${workflowRunMetadata.run_id}-${workflowRunMetadata.attempt_number}`
  const postFixedFileName = `${name}-${filePostfix}`
  const filePath = `${postFixedFileName}.json`
  const importExportName = camelCase(postFixedFileName)
  const camelCaseName = camelCase(name)
  return { filePath, importExportName, camelCaseName }
}
