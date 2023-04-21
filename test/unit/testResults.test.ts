import { getTestResultSummary } from "@src/testResultSummary"
import {
  MappedTestResult,
} from "@src/testResultSummary/types"

describe("Test Results Parsing", () => {
  it("should parse a go test results file input", async () => {
    const asInputString = '{"testType":"go","filePath":"./test/fixtures/testResults/go_test_results_input.json"}'
    const data: MappedTestResult[] = getTestResultSummary(asInputString)
    expect(data).toMatchSnapshot()
  })
})
