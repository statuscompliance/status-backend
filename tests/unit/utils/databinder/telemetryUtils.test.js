import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateCorrelationIds,
  createHttpCallDetails,
  createSpanAttributes,
  createCallInfo,
  createResultMetrics,
  createDataExtractionMetadata,
  createLogMetadata,
  createTelemetryContext,
  createResponseMetadata
} from '../../../../src/utils/databinder/telemetryUtils.js';

describe('telemetryUtils', () => {
  describe('generateCorrelationIds', () => {
    it('should generate traceId and spanId', () => {
      const ids = generateCorrelationIds();
      
      expect(ids).toHaveProperty('traceId');
      expect(ids).toHaveProperty('spanId');
      expect(ids.traceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
      expect(ids.spanId).toMatch(/^span_[a-z0-9]+$/);
    });

    it('should generate unique IDs on each call', () => {
      const ids1 = generateCorrelationIds();
      const ids2 = generateCorrelationIds();
      
      expect(ids1.traceId).not.toBe(ids2.traceId);
      expect(ids1.spanId).not.toBe(ids2.spanId);
    });
  });

  describe('createHttpCallDetails', () => {
    it('should create details for rest-api datasource', () => {
      const config = {
        baseUrl: 'https://api.example.com',
        defaultEndpoint: '/users',
        timeout: 5000
      };
      const options = {
        endpoint: '/data',
        method: 'POST',
        timeout: 3000
      };

      const result = createHttpCallDetails('rest-api', config, options);

      expect(result).toEqual({
        httpMethod: 'POST',
        fullUrl: 'https://api.example.com/data',
        baseUrl: 'https://api.example.com',
        endpoint: '/data',
        timeout: 3000
      });
    });

    it('should use defaults for rest-api when options are minimal', () => {
      const config = {
        baseUrl: 'https://api.example.com',
        defaultEndpoint: '/default'
      };
      const options = {};

      const result = createHttpCallDetails('rest-api', config, options);

      expect(result).toEqual({
        httpMethod: 'GET',
        fullUrl: 'https://api.example.com/default',
        baseUrl: 'https://api.example.com',
        endpoint: '/default',
        timeout: 'default'
      });
    });

    it('should handle rest-api with requestOptions timeout', () => {
      const config = {
        baseUrl: 'https://api.example.com',
        requestOptions: {
          timeout: 10000
        }
      };
      const options = {};

      const result = createHttpCallDetails('rest-api', config, options);

      expect(result.timeout).toBe(10000);
    });

    it('should create details for microsoft-graph datasource', () => {
      const config = {
        scopes: ['User.Read', 'Mail.Read']
      };
      const options = {
        endpoint: '/users/me',
        method: 'GET',
        resource: 'users'
      };

      const result = createHttpCallDetails('microsoft-graph', config, options);

      expect(result).toEqual({
        httpMethod: 'GET',
        baseUrl: 'https://graph.microsoft.com',
        endpoint: '/users/me',
        graphResource: 'users',
        scopes: ['User.Read', 'Mail.Read']
      });
    });

    it('should use defaults for microsoft-graph', () => {
      const config = {};
      const options = {};

      const result = createHttpCallDetails('microsoft-graph', config, options);

      expect(result).toEqual({
        httpMethod: 'GET',
        baseUrl: 'https://graph.microsoft.com',
        endpoint: '/v1.0/me',
        graphResource: 'default',
        scopes: []
      });
    });

    it('should return null for unknown datasource types', () => {
      const result = createHttpCallDetails('unknown-type', {}, {});
      expect(result).toBeNull();
    });
  });

  describe('createSpanAttributes', () => {
    it('should create span attributes with http call details', () => {
      const httpCallDetails = {
        httpMethod: 'POST',
        fullUrl: 'https://api.example.com/data'
      };
      const datasource = {
        definitionId: 'rest-api',
        id: 'ds-123',
        environment: 'production',
        version: '1.0.0'
      };

      const result = createSpanAttributes({
        httpCallDetails,
        datasource,
        methodName: 'createData'
      });

      expect(result).toEqual({
        'http.method': 'POST',
        'http.url': 'https://api.example.com/data',
        'databinder.datasource': 'rest-api',
        'databinder.datasource.id': 'ds-123',
        'databinder.method': 'createData',
        'databinder.environment': 'production',
        'databinder.version': '1.0.0'
      });
    });

    it('should include error attributes when error is provided', () => {
      const httpCallDetails = {
        httpMethod: 'GET',
        fullUrl: 'https://api.example.com/data'
      };
      const datasource = {
        definitionId: 'rest-api',
        id: 'ds-123',
        environment: 'dev',
        version: '2.0.0'
      };

      const result = createSpanAttributes({
        httpCallDetails,
        datasource,
        methodName: 'getData',
        error: 'Connection timeout'
      });

      expect(result['error']).toBe(true);
      expect(result['error.message']).toBe('Connection timeout');
    });

    it('should use unknown for missing http call details', () => {
      const datasource = {
        definitionId: 'rest-api',
        id: 'ds-123',
        environment: 'test',
        version: '1.0.0'
      };

      const result = createSpanAttributes({
        httpCallDetails: null,
        datasource,
        methodName: 'test'
      });

      expect(result['http.method']).toBe('unknown');
      expect(result['http.url']).toBe('unknown');
    });
  });

  describe('createCallInfo', () => {
    it('should create call info for successful call', () => {
      const callStartTime = new Date('2023-01-01T10:00:00Z');
      const callEndTime = new Date('2023-01-01T10:00:02Z');
      const httpCallDetails = { httpMethod: 'GET', fullUrl: 'https://api.example.com' };

      const result = createCallInfo({
        executionId: 'exec-123',
        executionDuration: 2000,
        callStartTime,
        callEndTime,
        httpCallDetails,
        requestId: 'req-456',
        traceId: 'trace-789',
        spanId: 'span-012',
        spanAttributes: { 'http.method': 'GET' }
      });

      expect(result).toEqual({
        executionId: 'exec-123',
        executionDuration: 2000,
        callStartTime: '2023-01-01T10:00:00.000Z',
        callEndTime: '2023-01-01T10:00:02.000Z',
        httpCallDetails,
        requestId: 'req-456',
        traceId: 'trace-789',
        spanId: 'span-012',
        spanAttributes: { 'http.method': 'GET' }
      });
    });

    it('should include error information for failed calls', () => {
      const callStartTime = new Date('2023-01-01T10:00:00Z');
      const callEndTime = new Date('2023-01-01T10:00:02Z');
      const errorContext = {
        statusCode: 500,
        message: 'Internal Server Error'
      };

      const result = createCallInfo({
        executionId: 'exec-123',
        executionDuration: 2000,
        callStartTime,
        callEndTime,
        httpCallDetails: null,
        requestId: 'req-456',
        traceId: 'trace-789',
        spanId: 'span-012',
        spanAttributes: {},
        failed: true,
        errorContext
      });

      expect(result.failed).toBe(true);
      expect(result.errorTime).toBe('2023-01-01T10:00:02.000Z');
      expect(result.errorContext).toEqual(errorContext);
    });

    it('should not include error fields for successful calls', () => {
      const callStartTime = new Date('2023-01-01T10:00:00Z');
      const callEndTime = new Date('2023-01-01T10:00:02Z');

      const result = createCallInfo({
        executionId: 'exec-123',
        executionDuration: 2000,
        callStartTime,
        callEndTime,
        httpCallDetails: null,
        requestId: 'req-456',
        traceId: 'trace-789',
        spanId: 'span-012',
        spanAttributes: {}
      });

      expect(result.failed).toBeUndefined();
      expect(result.errorTime).toBeUndefined();
      expect(result.errorContext).toBeUndefined();
    });
  });

  describe('createResultMetrics', () => {
    it('should create metrics for object result', () => {
      const result = { id: 1, name: 'Test' };
      
      const metrics = createResultMetrics(result);

      expect(metrics.responseSize).toBeGreaterThan(0);
      expect(metrics.isArray).toBe(false);
      expect(metrics.itemCount).toBeNull();
    });

    it('should create metrics for array result with item count', () => {
      const result = [
        { id: 1, name: 'Test1' },
        { id: 2, name: 'Test2' },
        { id: 3, name: 'Test3' }
      ];
      
      const metrics = createResultMetrics(result);

      expect(metrics.responseSize).toBeGreaterThan(0);
      expect(metrics.isArray).toBe(true);
      expect(metrics.itemCount).toBe(3);
    });

    it('should create metrics for empty array', () => {
      const result = [];
      
      const metrics = createResultMetrics(result);

      expect(metrics.isArray).toBe(true);
      expect(metrics.itemCount).toBe(0);
    });

    it('should create metrics for primitive values', () => {
      const metrics1 = createResultMetrics('string');
      expect(metrics1.isArray).toBe(false);

      const metrics2 = createResultMetrics(123);
      expect(metrics2.isArray).toBe(false);
    });
  });

  describe('createDataExtractionMetadata', () => {
    it('should detect when data was extracted', () => {
      const originalResult = {
        status: 200,
        data: { id: 1, name: 'Test' }
      };
      const extractedResult = { id: 1, name: 'Test' };

      const metadata = createDataExtractionMetadata(originalResult, extractedResult);

      expect(metadata.wasExtracted).toBe(true);
      expect(metadata.originalHadDataProperty).toBe(true);
      expect(metadata.extractedSize).toBeGreaterThan(0);
    });

    it('should detect when data was not extracted', () => {
      const result = { id: 1, name: 'Test' };

      const metadata = createDataExtractionMetadata(result, result);

      expect(metadata.wasExtracted).toBe(false);
      expect(metadata.originalHadDataProperty).toBe(false);
    });

    it('should handle null values', () => {
      const metadata1 = createDataExtractionMetadata(null, null);
      expect(metadata1.wasExtracted).toBe(false);
      expect(metadata1.originalHadDataProperty).toBeNull();
    });

    it('should detect data property with null value', () => {
      const originalResult = { data: null };
      const extractedResult = null;

      const metadata = createDataExtractionMetadata(originalResult, extractedResult);

      expect(metadata.originalHadDataProperty).toBe(true);
      expect(metadata.wasExtracted).toBe(true); // Different objects even with same null value
      expect(typeof metadata.extractedSize).toBe('number');
    });
  });

  describe('createLogMetadata', () => {
    it('should create log metadata for successful operation', () => {
      const metadata = createLogMetadata({
        datasourceId: 'ds-123',
        methodName: 'getData',
        userId: 'user-456',
        operationType: 'read',
        success: true
      });

      expect(metadata).toEqual({
        datasourceId: 'ds-123',
        methodName: 'getData',
        userId: 'user-456',
        operationType: 'read',
        success: true
      });
    });

    it('should include error message for failed operation', () => {
      const metadata = createLogMetadata({
        datasourceId: 'ds-123',
        methodName: 'createData',
        userId: 'user-456',
        operationType: 'write',
        success: false,
        errorMessage: 'Validation failed'
      });

      expect(metadata).toEqual({
        datasourceId: 'ds-123',
        methodName: 'createData',
        userId: 'user-456',
        operationType: 'write',
        success: false,
        errorMessage: 'Validation failed'
      });
    });

    it('should not include error message when not provided', () => {
      const metadata = createLogMetadata({
        datasourceId: 'ds-123',
        methodName: 'test',
        userId: 'user-456',
        operationType: 'test',
        success: true
      });

      expect(metadata.errorMessage).toBeUndefined();
    });
  });

  describe('createTelemetryContext', () => {
    it('should create telemetry context with all fields', () => {
      const context = createTelemetryContext({
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: 'parent-789',
        operationName: 'getDatasourceData',
        correlationId: 'corr-012'
      });

      expect(context).toEqual({
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: 'parent-789',
        operationName: 'getDatasourceData',
        correlationId: 'corr-012'
      });
    });

    it('should handle null parentSpanId', () => {
      const context = createTelemetryContext({
        traceId: 'trace-123',
        spanId: 'span-456',
        parentSpanId: null,
        operationName: 'testOperation',
        correlationId: 'corr-012'
      });

      expect(context.parentSpanId).toBeNull();
    });
  });

  describe('createResponseMetadata', () => {
    let mockDate;

    beforeEach(() => {
      mockDate = new Date('2023-01-01T12:00:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
    });

    it('should create comprehensive response metadata', () => {
      const datasource = {
        definitionId: 'rest-api',
        environment: 'production',
        version: '1.0.0'
      };
      const finalResult = { id: 1, name: 'Test' };
      const originalResult = { status: 200, data: { id: 1, name: 'Test' } };
      const extractedResult = { id: 1, name: 'Test' };
      const propertyMapping = { oldName: 'newName' };
      const logMetadata = { operationType: 'read' };
      const telemetryContext = { traceId: 'trace-123' };

      const metadata = createResponseMetadata({
        datasource,
        instanceId: 'instance-123',
        finalResult,
        originalResult,
        extractedResult,
        propertyMapping,
        logMetadata,
        telemetryContext
      });

      expect(metadata.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(metadata.datasourceType).toBe('rest-api');
      expect(metadata.environment).toBe('production');
      expect(metadata.instanceId).toBe('instance-123');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.resultMetrics).toBeDefined();
      expect(metadata.propertyMapping).toEqual(propertyMapping);
      expect(metadata.dataExtraction).toBeDefined();
      expect(metadata.logMetadata).toEqual(logMetadata);
      expect(metadata.telemetryContext).toEqual(telemetryContext);

      vi.useRealTimers();
    });
  });
});
