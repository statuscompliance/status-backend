import { describe, it, expect, vi } from 'vitest';
import {
  executeTestMethod,
  performPrimaryTest,
  performAdditionalTests,
  determineOverallTestStatus,
  createTestSummary,
  getAdditionalTestMethods,
  createTestDetails,
  createTestResults
} from '../../../../../src/utils/databinder/datasource/datasourceTesting.js';

describe('datasourceTesting', () => {
  describe('executeTestMethod', () => {
    it('should return success for successful method execution', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockResolvedValue({ data: 'success' })
        }
      };

      const result = await executeTestMethod(instance, 'test', 'Test connectivity');

      expect(result).toEqual({
        method: 'test',
        status: 'success',
        description: 'Test connectivity',
        result: { data: 'success' }
      });
    });

    it('should return failure when method throws error', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockRejectedValue(new Error('Connection timeout'))
        }
      };

      const result = await executeTestMethod(instance, 'test', 'Test connectivity');

      expect(result).toEqual({
        method: 'test',
        status: 'failure',
        description: 'Test connectivity',
        error: 'Connection timeout'
      });
    });

    it('should detect HTTP errors with ok field set to false', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            data: 'Authentication failed'
          })
        }
      };

      const result = await executeTestMethod(instance, 'test', 'Test connectivity');

      expect(result.status).toBe('failure');
      expect(result.error).toContain('HTTP 401');
      expect(result.error).toContain('Unauthorized');
    });

    it('should detect HTTP errors with bad status code', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockResolvedValue({
            status: 500,
            statusText: 'Internal Server Error'
          })
        }
      };

      const result = await executeTestMethod(instance, 'test', 'Test connectivity');

      expect(result.status).toBe('failure');
      expect(result.error).toContain('500');
    });

    it('should pass options to the method', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: 'success' });
      const instance = {
        methods: { getData: mockFn }
      };
      const options = { endpoint: '/users', method: 'GET' };

      await executeTestMethod(instance, 'getData', 'Get data', options);

      expect(mockFn).toHaveBeenCalledWith(options);
    });

    it('should handle successful response with status 2xx', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockResolvedValue({
            status: 200,
            ok: true,
            data: { success: true }
          })
        }
      };

      const result = await executeTestMethod(instance, 'test', 'Test');

      expect(result.status).toBe('success');
    });
  });

  describe('performPrimaryTest', () => {
    it('should use test method if available', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockResolvedValue({ data: 'test success' }),
          default: vi.fn().mockResolvedValue({ data: 'default success' })
        }
      };

      const result = await performPrimaryTest(instance);

      expect(result.primaryTestMethod).toBe('test');
      expect(result.testResult.status).toBe('success');
      expect(instance.methods.test).toHaveBeenCalled();
      expect(instance.methods.default).not.toHaveBeenCalled();
    });

    it('should fallback to default method if test method fails', async () => {
      const instance = {
        methods: {
          test: vi.fn().mockRejectedValue(new Error('Test failed')),
          default: vi.fn().mockResolvedValue({ status: 200, data: 'default success' })
        }
      };

      const result = await performPrimaryTest(instance);

      expect(result.primaryTestMethod).toBe('default');
      expect(result.testResult.status).toBe('success');
    });

    it('should use default method if test method is not available', async () => {
      const instance = {
        methods: {
          default: vi.fn().mockResolvedValue({ status: 200, data: 'success' })
        }
      };

      const result = await performPrimaryTest(instance);

      expect(result.primaryTestMethod).toBe('default');
      expect(result.testResult.status).toBe('success');
    });

    it('should use resourceType as endpoint for default method', async () => {
      const mockFn = vi.fn().mockResolvedValue({ status: 200, data: 'success' });
      const instance = {
        methods: { default: mockFn }
      };
      const datasourceConfig = { resourceType: '/users' };

      await performPrimaryTest(instance, datasourceConfig);

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/users'
        })
      );
    });

    it('should use defaultEndpoint if resourceType not available', async () => {
      const mockFn = vi.fn().mockResolvedValue({ status: 200, data: 'success' });
      const instance = {
        methods: { default: mockFn }
      };
      const datasourceConfig = { defaultEndpoint: '/api/data' };

      await performPrimaryTest(instance, datasourceConfig);

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/api/data'
        })
      );
    });
  });

  describe('performAdditionalTests', () => {
    it('should execute additional test methods', async () => {
      const instance = {
        methods: {
          getAll: vi.fn().mockResolvedValue({ data: [] }),
          search: vi.fn().mockResolvedValue({ data: [] })
        }
      };
      const availableMethods = ['getAll', 'search'];

      const results = await performAdditionalTests(instance, 'rest-api', availableMethods);

      expect(results).toHaveLength(1); // Only one additional test
      expect(results[0].method).toBe('getAll');
    });

    it('should skip methods that are not available', async () => {
      const instance = {
        methods: {
          default: vi.fn()
        }
      };
      const availableMethods = ['default', 'nonExistent'];

      const results = await performAdditionalTests(instance, 'rest-api', availableMethods);

      expect(results).toHaveLength(0);
    });

    it('should pass endpoint from datasourceConfig', async () => {
      const mockFn = vi.fn().mockResolvedValue({ data: [] });
      const instance = {
        methods: { getAll: mockFn }
      };
      const availableMethods = ['getAll'];
      const datasourceConfig = { resourceType: '/users' };

      await performAdditionalTests(instance, 'rest-api', availableMethods, datasourceConfig);

      expect(mockFn).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: '/users' })
      );
    });
  });

  describe('determineOverallTestStatus', () => {
    it('should return success if at least one test succeeds', () => {
      const results = [
        { method: 'default', status: 'success' },
        { method: 'getAll', status: 'failure' }
      ];

      const status = determineOverallTestStatus(results);

      expect(status).toBe('success');
    });

    it('should return failure if all tests fail', () => {
      const results = [
        { method: 'default', status: 'failure' },
        { method: 'test', status: 'failure' }
      ];

      const status = determineOverallTestStatus(results);

      expect(status).toBe('failure');
    });

    it('should return failure for empty results', () => {
      const status = determineOverallTestStatus([]);

      expect(status).toBe('failure');
    });

    it('should return failure when primary test fails and no other test succeeds', () => {
      const results = [
        { method: 'default', status: 'failure' },
        { method: 'getAll', status: 'failure' }
      ];

      const status = determineOverallTestStatus(results);

      expect(status).toBe('failure');
    });

    it('should return success when primary test fails but another test succeeds', () => {
      const results = [
        { method: 'default', status: 'failure' },
        { method: 'getAll', status: 'success' }
      ];

      const status = determineOverallTestStatus(results);

      expect(status).toBe('success');
    });
  });

  describe('createTestSummary', () => {
    it('should create summary with correct counts', () => {
      const testsPerformed = [
        { method: 'test', status: 'success' },
        { method: 'default', status: 'success' },
        { method: 'getAll', status: 'failure' }
      ];

      const summary = createTestSummary(testsPerformed, 'test');

      expect(summary).toEqual({
        totalTests: 3,
        successfulTests: 2,
        failedTests: 1,
        primaryMethod: 'test'
      });
    });

    it('should handle empty test array', () => {
      const summary = createTestSummary([], 'default');

      expect(summary).toEqual({
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        primaryMethod: 'default'
      });
    });
  });

  describe('getAdditionalTestMethods', () => {
    it('should return safe test methods that are available', () => {
      const availableMethods = ['getAll', 'get', 'post', 'delete'];

      const result = getAdditionalTestMethods('rest-api', availableMethods);

      expect(result).toHaveLength(1);
      expect(result[0].methodName).toBe('getAll');
    });

    it('should return get method if getAll not available', () => {
      const availableMethods = ['get', 'post', 'delete'];

      const result = getAdditionalTestMethods('rest-api', availableMethods);

      expect(result).toHaveLength(1);
      expect(result[0].methodName).toBe('get');
    });

    it('should return empty array if no safe methods available', () => {
      const availableMethods = ['post', 'delete', 'update'];

      const result = getAdditionalTestMethods('rest-api', availableMethods);

      expect(result).toHaveLength(0);
    });

    it('should include datasource type in description', () => {
      const availableMethods = ['search'];

      const result = getAdditionalTestMethods('microsoft-graph', availableMethods);

      expect(result[0].description).toContain('microsoft-graph');
    });
  });

  describe('createTestDetails', () => {
    it('should create test details object', () => {
      const testsPerformed = [
        { method: 'test', status: 'success' }
      ];

      const details = createTestDetails('rest-api', ['test', 'default'], testsPerformed);

      expect(details).toEqual({
        datasourceType: 'rest-api',
        availableMethods: ['test', 'default'],
        testsPerformed
      });
    });
  });

  describe('createTestResults', () => {
    it('should create test results object from primary and additional results', () => {
      const primaryResult = {
        method: 'default',
        status: 'success',
        result: { data: 'success' }
      };
      const additionalResults = [
        {
          method: 'getAll',
          status: 'success',
          result: { data: [] }
        },
        {
          method: 'search',
          status: 'failure',
          error: 'Not found'
        }
      ];

      const testResults = createTestResults(primaryResult, additionalResults);

      expect(testResults).toEqual({
        default: {
          status: 'success',
          result: { data: 'success' }
        },
        getAll: {
          status: 'success',
          result: { data: [] }
        },
        search: {
          status: 'failure',
          error: 'Not found'
        }
      });
    });

    it('should handle null primary result', () => {
      const additionalResults = [
        { method: 'test', status: 'success', result: {} }
      ];

      const testResults = createTestResults(null, additionalResults);

      expect(testResults).toEqual({
        test: {
          status: 'success',
          result: {}
        }
      });
    });

    it('should handle empty additional results', () => {
      const primaryResult = {
        method: 'default',
        status: 'success',
        result: {}
      };

      const testResults = createTestResults(primaryResult, []);

      expect(testResults).toEqual({
        default: {
          status: 'success',
          result: {}
        }
      });
    });
  });
});
