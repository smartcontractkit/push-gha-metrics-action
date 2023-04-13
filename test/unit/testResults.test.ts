import { getTestResultSummary } from "@src/testResultSummary"
import {
  TestResultsFileMetadata,
  SummarizedTestResults,
} from "@src/testResultSummary/types"

describe("Test Results Parsing", () => {
  it("should parse a go test results file", async () => {
    const metadata: TestResultsFileMetadata = {
      testType: "go",
      filePath: "./test/fixtures/testResults/go_test_results_input.json",
    }
    const data: SummarizedTestResults = getTestResultSummary(metadata)
    expect(data).toMatchSnapshot()
  })
})
