import type { context } from "@actions/github"
import { DeepMockProxy, mockDeep, MockProxy } from "jest-mock-extended"
import * as fixtures from "../fixtures/github"
import { writeFileSync } from "fs"
import { join } from "path"
import {
  fetchWorkflowRunContext,
  fetchJobRunContext,
  getGithubContext,
  fetchContext,
} from "../../src/context"
import type { ContextOverrides, Octokit } from "../../src/context.types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockResponse(data: any): any {
  return {
    headers: {},
    status: "200" as const,
    data,
    url: "",
  }
}

describe("Context", () => {
  let mockContext: MockProxy<typeof context>
  let mockClient: DeepMockProxy<Octokit>
  let mockContextOverrides: ContextOverrides
  const env = JSON.parse(JSON.stringify(process.env))

  describe("Event", () => {
    describe("Pull Requests", () => {
      beforeEach(() => {
        process.env = env
        mockClient = mockDeep<Octokit>()
      })

      describe.each(fixtures.pullRequest.fixtures)("%# Job Attempts", f => {
        beforeEach(() => {
          // make the ended at timestamp be 30 seconds after the one of the jobs in the current workflow started
          const estimatedEndedAtUnixSeconds =
            Math.floor(
              Date.parse(
                f.api.listJobsForWorkflowRunAttempt.jobs[0].started_at,
              ) / 1000,
            ) + 30

          mockContextOverrides = {
            estimatedEndedAtUnixSeconds,
            jobName: "generate-fixtures-name-1",
          }

          mockClient.rest.actions.getWorkflowRunAttempt.mockResolvedValue(
            mockResponse(getWorkflowRunAttempt),
          )
          mockClient.rest.actions.listJobsForWorkflowRunAttempt.mockResolvedValue(
            mockResponse(listJobsForWorkflowRunAttempt),
          )
        })

        const { getWorkflowRunAttempt, listJobsForWorkflowRunAttempt } = f.api
        mockContext = {
          ...f.context,
          // The fixture is missing the getters since its plain json
          // So we add our own to test if we're properly creating a JSON obj based off of
          // https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts
          get issue(): { owner: string; repo: string; number: number } {
            return { owner: "mockOwner", repo: "mockRepo", number: 1 }
          },
          get repo(): { owner: string; repo: string } {
            return { owner: "mockOwner", repo: "mockRepo" }
          },
        }

        describe(getGithubContext.name, () => {
          it("should handle required env vars", () => {
            delete process.env.GITHUB_EVENT_PATH
            delete process.env.GITHUB_RUN_ATTEMPT

            expect(() =>
              getGithubContext(mockContext),
            ).toThrowErrorMatchingInlineSnapshot(
              `"GITHUB_EVENT_PATH must exist to obtain context"`,
            )

            process.env.GITHUB_EVENT_PATH = "./my-event-path"

            expect(() =>
              getGithubContext(mockContext),
            ).toThrowErrorMatchingInlineSnapshot(
              `"GITHUB_RUN_ATTEMPT must exist to get workflow run attempt"`,
            )

            process.env.GITHUB_RUN_ATTEMPT = "1"

            expect(() => getGithubContext(mockContext)).not.toThrowError()
          })

          it("should return a correctly hydrated context", () => {
            process.env.GITHUB_RUN_ATTEMPT = "1"
            process.env.GITHUB_EVENT_PATH = "./my-event-path"
            const result = getGithubContext(mockContext, {})
            // Have to serialize / parse otherwise snapshotting fails
            // most likely due to how we mock this object
            expect(JSON.parse(JSON.stringify(result))).toMatchSnapshot()
          })
        })

        describe(fetchJobRunContext.name, () => {
          it("should error out when a job lookup fails", async () => {
            process.env.GITHUB_RUN_ATTEMPT = "1"
            process.env.GITHUB_EVENT_PATH = "./my-event-path"
            const githubContext = getGithubContext(mockContext)
            expect.assertions(1)

            await expect(() =>
              fetchJobRunContext(mockClient, githubContext),
            ).rejects.toMatchSnapshot()
          })

          it("should work when a matching job name is found", async () => {
            process.env.GITHUB_RUN_ATTEMPT = "1"
            process.env.GITHUB_EVENT_PATH = "./my-event-path"
            // jobName was grabbed by looking through the fixtures
            const githubContext = getGithubContext(
              mockContext,
              mockContextOverrides,
            )

            const result = await fetchJobRunContext(
              mockClient,
              githubContext,
              mockContextOverrides,
            )
            expect(result).toMatchSnapshot()
          })
        })

        describe("fetchWorkflowRunContext", () => {
          it("should error when run_started_at is null", async () => {
            mockClient.rest.actions.getWorkflowRunAttempt.mockResolvedValueOnce(
              mockResponse({
                ...getWorkflowRunAttempt,
                run_started_at: null,
              }),
            )
            expect.assertions(1)
            const githubContext = getGithubContext(mockContext)
            await expect(
              fetchWorkflowRunContext(mockClient, githubContext),
            ).rejects.toMatchSnapshot()
          })

          it("should work", async () => {
            const githubContext = getGithubContext(mockContext)
            const workflowRunContext = await fetchWorkflowRunContext(
              mockClient,
              githubContext,
            )

            expect(workflowRunContext).toMatchSnapshot()
          })
        })

        describe("fetchContext", () => {
          it("should work", async () => {
            const res = await fetchContext(
              mockClient,
              mockContext,
              mockContextOverrides,
            )

            const stringifiedRes = JSON.stringify(res)
            expect(JSON.parse(stringifiedRes)).toMatchSnapshot()

            /**
             * This data is used in other unit tests as a mock, this makes it easy
             * to update them
             */
            if (process.env.UPDATE_CONTEXT_FIXTURE) {
              const snapshotPath = "../fixtures/context"
              writeFileSync(
                join(__dirname, snapshotPath, `fetchContext${f.index}.json`),
                stringifiedRes,
              )
            }
          })
        })
      })
    })
  })
})
