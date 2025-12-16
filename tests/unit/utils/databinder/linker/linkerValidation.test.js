import { describe, it, expect, vi } from 'vitest';
import {
  validateLinkerInput,
  validateLinkerUpdateInput,
  validateDatasourcesExist,
  validateDatasourceConfigs,
  normalizeDatasourceConfigs
} from '../../../../../src/utils/databinder/linker/linkerValidation.js';

describe('linkerValidation', () => {
  describe('validateLinkerInput', () => {
    it('should validate correct input', () => {
      const input = {
        datasourceIds: ['ds-1', 'ds-2', 'ds-3'],
        defaultMethodName: 'getData',
        datasourceConfigs: {
          'ds-1': { methodConfig: { methodName: 'getUsers' } },
          'ds-2': { methodConfig: { methodName: 'getOrders' } },
          'ds-3': { methodConfig: { methodName: 'getProducts' } }
        }
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject input with missing datasourceIds', () => {
      const input = {
        defaultMethodName: 'getData'
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceIds must be an array');
    });

    it('should reject input with non-array datasourceIds', () => {
      const input = {
        datasourceIds: 'not-an-array'
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceIds must be an array');
    });

    it('should reject input with empty datasourceIds array', () => {
      const input = {
        datasourceIds: []
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceIds must contain at least one datasource ID');
    });

    it('should reject input with non-string defaultMethodName', () => {
      const input = {
        datasourceIds: ['ds-1'],
        defaultMethodName: 123
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('defaultMethodName must be a string');
    });

    it('should reject input with array as datasourceConfigs', () => {
      const input = {
        datasourceIds: ['ds-1'],
        datasourceConfigs: []
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceConfigs is required and must be an object');
    });

    it('should reject input with non-object datasourceConfigs', () => {
      const input = {
        datasourceIds: ['ds-1'],
        datasourceConfigs: 'not-an-object'
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceConfigs is required and must be an object');
    });

    it('should reject null datasourceConfigs', () => {
      const input = {
        datasourceIds: ['ds-1'],
        datasourceConfigs: null
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceConfigs is required and must be an object');
    });

    it('should reject undefined datasourceConfigs', () => {
      const input = {
        datasourceIds: ['ds-1']
      };

      const result = validateLinkerInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceConfigs is required and must be an object');
    });
  });

  describe('validateLinkerUpdateInput', () => {
    it('should validate correct update input', () => {
      const input = {
        datasourceIds: ['ds-1', 'ds-2'],
        defaultMethodName: 'getData'
      };

      const result = validateLinkerUpdateInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should allow empty input for updates', () => {
      const input = {};

      const result = validateLinkerUpdateInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject non-array datasourceIds if provided', () => {
      const input = {
        datasourceIds: 'not-an-array'
      };

      const result = validateLinkerUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceIds must be an array');
    });

    it('should reject empty datasourceIds array if provided', () => {
      const input = {
        datasourceIds: []
      };

      const result = validateLinkerUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceIds must contain at least one datasource ID');
    });

    it('should reject invalid defaultMethodName if provided', () => {
      const input = {
        defaultMethodName: 123
      };

      const result = validateLinkerUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('defaultMethodName must be a string');
    });

    it('should reject invalid datasourceConfigs if provided', () => {
      const input = {
        datasourceConfigs: []
      };

      const result = validateLinkerUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceConfigs must be an object');
    });
  });

  describe('validateDatasourcesExist', () => {
    it('should validate when all datasources exist', async () => {
      const mockDatasources = [
        { id: 'ds-1', name: 'DS1', ownerId: 'user-123' },
        { id: 'ds-2', name: 'DS2', ownerId: 'user-123' }
      ];

      const mockDatasourceModel = {
        findAll: vi.fn().mockResolvedValue(mockDatasources)
      };

      const result = await validateDatasourcesExist(
        ['ds-1', 'ds-2'],
        mockDatasourceModel,
        'user-123'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.datasources).toEqual(mockDatasources);
    });

    it('should reject when some datasources are missing', async () => {
      const mockDatasources = [
        { id: 'ds-1', name: 'DS1', ownerId: 'user-123' }
      ];

      const mockDatasourceModel = {
        findAll: vi.fn().mockResolvedValue(mockDatasources)
      };

      const result = await validateDatasourcesExist(
        ['ds-1', 'ds-2', 'ds-3'],
        mockDatasourceModel,
        'user-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('ds-2');
      expect(result.errors[0]).toContain('ds-3');
      expect(result.datasources).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockDatasourceModel = {
        findAll: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      const result = await validateDatasourcesExist(
        ['ds-1'],
        mockDatasourceModel,
        'user-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Error validating datasources');
      expect(result.datasources).toEqual([]);
    });
  });

  describe('validateDatasourceConfigs', () => {
    it('should validate correct configs', () => {
      const datasourceConfigs = {
        'ds-1': {
          id: 'ds-1',
          methodConfig: { methodName: 'getData' }
        },
        'ds-2': {
          id: 'ds-2',
          methodConfig: { methodName: 'getUsers' },
          propertyMapping: { oldKey: 'newKey' }
        }
      };
      const datasourceIds = ['ds-1', 'ds-2'];

      const result = validateDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject null configs', () => {
      const result = validateDatasourceConfigs(null, ['ds-1']);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('datasourceConfigs is required and cannot be null');
    });

    it('should reject config for datasource not in datasourceIds', () => {
      const datasourceConfigs = {
        'ds-3': { id: 'ds-3', methodConfig: { methodName: 'getData' } }
      };
      const datasourceIds = ['ds-1', 'ds-2'];

      const result = validateDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('ds-1') && e.includes('Missing configuration'))).toBe(true);
      expect(result.errors.some(e => e.includes('ds-2') && e.includes('Missing configuration'))).toBe(true);
      expect(result.errors.some(e => e.includes('ds-3') && e.includes('not in datasourceIds array'))).toBe(true);
    });

    it('should reject config with mismatched id', () => {
      const datasourceConfigs = {
        'ds-1': { id: 'ds-2', methodConfig: { methodName: 'getData' } },
        'ds-2': { methodConfig: { methodName: 'getUsers' } }
      };
      const datasourceIds = ['ds-1', 'ds-2'];

      const result = validateDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('mismatched id field'))).toBe(true);
    });

    it('should reject non-object methodConfig', () => {
      const datasourceConfigs = {
        'ds-1': {
          id: 'ds-1',
          methodConfig: 'not-an-object'
        }
      };
      const datasourceIds = ['ds-1'];

      const result = validateDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('methodConfig');
      expect(result.errors[0]).toContain('must be an object');
    });

    it('should reject non-string methodName in methodConfig', () => {
      const datasourceConfigs = {
        'ds-1': {
          id: 'ds-1',
          methodConfig: { methodName: 123 }
        }
      };
      const datasourceIds = ['ds-1'];

      const result = validateDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('methodName');
      expect(result.errors[0]).toContain('must be a string');
    });

    it('should reject non-object propertyMapping', () => {
      const datasourceConfigs = {
        'ds-1': {
          id: 'ds-1',
          methodConfig: { methodName: 'getData' },
          propertyMapping: []
        }
      };
      const datasourceIds = ['ds-1'];

      const result = validateDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('propertyMapping');
      expect(result.errors[0]).toContain('must be an object');
    });
  });

  describe('normalizeDatasourceConfigs', () => {
    it('should normalize configs with all datasource IDs', () => {
      const datasourceConfigs = {
        'ds-1': {
          methodConfig: { methodName: 'getData' },
          propertyMapping: { oldKey: 'newKey' }
        },
        'ds-2': {
          methodConfig: { methodName: 'getUsers' }
        }
      };
      const datasourceIds = ['ds-1', 'ds-2'];

      const result = normalizeDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result).toEqual({
        'ds-1': {
          id: 'ds-1',
          methodConfig: { methodName: 'getData' },
          propertyMapping: { oldKey: 'newKey' }
        },
        'ds-2': {
          id: 'ds-2',
          methodConfig: { methodName: 'getUsers' },
          propertyMapping: undefined
        }
      });
    });

    it('should throw error for null configs', () => {
      expect(() => {
        normalizeDatasourceConfigs(null, ['ds-1', 'ds-2']);
      }).toThrow('datasourceConfigs is required and cannot be null');
    });

    it('should throw error for undefined configs', () => {
      expect(() => {
        normalizeDatasourceConfigs(undefined, ['ds-1', 'ds-2']);
      }).toThrow('datasourceConfigs is required and cannot be null');
    });

    it('should only include configs for datasource IDs in the list', () => {
      const datasourceConfigs = {
        'ds-1': { methodConfig: { methodName: 'getData' } },
        'ds-2': { methodConfig: { methodName: 'getUsers' } },
        'ds-3': { methodConfig: { methodName: 'getOrders' } }
      };
      const datasourceIds = ['ds-1', 'ds-3'];

      const result = normalizeDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result).toHaveProperty('ds-1');
      expect(result).not.toHaveProperty('ds-2');
      expect(result).toHaveProperty('ds-3');
    });

    it('should throw error for datasource IDs without configs', () => {
      const datasourceConfigs = {
        'ds-1': { methodConfig: { methodName: 'getData' } }
      };
      const datasourceIds = ['ds-1', 'ds-2', 'ds-3'];

      expect(() => {
        normalizeDatasourceConfigs(datasourceConfigs, datasourceIds);
      }).toThrow("Missing configuration for datasource 'ds-2'");
    });

    it('should set id field correctly', () => {
      const datasourceConfigs = {
        'ds-1': { methodConfig: { methodName: 'getData' } }
      };
      const datasourceIds = ['ds-1'];

      const result = normalizeDatasourceConfigs(datasourceConfigs, datasourceIds);

      expect(result['ds-1'].id).toBe('ds-1');
    });
  });
});
