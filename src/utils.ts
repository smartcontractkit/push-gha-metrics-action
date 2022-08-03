/**
 * Convert an iso 8601 formatted string to unix time format, in seconds
 *
 * @param iso8610Timestamp The iso 8601 formatted string
 */
export function iso8601ToUnixTimeSeconds(iso8610Timestamp: string): number {
  const unixMs = Date.parse(iso8610Timestamp)
  if (isNaN(unixMs)) {
    throw Error(
      `Invalid timestamp: Could not parse timestamp of value ${iso8610Timestamp}`,
    )
  }
  if (unixMs === 0) {
    throw Error(
      `Invalid timestamp: Got a value of "January 1, 1970, 00:00:00 UTC" from timestamp value of ${iso8610Timestamp}`,
    )
  }

  return Math.round(unixMs / 1000)
}

/**
 * Convert a unix timestamp in seconds to a iso 8601 formatted timestamp
 *
 * @param unixTs The timestamp within unix time format
 */
export function unixTimeSecondsToIso8601(unixTs: number): string {
  if (unixTs <= 0) {
    throw Error(
      `Invalid timestamp, unix time should be greater than zero, got value of ${unixTs}`,
    )
  }

  const date = new Date(unixTs * 1000)
  return date.toISOString()
}

/**
 * Return the current time in unix time, in seconds
 */
export function unixNowSeconds(override?: number): number {
  if (override) {
    return override
  }

  return Math.round(Date.now() / 1000)
}
