import { getTestResultSummary } from "@src/testResultSummary"
import {
  TestResultsFileMetadata,
  TestResultsFileMetadataSchema,
  MappedTestResult,
} from "@src/testResultSummary/types"

describe("Test Results Parsing", () => {
  it("should parse a go test results file input", async () => {
    const asInputString = '{"testType":"go","filePath":"./test/fixtures/testResults/go_test_results_input.json"}'
    const inputAsObject = JSON.parse(asInputString)
    const metadata: TestResultsFileMetadata = TestResultsFileMetadataSchema.parse(inputAsObject)
    const data: MappedTestResult[] = getTestResultSummary(metadata)
    expect(data).toMatchSnapshot()
  })
})
