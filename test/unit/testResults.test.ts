import { getTestResultsData } from "@src/testResults/testResults"
import {
  TestResultsFileMetadata,
  TestResultsOutput,
} from "@src/testResults/testResults.types"

describe("Test Results Parsing", () => {
  it("should parse a go test results file", async () => {
    const metadata: TestResultsFileMetadata = {
      testType: "go",
      filePath: "./test/fixtures/testResults/go_test_results_input.json",
    }
    const data: TestResultsOutput = getTestResultsData(metadata)
    expect(data).toMatchSnapshot()
  })
})
