import * as core from '@actions/core'
import * as github from '@actions/github'
import { KebabCasedProperties } from 'type-fest'
import { fetchContext } from './context'
import * as loki from './loki'
import * as lokiTypes from './loki.types'
import * as contextTypes from './context.types'
import { MappedTestResult } from './testResultSummary/types'
import { getTestResultSummary } from './testResultSummary'

const isPost = 'isPost'

export async function main() {
  if (!core.getState(isPost)) {
    core.saveState(isPost, true)
    core.info('This action no-ops during main execution')
    return
  }

  try {
    core.startGroup('Github Context Gathering')
    const dryRun = core.getBooleanInput('dry-run', { required: true })
    if (dryRun) {
      core.info('Dry run enabled')
    }

    const githubToken = getTypedInput('github-token')
    const githubClient = github.getOctokit(githubToken)
    const rawContext = github.context
    const contextOverrides: contextTypes.ContextOverrides = {
      jobName: getTypedInput('this-job-name') || undefined,
    }

    const context = await fetchContext(githubClient, rawContext, contextOverrides)
    // create url from the context for the web view of the job
    const webUrl = `https://github.com/smartcontractkit/${context.event.repo.repo}/actions/runs/${context.workflowRun.runId}/job/${context.jobRun.id}`
    context.jobRun.webUrl = webUrl
    // parse the workflow id from the workflow url
    const workflowId: string = context.workflowRun.url.split('/').pop() as string
    context.workflowRun.workflowId = parseInt(workflowId)
    // add the statusInt to the jobRun
    context.jobRun.statusInt = context.jobRun.hasFailed === 0 ? 1 : 0
    core.endGroup()

    core.startGroup('Load test results into context if present')
    const testResultFile: string = getTypedInput('test-results-file', false)
    let testResults: MappedTestResult[] = []

    if (testResultFile) {
      testResults = getTestResultSummary(testResultFile)
    }
    core.endGroup()

    core.startGroup('Loki Log Sending')
    const logEntries = loki.createLokiLogEntriesFromContext(context, testResults)
    await loki.sendLokiRequest(logEntries, getLokiRequestOptions(), dryRun)
    core.endGroup()
  } catch (err) {
    core.endGroup()
    core.setFailed(`Got error ${err}, failing action`)
  }
}
main()

function getLokiRequestOptions(): lokiTypes.LokiRequestOptions {
  const rawBasicAuth = getTypedInput('basic-auth', false)
  const rawHostname = getTypedInput('hostname')
  const rawProtocol = getTypedInput('protocol')
  const rawPort = getTypedInput('port')
  const rawPath = getTypedInput('path')
  const rawTimeout = getTypedInput('timeout')
  const rawContentType = 'application/json'

  const port = parseInt(rawPort)
  if (isNaN(port)) {
    throw Error(`Port value of ${rawPath} could not be parsed`)
  }

  if (rawProtocol !== 'https' && rawProtocol !== 'http') {
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
