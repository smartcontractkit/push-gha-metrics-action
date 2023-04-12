import { getTestReultsData } from "@src/testResults/testResults"
import { TestResultsFileMetadata, TestResultsFileMetadataSchema, TestResultsOutput } from "@src/testResults/testResults.types"


describe("Test Results Parsing", () => {
    it("should parse a go test results file", async () => {
        const metadata: TestResultsFileMetadata = {
            testType: "go",
            filePath: "../fixtures/testResults/go_test_results_input.json"
        }
        const data: TestResultsOutput = getTestReultsData(metadata)
        expect(data).toMatchSnapshot()
    })
})