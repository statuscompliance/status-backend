import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeDatasource,
  checkOwnership,
  normalizeName,
  generateInstanceId,
  generateExecutionId,
  extractResultData
} from '../../../../../src/utils/databinder/datasource/datasourceUtils.js';

describe('datasourceUtils', () => {
  describe('sanitizeDatasource', () => {
    const mockDatasource = {
      id: 'ds-123',
      name: 'Test Datasource',
      definitionId: 'rest-api',
      config: {
        baseUrl: 'https://api.example.com',
        apiKey: 'secret-key-123'
      },
      description: 'A test datasource',
      environment: 'production',
      isActive: true,
      createdBy: 'user-456',
      version: '1.0.0',
      lastTestedAt: '2023-01-01T00:00:00Z',
      testStatus: 'success',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      ownerId: 'user-456',
      internalField: 'should-not-be-included'
    };

    it('should sanitize datasource and hide config by default', () => {
      const result = sanitizeDatasource(mockDatasource);

      expect(result).toEqual({
        id: 'ds-123',
        name: 'Test Datasource',
        definitionId: 'rest-api',
        config: '***HIDDEN***',
        description: 'A test datasource',
        environment: 'production',
        isActive: true,
        createdBy: 'user-456',
        version: '1.0.0',
        lastTestedAt: '2023-01-01T00:00:00Z',
        testStatus: 'success',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      });
      expect(result.internalField).toBeUndefined();
    });

    it('should include config when includeConfig is true', () => {
      const result = sanitizeDatasource(mockDatasource, true);

      expect(result.config).toEqual({
        baseUrl: 'https://api.example.com',
        apiKey: 'secret-key-123'
      });
    });

    it('should handle datasource with minimal fields', () => {
      const minimalDatasource = {
        id: 'ds-123',
        name: 'Minimal',
        definitionId: 'rest-api',
        config: {}
      };

      const result = sanitizeDatasource(minimalDatasource);

      expect(result.id).toBe('ds-123');
      expect(result.name).toBe('Minimal');
      expect(result.config).toBe('***HIDDEN***');
    });
  });

  describe('checkOwnership', () => {
    it('should return true when user owns the datasource', () => {
      const datasource = { ownerId: 'user-123' };
      const userId = 'user-123';

      expect(checkOwnership(datasource, userId)).toBe(true);
    });

    it('should return false when user does not own the datasource', () => {
      const datasource = { ownerId: 'user-123' };
      const userId = 'user-456';

      expect(checkOwnership(datasource, userId)).toBe(false);
    });

    it('should return false when datasource is null', () => {
      expect(checkOwnership(null, 'user-123')).toBeFalsy();
    });

    it('should return false when datasource is undefined', () => {
      expect(checkOwnership(undefined, 'user-123')).toBeFalsy();
    });

    it('should return false when ownerId is missing', () => {
      const datasource = { id: 'ds-123' };
      expect(checkOwnership(datasource, 'user-123')).toBe(false);
    });
  });

  describe('normalizeName', () => {
    it('should convert name to lowercase', () => {
      expect(normalizeName('MyDatasource')).toBe('mydatasource');
      expect(normalizeName('TEST')).toBe('test');
    });

    it('should replace spaces with underscores', () => {
      expect(normalizeName('My Datasource')).toBe('my_datasource');
      expect(normalizeName('Test Data Source')).toBe('test_data_source');
    });

    it('should replace multiple consecutive spaces with single underscore', () => {
      expect(normalizeName('My    Datasource')).toBe('my_datasource');
    });

    it('should handle names with leading/trailing spaces', () => {
      expect(normalizeName('  My Datasource  ')).toBe('_my_datasource_');
    });

    it('should handle empty string', () => {
      expect(normalizeName('')).toBe('');
    });

    it('should handle names that are already normalized', () => {
      expect(normalizeName('my_datasource')).toBe('my_datasource');
    });
  });

  describe('generateInstanceId', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
    });

    it('should generate instance ID with userId and normalized name', () => {
      const userId = 'user-123';
      const normalizedName = 'my_datasource';
      
      const result = generateInstanceId(userId, normalizedName);
      
      expect(result).toMatch(/^user-123_my_datasource_\d+$/);
      expect(result).toBe('user-123_my_datasource_1672531200000');
    });

    it('should generate instance ID with prefix', () => {
      const userId = 'user-123';
      const normalizedName = 'my_datasource';
      const prefix = 'test';
      
      const result = generateInstanceId(userId, normalizedName, prefix);
      
      expect(result).toMatch(/^test_user-123_my_datasource_\d+$/);
      expect(result).toBe('test_user-123_my_datasource_1672531200000');
    });

    it('should generate different IDs at different times', () => {
      const id1 = generateInstanceId('user-123', 'datasource');
      
      vi.setSystemTime(new Date('2023-01-01T00:00:01Z'));
      const id2 = generateInstanceId('user-123', 'datasource');
      
      expect(id1).not.toBe(id2);
    });

    afterEach(() => {
      vi.useRealTimers();
    });
  });

  describe('generateExecutionId', () => {
    it('should generate execution ID with datasource ID', () => {
      const datasourceId = 'ds-123';
      
      const result = generateExecutionId(datasourceId);
      
      expect(result).toMatch(/^exec_ds-123_\d+_[a-z0-9]+$/);
    });

    it('should generate execution ID with custom timestamp', () => {
      const datasourceId = 'ds-123';
      const timestamp = 1672531200000;
      
      const result = generateExecutionId(datasourceId, timestamp);
      
      expect(result).toMatch(/^exec_ds-123_1672531200000_[a-z0-9]+$/);
    });

    it('should generate unique IDs on each call', () => {
      const id1 = generateExecutionId('ds-123');
      const id2 = generateExecutionId('ds-123');
      
      expect(id1).not.toBe(id2);
    });

    it('should handle different datasource IDs', () => {
      const id1 = generateExecutionId('ds-123');
      const id2 = generateExecutionId('ds-456');
      
      expect(id1).toContain('ds-123');
      expect(id2).toContain('ds-456');
    });
  });

  describe('extractResultData', () => {
    it('should extract data property from result object', () => {
      const result = {
        status: 200,
        data: {
          users: [{ id: 1, name: 'John' }]
        },
        headers: {}
      };

      const extracted = extractResultData(result);
      
      expect(extracted).toEqual({
        users: [{ id: 1, name: 'John' }]
      });
    });

    it('should return result as-is if no data property exists', () => {
      const result = {
        users: [{ id: 1, name: 'John' }]
      };

      const extracted = extractResultData(result);
      
      expect(extracted).toEqual(result);
    });

    it('should extract data even if data is null', () => {
      const result = {
        status: 404,
        data: null
      };

      const extracted = extractResultData(result);
      
      expect(extracted).toBeNull();
    });

    it('should not extract when data is undefined but property exists', () => {
      const result = {
        status: 204,
        data: undefined
      };

      const extracted = extractResultData(result);
      
      expect(extracted).toBe(result);
    });

    it('should return primitive values as-is', () => {
      expect(extractResultData('string')).toBe('string');
      expect(extractResultData(123)).toBe(123);
      expect(extractResultData(true)).toBe(true);
      expect(extractResultData(null)).toBeNull();
      expect(extractResultData(undefined)).toBeUndefined();
    });

    it('should return arrays as-is if no data property', () => {
      const result = [1, 2, 3];
      
      const extracted = extractResultData(result);
      
      expect(extracted).toEqual([1, 2, 3]);
    });

    it('should extract data when data is an empty object', () => {
      const result = {
        status: 200,
        data: {}
      };

      const extracted = extractResultData(result);
      
      expect(extracted).toEqual({});
    });

    it('should extract data when data is an empty array', () => {
      const result = {
        status: 200,
        data: []
      };

      const extracted = extractResultData(result);
      
      expect(extracted).toEqual([]);
    });
  });
});
