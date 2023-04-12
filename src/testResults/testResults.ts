import * as core from "@actions/core"
import * as fs from "fs"
import { TestResultsFileMetadata, TestResultsOutput } from "./testResults.types"
import { parseGoTestResults } from "./go/goResultsParser"

export function getTestResultsData(file: TestResultsFileMetadata): TestResultsOutput {
  let resultData: TestResultsOutput = {} as TestResultsOutput

  try {
    const fileData = fs.readFileSync(file.filePath, "utf8")

    switch (file.testType) {
      case "go":
        resultData= parseGoTestResults(fileData)
        break;
      default:
        core.warning("Unknown test type: " + file.testType)
    }
  } catch (error) {
    core.warning("Could not read the file: " + file.filePath)
    core.warning("ignoring and moving on.")
  }
  return resultData
}
