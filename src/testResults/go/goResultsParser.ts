import { TestResultsOutput, TestResultsTest } from "../testResults.types"

/**
 * Parse a go test results file data into the expeted output while ignoring
 * any data we do not want to be streamed to Loki
 * @param {string} fileData The data from the go test results file
 * @returns {TestResultsOutput} The parsed TestResultsOutput for the test suite
 */
export function parseGoTestResults(fileData: string): TestResultsOutput {
  const tests = convertDataToArray(fileData)

  const output: TestResultsOutput = {
    tests: [],
    status: "fail",
    elapsed: -1,
    testType: "go",
  }
  // Parse the pass/fail data from the results
  // excluding any skip or output lines
  tests.forEach((item: any) => {
    if (item.Action === "pass" || item.Action === "fail") {
      if (item.Test == undefined) {
        output.status = item.Action
        output.elapsed = item.Elapsed
      } else {
        output.tests.push({
          name: item.Test,
          status: item.Action,
          elapsed: item.Elapsed,
        } as TestResultsTest)
      }
    }
  })

  return output
}

// Go test results are output in a JSON array but not wrapped in an array
// so we need to convert it to a valid JSON array
export function convertDataToArray(fileData: string): string[] {
  const inputData = JSON.parse(fileData)

  // Convert the file to have a valid JSON array
  return Array.isArray(inputData) ? inputData : [inputData]
}
