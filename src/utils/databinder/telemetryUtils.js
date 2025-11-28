import { randomBytes } from 'crypto';

/**
 * Telemetry and logging utilities for datasource operations
 */

/**
 * Generates correlation IDs for tracing
 * Uses cryptographically secure random values
 * @returns {Object} Trace and span IDs
 */
export const generateCorrelationIds = () => ({
  traceId: `trace_${Date.now()}_${randomBytes(4).toString('hex')}`,
  spanId: `span_${randomBytes(4).toString('hex')}`
});

/**
 * Creates HTTP call details for different datasource types
 * @param {string} definitionId - Datasource definition ID
 * @param {Object} config - Datasource configuration
 * @param {Object} options - Request options
 * @returns {Object|null} HTTP call details
 */
export const createHttpCallDetails = (definitionId, config, options) => {
  if (definitionId === 'rest-api') {
    const baseUrl = config.baseUrl || 'unknown';
    const endpoint = options.endpoint || config.defaultEndpoint || '';
    const httpMethod = options.method || 'GET';
    
    return {
      httpMethod,
      fullUrl: baseUrl + endpoint,
      baseUrl,
      endpoint,
      timeout: options.timeout || config.timeout || config.requestOptions?.timeout || 'default'
    };
  } 
  
  if (definitionId === 'microsoft-graph') {
    return {
      httpMethod: options.method || 'GET',
      baseUrl: 'https://graph.microsoft.com',
      endpoint: options.endpoint || '/v1.0/me',
      graphResource: options.resource || 'default',
      scopes: config.scopes || []
    };
  }

  return null;
};

/**
 * Creates span attributes for OpenTelemetry-style tracing
 * @param {Object} params - Parameters for span attributes
 * @returns {Object} Span attributes
 */
export const createSpanAttributes = ({
  httpCallDetails,
  datasource,
  methodName,
  error = null
}) => {
  const attributes = {
    'http.method': httpCallDetails?.httpMethod || 'unknown',
    'http.url': httpCallDetails?.fullUrl || 'unknown',
    'databinder.datasource': datasource.definitionId,
    'databinder.datasource.id': datasource.id,
    'databinder.method': methodName,
    'databinder.environment': datasource.environment,
    'databinder.version': datasource.version
  };

  if (error) {
    attributes['error'] = true;
    attributes['error.message'] = error;
  }

  return attributes;
};

/**
 * Creates comprehensive call info object
 * @param {Object} params - Parameters for call info
 * @returns {Object} Call info object
 */
export const createCallInfo = ({
  executionId,
  executionDuration,
  callStartTime,
  callEndTime,
  httpCallDetails,
  requestId,
  traceId,
  spanId,
  spanAttributes,
  failed = false,
  errorContext = null
}) => {
  const callInfo = {
    executionId,
    executionDuration,
    callStartTime: callStartTime.toISOString(),
    callEndTime: callEndTime.toISOString(),
    httpCallDetails,
    requestId,
    traceId,
    spanId,
    spanAttributes
  };

  if (failed) {
    callInfo.failed = true;
    callInfo.errorTime = callEndTime.toISOString();
    if (errorContext) {
      callInfo.errorContext = errorContext;
    }
  }

  return callInfo;
};

/**
 * Creates result metrics for response analysis
 * @param {any} result - The result data
 * @returns {Object} Result metrics
 */
export const createResultMetrics = (result) => ({
  responseSize: JSON.stringify(result).length,
  isArray: Array.isArray(result),
  itemCount: Array.isArray(result) ? result.length : null
});

/**
 * Creates data extraction metadata
 * @param {any} originalResult - Original result
 * @param {any} extractedResult - Extracted result
 * @returns {Object} Data extraction metadata
 */
export const createDataExtractionMetadata = (originalResult, extractedResult) => ({
  wasExtracted: originalResult !== extractedResult,
  originalHadDataProperty: originalResult && typeof originalResult === 'object' && originalResult.data !== undefined,
  extractedSize: JSON.stringify(extractedResult).length
});

/**
 * Creates log metadata for structured logging
 * @param {Object} params - Parameters for log metadata
 * @returns {Object} Log metadata
 */
export const createLogMetadata = ({
  datasourceId,
  methodName,
  userId,
  operationType,
  success,
  errorMessage = null
}) => {
  const metadata = {
    datasourceId,
    methodName,
    userId,
    operationType,
    success
  };

  if (errorMessage) {
    metadata.errorMessage = errorMessage;
  }

  return metadata;
};

/**
 * Creates telemetry context for distributed tracing
 * @param {Object} params - Parameters for telemetry context
 * @returns {Object} Telemetry context
 */
export const createTelemetryContext = ({
  traceId,
  spanId,
  parentSpanId = null,
  operationName,
  correlationId
}) => ({
  traceId,
  spanId,
  parentSpanId,
  operationName,
  correlationId
});

/**
 * Creates comprehensive metadata object for responses
 * @param {Object} params - Parameters for metadata creation
 * @returns {Object} Complete metadata object
 */
export const createResponseMetadata = ({
  datasource,
  instanceId,
  finalResult,
  originalResult,
  extractedResult,
  propertyMapping,
  logMetadata,
  telemetryContext
}) => ({
  timestamp: new Date().toISOString(),
  datasourceType: datasource.definitionId,
  environment: datasource.environment,
  instanceId,
  version: datasource.version,
  resultMetrics: createResultMetrics(finalResult),
  propertyMapping,
  dataExtraction: createDataExtractionMetadata(originalResult, extractedResult),
  logMetadata,
  telemetryContext
});
