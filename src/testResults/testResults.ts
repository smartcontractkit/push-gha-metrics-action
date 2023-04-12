import * as core from "@actions/core"
import * as fs from "fs"
import { TestResultsFileMetadata, TestResultsOutput } from "./testResults.types"
import { parseGoTestResults } from "./go/goResultsParser"

/**
 * Get the test results data from the file and prepare it for loki
 * @param {TestResultsFileMetadata} fileMetadata The file metadata to use to get and format the data
 * @returns {TestResultsOutput} The formatted test results data
 */
export function getTestResultsData(
  fileMetadata: TestResultsFileMetadata,
): TestResultsOutput {
  let resultData: TestResultsOutput = {} as TestResultsOutput

  try {
    const fileData = fs.readFileSync(fileMetadata.filePath, "utf8")

    // format the data based on the test type, go is the first but solidity will be added soon
    switch (fileMetadata.testType) {
      case "go":
        resultData = parseGoTestResults(fileData)
        break
      default:
        core.warning("Unknown test type: " + fileMetadata.testType)
    }
  } catch (error) {
    core.warning("Could not read the file: " + fileMetadata.filePath)
    core.warning("ignoring and moving on.")
  }
  return resultData
}
