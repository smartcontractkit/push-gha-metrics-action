import * as core from "@actions/core"
import * as fs from "fs"
import { TestResultsFileMetadata, TestResultsOutput } from "./testResults.types"
import { parseGoTestResults } from "./go/goResultsParser"

export function getTestReultsData(file: TestResultsFileMetadata): TestResultsOutput {
  let resultData: TestResultsOutput = {} as TestResultsOutput

  try {
    const data = fs.readFileSync(file.filePath, "utf8")
    const jsonData = JSON.parse(data)

    switch (file.testType) {
      case "go":
        resultData= parseGoTestResults(jsonData)
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
