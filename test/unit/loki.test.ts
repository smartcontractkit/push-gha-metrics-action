import {
  createLokiLogEntriesFromContext,
  createLokiLogValueFromContext,
  extractStreamFromContext,
  sendLokiRequest,
} from "../../src/loki"
import { Context } from "../../src/context.types"
import { LokiRequestOptions } from "../../src/loki.types"
import nock from "nock"
import mockContext from "../fixtures/context/fetchContext1.json"

describe("Loki", () => {
  // Taken from context.test.ts snapshots
  const context: Context = mockContext

  describe(createLokiLogEntriesFromContext.name, () => {
    it("should create loki log entries from context", () => {
      const {
        streams: [{ stream, values }],
      } = createLokiLogEntriesFromContext(context)
      const [ts, value] = values[0]

      expect(BigInt(ts)).toBeLessThanOrEqual(
        BigInt(Date.now()) * BigInt(1_000_000),
      )
      expect(JSON.parse(value)).toMatchInlineSnapshot(`
        {
          "event": {
            "actor": "HenryNguyen5",
            "eventName": "pull_request",
            "ref": "refs/pull/21/merge",
            "repo": {
              "owner": "mockOwner",
              "repo": "mockRepo",
            },
            "sha": "512d1a168cf626018888b44dc35cdd6e79b9df8a",
          },
          "jobRun": {
            "estimatedEndedAtUnixSeconds": 1655254904,
            "hasFailed": 0,
            "html_url": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337",
            "id": 6891428337,
            "jobName": "generate-fixtures-name-1",
            "name": "generate-fixtures-name-1",
            "startedAt": "2022-06-15T01:01:13Z",
            "startedAtUnixSeconds": 1655254873,
            "url": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337",
          },
          "workflowRun": {
            "createdAt": "2022-06-15T01:01:00Z",
            "createdAtUnixSeconds": 1655254860,
            "runAttempt": 1,
            "runId": 2499110858,
            "runNumber": 28,
            "runStartedAt": "2022-06-15T01:01:00Z",
            "runStartedAtUnixSeconds": 1655254860,
            "updatedAt": "2022-06-15T01:01:17Z",
            "updatedAtUnixSeconds": 1655254877,
            "url": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/runs/2499110858",
            "workflowName": "Push Metrics CI",
            "workflowUrl": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/workflows/28123629",
          },
        }
      `)
      expect(stream).toMatchInlineSnapshot(`
        {
          "actor": "HenryNguyen5",
          "application": "push-gha-metrics-action",
          "eventName": "pull_request",
          "host": "github.com",
          "jobName": "generate-fixtures-name-1",
          "owner": "mockOwner",
          "ref": "refs/pull/21/merge",
          "repo": "mockRepo",
          "workflowName": "Push Metrics CI",
        }
      `)
    })
  })

  describe(createLokiLogValueFromContext.name, () => {
    it("should create a log value from context", () => {
      const [ts, value] = createLokiLogValueFromContext(context)

      expect(BigInt(ts)).toBeLessThanOrEqual(
        BigInt(Date.now()) * BigInt(1_000_000),
      )
      expect(JSON.parse(value)).toMatchInlineSnapshot(`
        {
          "event": {
            "actor": "HenryNguyen5",
            "eventName": "pull_request",
            "ref": "refs/pull/21/merge",
            "repo": {
              "owner": "mockOwner",
              "repo": "mockRepo",
            },
            "sha": "512d1a168cf626018888b44dc35cdd6e79b9df8a",
          },
          "jobRun": {
            "estimatedEndedAtUnixSeconds": 1655254904,
            "hasFailed": 0,
            "html_url": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337",
            "id": 6891428337,
            "jobName": "generate-fixtures-name-1",
            "name": "generate-fixtures-name-1",
            "startedAt": "2022-06-15T01:01:13Z",
            "startedAtUnixSeconds": 1655254873,
            "url": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337",
          },
          "workflowRun": {
            "createdAt": "2022-06-15T01:01:00Z",
            "createdAtUnixSeconds": 1655254860,
            "runAttempt": 1,
            "runId": 2499110858,
            "runNumber": 28,
            "runStartedAt": "2022-06-15T01:01:00Z",
            "runStartedAtUnixSeconds": 1655254860,
            "updatedAt": "2022-06-15T01:01:17Z",
            "updatedAtUnixSeconds": 1655254877,
            "url": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/runs/2499110858",
            "workflowName": "Push Metrics CI",
            "workflowUrl": "https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/workflows/28123629",
          },
        }
      `)
    })
  })

  describe(extractStreamFromContext.name, () => {
    it("should generate a stream object from a github context", () => {
      const stream = extractStreamFromContext(context)
      expect(stream).toMatchInlineSnapshot(`
        {
          "actor": "HenryNguyen5",
          "application": "push-gha-metrics-action",
          "eventName": "pull_request",
          "host": "github.com",
          "jobName": "generate-fixtures-name-1",
          "owner": "mockOwner",
          "ref": "refs/pull/21/merge",
          "repo": "mockRepo",
          "workflowName": "Push Metrics CI",
        }
      `)
    })
  })

  describe(sendLokiRequest.name, () => {
    if (process.env.RECORD) {
      // nock.recorder.rec();
    }

    it("should send a successful dry run request", async () => {
      const logEntries = createLokiLogEntriesFromContext(context)
      const requestOptions: LokiRequestOptions = {
        contentType: "application/json",
        headers: {},
        hostname: "localhost",
        path: "/loki/api/v1/push",
        port: 3030,
        protocol: "http",
        timeout: 1000,
      }
      const response = await sendLokiRequest(logEntries, requestOptions, true)
      expect(response).toBeNull()
    })

    it("should throw on a non 200 status code", async () => {
      nock("http://localhost:3030", { encodedQueryParams: true })
        .post("/loki/api/v1/push", {
          streams: [
            {
              stream: {
                host: "github.com",
                application: "push-gha-metrics-action",
                eventName: "pull_request",
                repo: "mockRepo",
                owner: "mockOwner",
                jobName: "generate-fixtures-name-1",
                workflowName: "Push Metrics CI",
                actor: "HenryNguyen5",
              },
              values: [[/^\d+$/, /.*/]],
            },
          ],
        })
        .reply(
          400,
          'entry for stream \'{actor="HenryNguyen5", eventName="pull_request", jobName="generate-fixtures-name-1", owner="mockOwner", repo="mockRepo", workflowName="Push Metrics CI"}\' has timestamp too old: 1970-01-03T12:22:04Z, oldest acceptable timestamp is: 2022-06-16T22:19:04Z\n',
          [
            "Content-Type",
            "text/plain; charset=utf-8",
            "X-Content-Type-Options",
            "nosniff",
            "Date",
            "Thu, 23 Jun 2022 22:19:04 GMT",
            "Content-Length",
            "270",
            "Connection",
            "close",
          ],
        )

      const logEntries = createLokiLogEntriesFromContext(context)
      const requestOptions: LokiRequestOptions = {
        contentType: "application/json",
        headers: {},
        hostname: "localhost",
        path: "/loki/api/v1/push",
        port: 3030,
        protocol: "http",
        timeout: 1000,
      }

      expect.assertions(1)
      await expect(sendLokiRequest(logEntries, requestOptions, false)).rejects
        .toMatchInlineSnapshot(`
        [Error: sendLokiRequest Got error during request: Nock: No match for request {
          "method": "POST",
          "url": "http://localhost:3030/loki/api/v1/push",
          "headers": {
            "content-type": "application/json",
            "content-length": 1546
          },
          "body": "{\\"streams\\":[{\\"stream\\":{\\"host\\":\\"github.com\\",\\"application\\":\\"push-gha-metrics-action\\",\\"eventName\\":\\"pull_request\\",\\"ref\\":\\"refs/pull/21/merge\\",\\"repo\\":\\"mockRepo\\",\\"owner\\":\\"mockOwner\\",\\"jobName\\":\\"generate-fixtures-name-1\\",\\"workflowName\\":\\"Push Metrics CI\\",\\"actor\\":\\"HenryNguyen5\\"},\\"values\\":[[\\"1655254904000000000\\",\\"{\\\\\\"event\\\\\\":{\\\\\\"actor\\\\\\":\\\\\\"HenryNguyen5\\\\\\",\\\\\\"eventName\\\\\\":\\\\\\"pull_request\\\\\\",\\\\\\"ref\\\\\\":\\\\\\"refs/pull/21/merge\\\\\\",\\\\\\"repo\\\\\\":{\\\\\\"owner\\\\\\":\\\\\\"mockOwner\\\\\\",\\\\\\"repo\\\\\\":\\\\\\"mockRepo\\\\\\"},\\\\\\"sha\\\\\\":\\\\\\"512d1a168cf626018888b44dc35cdd6e79b9df8a\\\\\\"},\\\\\\"workflowRun\\\\\\":{\\\\\\"url\\\\\\":\\\\\\"https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/runs/2499110858\\\\\\",\\\\\\"updatedAt\\\\\\":\\\\\\"2022-06-15T01:01:17Z\\\\\\",\\\\\\"updatedAtUnixSeconds\\\\\\":1655254877,\\\\\\"createdAt\\\\\\":\\\\\\"2022-06-15T01:01:00Z\\\\\\",\\\\\\"createdAtUnixSeconds\\\\\\":1655254860,\\\\\\"workflowUrl\\\\\\":\\\\\\"https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/workflows/28123629\\\\\\",\\\\\\"runStartedAt\\\\\\":\\\\\\"2022-06-15T01:01:00Z\\\\\\",\\\\\\"runStartedAtUnixSeconds\\\\\\":1655254860,\\\\\\"runAttempt\\\\\\":1,\\\\\\"runId\\\\\\":2499110858,\\\\\\"runNumber\\\\\\":28,\\\\\\"workflowName\\\\\\":\\\\\\"Push Metrics CI\\\\\\"},\\\\\\"jobRun\\\\\\":{\\\\\\"id\\\\\\":6891428337,\\\\\\"name\\\\\\":\\\\\\"generate-fixtures-name-1\\\\\\",\\\\\\"url\\\\\\":\\\\\\"https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337\\\\\\",\\\\\\"html_url\\\\\\":\\\\\\"https://api.github.com/repos/smartcontractkit/push-gha-metrics-action/actions/jobs/6891428337\\\\\\",\\\\\\"hasFailed\\\\\\":0,\\\\\\"startedAt\\\\\\":\\\\\\"2022-06-15T01:01:13Z\\\\\\",\\\\\\"startedAtUnixSeconds\\\\\\":1655254873,\\\\\\"estimatedEndedAtUnixSeconds\\\\\\":1655254904,\\\\\\"jobName\\\\\\":\\\\\\"generate-fixtures-name-1\\\\\\"}}\\"]]}]}"
        }]
      `)
    })

    it("should send a successful request", async () => {
      nock("http://localhost:3030", { encodedQueryParams: true })
        .post("/loki/api/v1/push", {
          streams: [
            {
              stream: {
                host: "github.com",
                application: "push-gha-metrics-action",
                eventName: "pull_request",
                ref: "refs/pull/21/merge",
                repo: "mockRepo",
                owner: "mockOwner",
                jobName: "generate-fixtures-name-1",
                workflowName: "Push Metrics CI",
                actor: "HenryNguyen5",
              },
              values: [[/^\d+$/, /.*/]],
            },
          ],
        })
        .reply(204, "", [
          "Date",
          "Thu, 23 Jun 2022 22:17:16 GMT",
          "Connection",
          "close",
        ])

      const logEntries = createLokiLogEntriesFromContext(context)
      const requestOptions: LokiRequestOptions = {
        contentType: "application/json",
        headers: {},
        hostname: "localhost",
        path: "/loki/api/v1/push",
        port: 3030,
        protocol: "http",
        timeout: 1000,
      }
      const response = await sendLokiRequest(logEntries, requestOptions, false)
      expect(response).toMatchInlineSnapshot(`
        {
          "data": "",
          "headers": {
            "connection": "close",
            "date": "Thu, 23 Jun 2022 22:17:16 GMT",
          },
          "statusCode": 204,
          "statusMessage": null,
        }
      `)
    })
  })
})
