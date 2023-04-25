import * as core from '@actions/core'
import * as fs from 'fs'
import { TestResultsFileMetadata, MappedTestResult, TestResultsFileMetadataSchema } from './types'
import { parseGoTestResults } from './parsers/golang'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

/**
 * Get the test results data from the file and prepare it for loki
 */
export function getTestResultSummary(testResultsFileMetadataRaw: string): MappedTestResult[] {
  // parse the metadata from the input
  const fileMetadata = getTestResultsFileMetadata(testResultsFileMetadataRaw)
  try {
    const fileData = fs.readFileSync(fileMetadata.filePath, 'utf8')

    // format the data based on the test type, go is the first but solidity will be added soon
    switch (fileMetadata.testType) {
      case 'go':
        return parseGoTestResults(fileData)
      default:
        throw Error('Unknown test type: ' + fileMetadata.testType)
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error as ZodError)
      core.error(validationError)
    }
    core.error('Could not read the file: ' + fileMetadata.filePath)
    throw error
  }
}

/**
 * Get the test results file metadata input and parse it for use
 */
export function getTestResultsFileMetadata(testResultsFile: string): TestResultsFileMetadata {
  try {
    const testResultsFileObject = JSON.parse(testResultsFile)
    return TestResultsFileMetadataSchema.parse(testResultsFileObject)
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error as ZodError)
      core.error(validationError)
    }
    core.error('Invalid test-results-file input: ' + testResultsFile)
    throw error
  }
}
