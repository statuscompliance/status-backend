import { describe, it, expect, vi } from 'vitest';
import {
  getMethodDescription,
  getGenericMethodDescription,
  createMethodsInfo
} from '../../../../src/utils/databinder/methodDescriptions.js';

describe('methodDescriptions', () => {
  describe('getGenericMethodDescription', () => {
    it('should return description for known method names', () => {
      expect(getGenericMethodDescription('default', 'MyAPI')).toBe('Default method for MyAPI datasource');
      expect(getGenericMethodDescription('test', 'MyAPI')).toBe('Test connectivity for MyAPI');
      expect(getGenericMethodDescription('get', 'MyAPI')).toBe('HTTP GET request');
      expect(getGenericMethodDescription('post', 'MyAPI')).toBe('HTTP POST request');
      expect(getGenericMethodDescription('put', 'MyAPI')).toBe('HTTP PUT request');
      expect(getGenericMethodDescription('patch', 'MyAPI')).toBe('HTTP PATCH request');
      expect(getGenericMethodDescription('delete', 'MyAPI')).toBe('HTTP DELETE request');
    });

    it('should return description for data operation methods', () => {
      expect(getGenericMethodDescription('getAll', 'MyAPI')).toBe('Retrieve all items');
      expect(getGenericMethodDescription('getById', 'MyAPI')).toBe('Retrieve item by ID');
      expect(getGenericMethodDescription('create', 'MyAPI')).toBe('Create new item');
      expect(getGenericMethodDescription('update', 'MyAPI')).toBe('Update existing item');
      expect(getGenericMethodDescription('search', 'MyAPI')).toBe('Search items with criteria');
    });

    it('should return description for specific domain methods', () => {
      expect(getGenericMethodDescription('getUsers', 'MyAPI')).toBe('Retrieve user information');
      expect(getGenericMethodDescription('getGroups', 'MyAPI')).toBe('Retrieve group information');
      expect(getGenericMethodDescription('getEvents', 'MyAPI')).toBe('Retrieve events');
      expect(getGenericMethodDescription('authenticate', 'MyAPI')).toBe('Perform authentication');
    });

    it('should return generic description for unknown methods', () => {
      const result = getGenericMethodDescription('customMethod', 'MyAPI');
      expect(result).toBe('Execute customMethod method on MyAPI');
    });
  });

  describe('getMethodDescription', () => {
    it('should return description from methodDescriptions object if available', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          name: 'REST API',
          methodDescriptions: {
            default: 'Custom default description',
            getData: 'Fetches data from API'
          }
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'default');
      expect(result).toBe('Custom default description');

      const result2 = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'getData');
      expect(result2).toBe('Fetches data from API');
    });

    it('should return description from availableMethods array if methodDescriptions not available', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          name: 'REST API',
          availableMethods: [
            { name: 'getData', description: 'Get data from REST endpoint' },
            { name: 'postData', description: 'Post data to REST endpoint' }
          ]
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'getData');
      expect(result).toBe('Get data from REST endpoint');
    });

    it('should fall back to generic description if method not found in definition', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          name: 'REST API',
          methodDescriptions: {
            getData: 'Get data'
          }
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'unknownMethod');
      expect(result).toBe('Execute unknownMethod method on REST API');
    });

    it('should use generic description if definition not found', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          name: 'REST API'
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'unknown-api', 'get');
      expect(result).toBe('HTTP GET request');
    });

    it('should handle definitions without name field', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          methodDescriptions: {
            test: 'Test method'
          }
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'unknown');
      expect(result).toBe('Execute unknown method on rest-api');
    });

    it('should handle errors gracefully and return generic description', () => {
      const listDatasourceDefinitions = vi.fn(() => {
        throw new Error('Database error');
      });

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'get');
      expect(result).toBe('HTTP GET request');
    });

    it('should handle availableMethods with non-object entries', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          name: 'REST API',
          availableMethods: [
            'stringMethod',
            { name: 'getData', description: 'Get data' },
            null
          ]
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'getData');
      expect(result).toBe('Get data');
    });

    it('should prioritize methodDescriptions over availableMethods', () => {
      const listDatasourceDefinitions = vi.fn(() => [
        {
          id: 'rest-api',
          name: 'REST API',
          methodDescriptions: {
            getData: 'Description from methodDescriptions'
          },
          availableMethods: [
            { name: 'getData', description: 'Description from availableMethods' }
          ]
        }
      ]);

      const result = getMethodDescription(listDatasourceDefinitions, 'rest-api', 'getData');
      expect(result).toBe('Description from methodDescriptions');
    });
  });

  describe('createMethodsInfo', () => {
    it('should create methods info object with descriptions', () => {
      const instance = {
        methods: {
          get: () => {},
          post: () => {},
          delete: () => {}
        }
      };

      const getDescriptionFn = vi.fn((methodName) => `Description for ${methodName}`);

      const result = createMethodsInfo(instance, getDescriptionFn);

      expect(result).toEqual({
        get: {
          available: true,
          type: 'function',
          description: 'Description for get'
        },
        post: {
          available: true,
          type: 'function',
          description: 'Description for post'
        },
        delete: {
          available: true,
          type: 'function',
          description: 'Description for delete'
        }
      });

      expect(getDescriptionFn).toHaveBeenCalledTimes(3);
      expect(getDescriptionFn).toHaveBeenCalledWith('get');
      expect(getDescriptionFn).toHaveBeenCalledWith('post');
      expect(getDescriptionFn).toHaveBeenCalledWith('delete');
    });

    it('should handle empty methods object', () => {
      const instance = {
        methods: {}
      };

      const getDescriptionFn = vi.fn();

      const result = createMethodsInfo(instance, getDescriptionFn);

      expect(result).toEqual({});
      expect(getDescriptionFn).not.toHaveBeenCalled();
    });

    it('should correctly identify method types', () => {
      const instance = {
        methods: {
          asyncMethod: async () => {},
          syncMethod: () => {},
          arrowFunction: () => 'result'
        }
      };

      const getDescriptionFn = vi.fn(() => 'description');

      const result = createMethodsInfo(instance, getDescriptionFn);

      expect(result.asyncMethod.type).toBe('function');
      expect(result.syncMethod.type).toBe('function');
      expect(result.arrowFunction.type).toBe('function');
    });
  });
});
