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

/**
 * Go test results are output in a JSON array but not wrapped in an array
 * so we need to convert it to a valid JSON array
 * @param {string} fileData The file data as a JSON object per line
 * @returns {string[]} The parsed line data as a JSON array
 */
export function convertDataToArray(fileData: string): string[] {
  // Split the content by newline characters
  const lines = fileData.split("\n").filter(line => line.trim() !== "")

  // Parse each line as a JSON object and collect the parsed objects in an array
  const jsonArray = lines.map(line => JSON.parse(line))

  return jsonArray
}
