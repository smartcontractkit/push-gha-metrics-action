import { z } from "zod"
import {
  SummarizedTestResults,
  MappedTestResult,
  TestResult,
  TestResultsSchema,
  handledTestResultsSchema,
} from "../types"

/**
 * Parse a go test results file data into the expeted output while ignoring
 * any data we do not want to be streamed to Loki
 *
 * @see https://pkg.go.dev/cmd/test2json
 */
export function parseGoTestResults(fileData: string): SummarizedTestResults {
  const tests: TestResult[] = parseToTestResults(fileData)

  // Filter out any tests that we do not want to be streamed to Loki
  // and map the remaining tests to the expected output
  const handledTests: SummarizedTestResults["tests"] = tests
    .filter(
      (t): t is z.infer<typeof handledTestResultsSchema> =>
        handledTestResultsSchema.safeParse(t).success,
    )
    .map(
      t =>
        ({
          name: t.Test,
          status: t.Action,
          elapsed: t.Elapsed,
        } satisfies MappedTestResult),
    )

  // The last test in the array is the summary of the test run
  const lastTest = handledTests.at(-1)
  if (!lastTest) {
    throw Error("No tests found in file")
  }
  // Remove the last test from the array, which is the summary of the test run
  const restOfHandledTests = handledTests.slice(0, -1)

  return {
    elapsed: lastTest.elapsed,
    status: lastTest.status,
    tests: restOfHandledTests,
    testType: "go",
  }
}

export function parseToTestResults(fileData: string): TestResult[] {
  // Split the content by newline characters
  const lines = fileData.split("\n").filter(line => line.trim() !== "")

  // Parse each line as a JSON object and collect the parsed objects in an array
  const jsonArray = lines.map(line => JSON.parse(line))

  return TestResultsSchema.parse(jsonArray)
}
