import * as core from "@actions/core"
import * as fs from "fs"
import { TestResultsFileMetadata, SummarizedTestResults } from "./types"
import { parseGoTestResults } from "./parsers/golang"

/**
 * Get the test results data from the file and prepare it for loki
 */
export function getTestResultSummary(
  fileMetadata: TestResultsFileMetadata,
): SummarizedTestResults {
  try {
    const fileData = fs.readFileSync(fileMetadata.filePath, "utf8")

    // format the data based on the test type, go is the first but solidity will be added soon
    switch (fileMetadata.testType) {
      case "go":
        return parseGoTestResults(fileData)
    }
  } catch (error) {
    core.warning("Could not read the file: " + fileMetadata.filePath)
    core.warning("ignoring and moving on.")
  }

  // if we get here, we failed to handle all the cases
  throw Error(
    `Could not get test results at "${fileMetadata.filePath}" of type "${fileMetadata.testType}"`,
  )
}
