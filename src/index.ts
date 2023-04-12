import * as core from "@actions/core"
import * as github from "@actions/github"
import { KebabCasedProperties } from "type-fest"
import { fetchContext } from "./context"
import * as loki from "./loki"
import * as lokiTypes from "./loki.types"
import * as contextTypes from "./context.types"
import * as fs from "fs"
import {
  TestResultsFileMetadata,
  TestResultsFileMetadataSchema,
  TestResultsOutput,
} from "./testResults/testResults.types"
import { getTestReultsData } from "./testResults/testResults"
import { z } from "zod"

const isPost = "isPost"

export async function main() {
  if (!core.getState(isPost)) {
    core.saveState(isPost, true)
    core.info("This action no-ops during main execution")
    return
  }

  try {
    core.startGroup("Github Context Gathering")
    const dryRun = core.getBooleanInput("dry-run", { required: true })
    if (dryRun) {
      core.info("Dry run enabled")
    }

    const githubToken = getTypedInput("github-token")
    const githubClient = github.getOctokit(githubToken)
    const rawContext = github.context
    const contextOverrides: contextTypes.ContextOverrides = {
      jobName: getTypedInput("this-job-name") || undefined,
    }

    const context = await fetchContext(
      githubClient,
      rawContext,
      contextOverrides,
    )
    core.endGroup()

    core.startGroup("Load json files into context")
    const testResultFile: string = getTypedInput("test-results-file")
    let metadata: TestResultsFileMetadata
    if (testResultFile !== "") {
      try {
        metadata = TestResultsFileMetadataSchema.parse(testResultFile)
        const data: TestResultsOutput = getTestReultsData(metadata)
        context.testResults = data
      } catch (error) {
        core.warning(JSON.stringify(error))
        core.warning("ignoring and moving on.")
      }
    }
    core.endGroup()

    core.startGroup("Loki Log Sending")
    const logEntries = loki.createLokiLogEntriesFromContext(context)
    await loki.sendLokiRequest(logEntries, getLokiRequestOptions(), dryRun)
    core.endGroup()
  } catch (err) {
    core.endGroup()
    core.setFailed(`Got error ${err}, failing action`)
  }
}
main()

function getLokiRequestOptions(): lokiTypes.LokiRequestOptions {
  const rawBasicAuth = getTypedInput("basic-auth", false)
  const rawHostname = getTypedInput("hostname")
  const rawProtocol = getTypedInput("protocol")
  const rawPort = getTypedInput("port")
  const rawPath = getTypedInput("path")
  const rawTimeout = getTypedInput("timeout")
  const rawContentType = "application/json"

  const port = parseInt(rawPort)
  if (isNaN(port)) {
    throw Error(`Port value of ${rawPath} could not be parsed`)
  }

  if (rawProtocol !== "https" && rawProtocol !== "http") {
    throw Error(
      `Protocol value of ${rawProtocol} could not be parsed, valid values are "http" or "https"`,
    )
  }

  const timeout = parseInt(rawTimeout)
  if (isNaN(timeout)) {
    throw Error(`Timeout value of ${rawTimeout} could not be parsed`)
  }

  return {
    contentType: rawContentType,
    headers: {},
    hostname: rawHostname,
    path: rawPath,
    port,
    protocol: rawProtocol,
    timeout,
    basicAuth: rawBasicAuth,
  }
}

function getTypedInput(
  inputKey: keyof KebabCasedProperties<
    lokiTypes.LokiRequestOptions & {
      githubToken: never
      thisJobName: never
      testResultsFile: never
    }
  >,
  required = true,
) {
  return core.getInput(inputKey, { required, trimWhitespace: true })
}
