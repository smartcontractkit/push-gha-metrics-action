import {
  createLokiLogEntriesFromContext,
  sendLokiRequest,
} from "../../src/loki"
import { Context } from "../../src/context.types"
import { LokiRequestOptions } from "../../src/loki.types"
import { faker } from "@faker-js/faker"
import { iso8601ToUnixTimeSeconds } from "../../src/utils"

/**
 * Generate mock contexts used for seeding loki logs
 *
 * @param amount The amount of job runs to generate
 * @param dateRangeInDays The date range the job runs are bounded in, starting from the present day
 * @returns
 */
function generateMockContexts(amount = 100, dateRangeInDays = 1) {
  const fakeOwnerArr = [faker.name.firstName()]
  const fakeRepoArr = [faker.word.verb(), faker.word.verb(), faker.word.verb()]
  const fakeCIJobNameArr = [
    "unit tests",
    "integration tests",
    "format",
  ] as const
  const fakeCDJobNameArr = ["release", "create-tags", "push-image"] as const
  const fakeWorkflowNameArr = ["CI", "CD"] as const

  return Array(amount)
    .fill(null)
    .map(() => {
      const repo = {
        repo: faker.helpers.arrayElement(fakeRepoArr),
        owner: faker.helpers.arrayElement(fakeOwnerArr),
      }
      const workflowName = faker.helpers.arrayElement(fakeWorkflowNameArr)
      const jobName = faker.helpers.arrayElement(
        workflowName === "CI" ? fakeCIJobNameArr : fakeCDJobNameArr,
      )

      const jobStartedAt = faker.date.recent(dateRangeInDays)
      const workflowCreatedAt = faker.date
        // make sure that the workflow creation date is always before the job run
        .recent(1, jobStartedAt)
        .toISOString()
      const workflowRunStartedAt = faker.date
        // make the workflow run start at somewhere between the workflow creation and the job start
        .between(workflowCreatedAt, jobStartedAt)
        .toISOString()

      const ctx: Context = {
        event: {
          actor: faker.name.firstName(),
          eventName: faker.helpers.arrayElement([
            "pull_request",
            "push",
            "workflow_dispatch",
          ]),
          ref: faker.helpers.arrayElement([
            `refs/heads/${faker.git.branch()}`,
            `refs/tags/${faker.system.semver()}`,
            `refs/pull/${faker.random.numeric(3, {
              allowLeadingZeros: false,
            })}/merge`,
            undefined,
          ]),
          repo,
          sha: faker.git.commitSha(),
        },
        jobRun: {
          id: Number(faker.random.numeric(9)),
          jobName,
          name: jobName,
          startedAt: jobStartedAt.toISOString(),
          startedAtUnixSeconds: iso8601ToUnixTimeSeconds(
            jobStartedAt.toISOString(),
          ),
          estimatedEndedAtUnixSeconds:
            iso8601ToUnixTimeSeconds(jobStartedAt.toISOString()) +
            faker.datatype.number({ min: 20, max: 60 * 5 }),
          url: faker.internet.url(),
        },
        workflowRun: {
          createdAt: workflowCreatedAt,
          createdAtUnixSeconds: iso8601ToUnixTimeSeconds(workflowCreatedAt),
          runAttempt: faker.datatype.number({ max: 5, min: 1 }),
          // todo: make this accurate
          runId: Number(faker.random.numeric(9)),
          runNumber: Number(faker.random.numeric(1)),
          runStartedAt: workflowRunStartedAt,
          runStartedAtUnixSeconds:
            iso8601ToUnixTimeSeconds(workflowRunStartedAt),
          updatedAt: workflowRunStartedAt,
          updatedAtUnixSeconds: iso8601ToUnixTimeSeconds(workflowRunStartedAt),
          url: faker.internet.url(),
          workflowName,
          workflowUrl: faker.internet.url(),
        },
      }

      return ctx
    })
}

describe("Loki", () => {
  const contexts = generateMockContexts()

  describe(sendLokiRequest.name, () => {
    it.each(contexts)("should send a successful request %#", async c => {
      const logEntries = createLokiLogEntriesFromContext(c)
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
      expect(response?.statusCode).toEqual(204)
      expect(response?.data).toMatchInlineSnapshot(`""`)
    })
  })
})
