import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

/**
 * Loki by default expects a snappy-compressed protobuf message,
 * but we're implementing JSON for now for simplicity and bundle size constraints
 */
type SupportedPushEndpointContentTypes = "application/json";

/**
 * HTTP request options
 */
export interface LokiRequestOptions {
  /**
   * Basic auth like `user:password` to compute an authorization header
   */
  basicAuth?: string;

  /**
   * The content type to use
   */
  contentType: SupportedPushEndpointContentTypes;

  /**
   * The hostname of the loki instance
   */
  hostname: string;

  /**
   * Whether to use http or https
   */
  protocol: "http" | "https";

  /**
   * The port of the loki instance
   */
  port: number;

  /**
   * The path to the push endpoint
   */
  path: string;

  /**
   * Headers to include
   */
  headers: OutgoingHttpHeaders;

  /**
   * The request timeout limit
   */
  timeout: number;
}

/**
 * A collection of labels that identifies a unique stream within loki
 */
export interface LokiStream {
  [label: string]: string;
}

/**
 * The value of a log line, a tuple of the current log time in unix epoch in nanoseconds, and the log line itself
 */
export type LokiValue = [timestampInUnixNano: string, logLine: string];

/**
 * A collection of loki log entries in the format that the `POST /loki/api/v1/push` api endpoint expects
 *
 * A single request to the endpoint supports multiple streams -> multiple entries to support log batching
 */
export interface LokiLogEntries {
  /**
   * A collection of log streams
   */
  streams: {
    /**
     * The stream label metadata
     */
    stream: LokiStream;

    /**
     * The log values for the aforementioned stream
     */
    values: LokiValue[];
  }[];
}

/**
 * The response from a request to a Loki api endpoint
 */
export interface LokiResponse {
  /**
   * The response data
   */
  data: string;

  /**
   * The HTTP status code, if any
   */
  statusCode?: number;

  /**
   * The HTTP status message, if any
   */
  statusMessage?: string;

  /**
   * The headers from the response
   */
  headers: IncomingHttpHeaders;
}
