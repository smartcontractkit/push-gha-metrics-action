/**
 * Relevant documentation / inspiration
 * https://grafana.com/docs/loki/latest/api/#post-lokiapiv1push
 * https://github.com/JaniAnttonen/winston-loki/tree/c440b051a254112d71c64e5dbd3ec7e86befe4ec
 */
import * as core from "@actions/core"
import http, { OutgoingHttpHeaders, RequestOptions } from "http"
import https from "https"
import * as contextTypes from "./context.types"
import * as lokiTypes from "./loki.types"

/**
 * Given a context, create a Loki log entries object that's compatible with the POST `/loki/api/v1/push` endpoint as a payload.
 * Since we are currently logging a single line per job execution, we store just one log stream, with one log value inside it
 *
 * @param context
 */
export function createLokiLogEntriesFromContext(
  context: contextTypes.Context,
): lokiTypes.LokiLogEntries {
  const stream = extractStreamFromContext(context)
  const value = createLokiLogValueFromContext(context)

  const logEntries: lokiTypes.LokiLogEntries = {
    streams: [
      {
        stream,
        values: [value],
      },
    ],
  }

  return logEntries
}

/**
 * Create a Loki stream object from the given context
 *
 * @param context
 * @returns
 */
export function extractStreamFromContext(
  context: contextTypes.Context,
): lokiTypes.LokiStream {
  const { event, jobRun, workflowRun } = context
  const { actor, eventName, repo } = event
  const { jobName } = jobRun
  const { workflowName } = workflowRun

  const staticLabels = {
    host: "github.com",
    application: "push-gha-metrics-action",
  } as const

  const dynamicLabels = {
    eventName,
    ref: event.ref!,
    repo: repo.repo,
    owner: repo.owner,
    jobName,
    workflowName,
    actor,
  }
  const streamLabels = { ...staticLabels, ...dynamicLabels }

  core.info(
    `${
      extractStreamFromContext.name
    } Extracted stream labels from context: ${JSON.stringify(
      streamLabels,
      null,
      1,
    )}`,
  )
  return streamLabels
}

/**
 * Given a context, create a loki log value
 *
 * @param context
 */
export function createLokiLogValueFromContext(
  context: contextTypes.Context,
): lokiTypes.LokiValue {
  const log = JSON.stringify(context)
  const secondInNanoSeconds = BigInt(1e9)
  const ts =
    BigInt(context.jobRun.estimatedEndedAtUnixSeconds) * secondInNanoSeconds

  core.debug(
    `${createLokiLogValueFromContext.name} Created loki log value: ${log}`,
  )
  core.debug(
    `${createLokiLogValueFromContext.name} Created loki log timestamp in nanoseconds ${ts}`,
  )
  return [ts.toString(), log]
}

/**
 * Send a request `POST /loki/api/v1/push`
 *
 * @param logEntries The log entries to serialize into JSON
 *
 * @see https://github.com/JaniAnttonen/winston-loki/blob/development/src/requests.js
 * @see https://nodejs.org/api/http.html#httprequesturl-options-callback
 */
export async function sendLokiRequest(
  logEntries: lokiTypes.LokiLogEntries,
  requestOptions: lokiTypes.LokiRequestOptions,
  dryRun: boolean,
): Promise<lokiTypes.LokiResponse | null> {
  // Prepare request data and options
  const serializedLogEntries = JSON.stringify(logEntries)
  const outgoingHeaders: OutgoingHttpHeaders = {
    ...requestOptions.headers,
    "Content-Type": requestOptions.contentType,
    "Content-Length": serializedLogEntries.length,
  }
  const options: RequestOptions = {
    auth: requestOptions.basicAuth,
    hostname: requestOptions.hostname,
    port: requestOptions.port,
    path: requestOptions.path,
    method: "POST",
    headers: outgoingHeaders,
    timeout: requestOptions.timeout,
  }
  const optionsWhitelist: (keyof Omit<RequestOptions, "auth">)[] = [
    "hostname",
    "port",
    "path",
    "method",
    "headers",
    "timeout",
  ]
  core.debug(
    `${sendLokiRequest.name} SanitizedRequestOptions: ${JSON.stringify(
      options,
      optionsWhitelist,
      1,
    )}`,
  )

  const lib = requestOptions.protocol === "http" ? http : https
  if (dryRun) {
    return null
  }
  // Send request, gracefully handle errors
  const response = await new Promise<lokiTypes.LokiResponse>(
    (resolve, reject) => {
      const request = lib.request(options, res => {
        const { statusCode, statusMessage, headers: incomingHeaders } = res
        core.debug(
          `${sendLokiRequest.name} Incoming headers ${JSON.stringify(
            incomingHeaders,
          )}`,
        )
        // Collect data and resolve once finished
        let data = ""
        res.on("data", d => (data += d))
        res.on("end", () => {
          // If status code isn't in 200 range, reject
          if (statusCode && !(statusCode >= 200 && statusCode < 300)) {
            const error = Error(
              `${
                sendLokiRequest.name
              } Received non 200 status code. StatusCode: ${statusCode} StatusMessage: ${
                statusMessage || "N/A"
              } Body: ${data}`,
            )
            return reject(error)
          }

          resolve({
            headers: incomingHeaders,
            data,
            statusCode,
            statusMessage,
          })
        })
      })

      request.on("error", err => {
        const contextualError = Error(
          `${sendLokiRequest.name} Got error during request: ${err.message}`,
        )
        reject(contextualError)
      })

      request.write(serializedLogEntries)
      request.end()
    },
  )

  core.debug(
    `${sendLokiRequest.name} Response: ${JSON.stringify(response, null, 1)}`,
  )
  return response
}
