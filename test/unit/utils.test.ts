import {
  iso8601ToUnixTimeSeconds,
  unixTimeSecondsToIso8601,
} from "../../src/utils"
import { Context } from "../../src/context.types"
import mockContext from "../fixtures/context/fetchContext1.json"

describe("Util tests", () => {
  // Taken from context.test.ts snapshots
  // @ts-ignore
  const context: Context = mockContext

  const { jobRun, workflowRun } = context
  const timestamps = [
    jobRun.startedAt,
    workflowRun.createdAt,
    workflowRun.runStartedAt,
    workflowRun.updatedAt,
  ]

  describe("timestamp handling", () => {
    describe("conversion", () => {
      it.each(timestamps)(
        "should convert %s to a unix timestamp",
        timestamp => {
          expect(iso8601ToUnixTimeSeconds(timestamp)).toMatchSnapshot()

          expect(
            unixTimeSecondsToIso8601(iso8601ToUnixTimeSeconds(timestamp)),
          ).toMatchSnapshot()
        },
      )
    })

    describe("error handling", () => {
      describe(unixTimeSecondsToIso8601.name, () => {
        it("should handle invalid inputs", () => {
          expect(() =>
            iso8601ToUnixTimeSeconds("sadfadsf"),
          ).toThrowErrorMatchingInlineSnapshot(
            `"Invalid timestamp: Could not parse timestamp of value sadfadsf"`,
          )
          expect(() =>
            iso8601ToUnixTimeSeconds(new Date(0).toISOString()),
          ).toThrowErrorMatchingInlineSnapshot(
            `"Invalid timestamp: Got a value of "January 1, 1970, 00:00:00 UTC" from timestamp value of 1970-01-01T00:00:00.000Z"`,
          )
        })
      })

      describe(iso8601ToUnixTimeSeconds.name, () => {
        it("should handle invalid inputs", () => {
          expect(() =>
            unixTimeSecondsToIso8601(-1),
          ).toThrowErrorMatchingInlineSnapshot(
            `"Invalid timestamp, unix time should be greater than zero, got value of -1"`,
          )

          expect(() =>
            unixTimeSecondsToIso8601(0),
          ).toThrowErrorMatchingInlineSnapshot(
            `"Invalid timestamp, unix time should be greater than zero, got value of 0"`,
          )
        })
      })
    })
  })
})
