import {
  TestResult,
  TestResultsSchema,
  handledTestResultsSchema,
  MappedTestResult,
  HandledTestResults,
} from '../types'

/**
 * Parse a go test results file data into the expeted output while ignoring
 * any data we do not want to be streamed to Loki
 *
 * @see https://pkg.go.dev/cmd/test2json
 */
export function parseGoTestResults(fileData: string): MappedTestResult[] {
  const tests: TestResult[] = parseToTestResults(fileData)

  // Filter out any tests that we do not want to be streamed to Loki
  // and map the remaining tests to the expected output
  const filteredTests = tests.filter(
    (t): t is HandledTestResults => handledTestResultsSchema.safeParse(t).success,
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handledTests: MappedTestResult[] = []
  filteredTests.forEach((t) => {
    if (t.Test !== undefined) {
      handledTests.push({
        name: t.Test,
        status: t.Action,
        elapsed: t.Elapsed,
      } satisfies MappedTestResult)
    }
  })

  return handledTests
}

export function parseToTestResults(fileData: string): TestResult[] {
  // Split the content by newline characters
  const lines = fileData.split('\n').filter((line) => line.trim() !== '')

  // Parse each line as a JSON object and collect the parsed objects in an array
  const jsonArray = lines.map((line) => JSON.parse(line))

  return TestResultsSchema.parse(jsonArray)
}
