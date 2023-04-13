import { z } from "zod"

/**
 * Metadata describing a file that contains the results of a test of a specific type
 */
const TestType = z.enum(["go" /*, "solidity"*/])
export const TestResultsFileMetadataSchema = z.object({
  testType: TestType,
  filePath: z.string().nonempty(),
})
export type TestResultsFileMetadata = z.infer<
  typeof TestResultsFileMetadataSchema
>

const handledTestStatuses = z.enum(["pass", "fail"])
type HandledTestStatuses = z.infer<typeof handledTestStatuses>

// I'd like to map this directly to the test result we want, but
// https://github.com/colinhacks/zod/issues/2315 breaks discriminated unions
// when you use `transform`
export const handledTestResultsSchema = z.object({
  Test: z.string().min(1).optional(),
  Action: handledTestStatuses,
  Elapsed: z.number().nonnegative(),
})

// I'd like to map this directly to the test result we want, but
// https://github.com/colinhacks/zod/issues/2315 breaks discriminated unions
// when you use `transform`
const TestResultSchema = z.discriminatedUnion("Action", [
  handledTestResultsSchema,
  z.object({
    Test: z.string().min(1).optional(),
    Action: z.literal("skip"),
    Elapsed: z.number().nonnegative(),
  }),
  z.object({
    Test: z.string().min(1),
    Action: z.literal("run"),
  }),
  z.object({
    Output: z.string().min(1),
    Action: z.literal("output"),
  }),
  z.object({
    Action: z.literal("start"),
  }),
])

export const TestResultsSchema = z.array(TestResultSchema)

export interface MappedTestResult {
  name?: string
  status: HandledTestStatuses
  elapsed: number
}

/**
 * The output for the test results
 */
export interface SummarizedTestResults {
  /**
   * The individual test results
   */
  tests: MappedTestResult[]
  /**
   * The status of the test run, if any test fails the status is "fail"
   */
  status: HandledTestStatuses
  /**
   * The total elapsed time of all tests
   */
  elapsed: number
  /**
   * The type of test that was run, by language
   */
  testType: z.infer<typeof TestType>
}
