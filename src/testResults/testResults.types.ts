import { z } from "zod"

/**
 * Metadata describing a file that contains the results of a test of a specific type
 */
export interface TestResultsFileMetadata {
  testType: string
  filePath: string
}
const TestType = z.enum(["go" /*, "solidity"*/])
export const TestResultsFileMetadataSchema = z.object({
  testType: TestType,
  filePath: z.string().nonempty(),
}) satisfies z.ZodType<TestResultsFileMetadata>

const StatusType = z.enum(["pass", "fail"])

/**
 * An individual test result
 */
export interface TestResultsTest {
  name: string
  status: string
  elapsed: number
}
export const TestResultsTestSchema = z.object({
  name: z.string().nonempty(),
  status: StatusType,
  elapsed: z.number().nonnegative(),
}) satisfies z.ZodType<TestResultsTest>

/**
 * The output for the test results
 */
export interface TestResultsOutput {
  tests: TestResultsTest[]
  status: string
  elapsed: number
  testType: string
}
export const TestResultsOutputSchema = z.object({
  tests: z.array(TestResultsTestSchema).nonempty(),
  status: StatusType,
  elapsed: z.number().nonnegative(),
  testType: TestType,
}) satisfies z.ZodType<TestResultsOutput>
