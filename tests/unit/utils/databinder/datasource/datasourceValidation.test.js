import { describe, it, expect, vi } from 'vitest';
import {
  validateDatasourceInput,
  validateDatasourceUpdateInput,
  validateDefinitionExists,
  validateDatasourceConfig,
  validateMethodExists
} from '../../../../../src/utils/databinder/datasource/datasourceValidation.js';

describe('datasourceValidation', () => {
  describe('validateDatasourceInput', () => {
    it('should validate correct input', () => {
      const input = {
        name: 'Test Datasource',
        definitionId: 'rest-api',
        config: {
          baseUrl: 'https://api.example.com'
        }
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject input with missing name', () => {
      const input = {
        definitionId: 'rest-api',
        config: {}
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be a non-empty string');
    });

    it('should reject input with empty name', () => {
      const input = {
        name: '   ',
        definitionId: 'rest-api',
        config: {}
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be a non-empty string');
    });

    it('should reject input with non-string name', () => {
      const input = {
        name: 123,
        definitionId: 'rest-api',
        config: {}
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be a non-empty string');
    });

    it('should reject input with missing definitionId', () => {
      const input = {
        name: 'Test',
        config: {}
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DefinitionId must be a non-empty string');
    });

    it('should reject input with empty definitionId', () => {
      const input = {
        name: 'Test',
        definitionId: '  ',
        config: {}
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DefinitionId must be a non-empty string');
    });

    it('should reject input with invalid config', () => {
      const input = {
        name: 'Test',
        definitionId: 'rest-api',
        config: null
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Config must be a valid object');
    });

    it('should accept config as empty array (typeof array is object)', () => {
      const input = {
        name: 'Test',
        definitionId: 'rest-api',
        config: []
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      const input = {
        name: '',
        definitionId: '',
        config: 'not-an-object'
      };

      const result = validateDatasourceInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateDatasourceUpdateInput', () => {
    it('should validate correct update input', () => {
      const input = {
        name: 'Updated Name',
        config: { baseUrl: 'https://new-api.example.com' }
      };

      const result = validateDatasourceUpdateInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should allow empty input for updates', () => {
      const input = {};

      const result = validateDatasourceUpdateInput(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid name if provided', () => {
      const input = {
        name: '   '
      };

      const result = validateDatasourceUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be a non-empty string');
    });

    it('should reject invalid definitionId if provided', () => {
      const input = {
        definitionId: ''
      };

      const result = validateDatasourceUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('DefinitionId must be a non-empty string');
    });

    it('should reject invalid config if provided', () => {
      const input = {
        config: null
      };

      const result = validateDatasourceUpdateInput(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Config must be a valid object');
    });

    it('should allow partial updates with valid fields', () => {
      const input = {
        name: 'New Name'
      };

      const result = validateDatasourceUpdateInput(input);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDefinitionExists', () => {
    const availableDefinitions = [
      { id: 'rest-api', name: 'REST API' },
      { id: 'microsoft-graph', name: 'Microsoft Graph' },
      { id: 'postgresql', name: 'PostgreSQL' }
    ];

    it('should validate existing definition', () => {
      const result = validateDefinitionExists('rest-api', availableDefinitions);

      expect(result.isValid).toBe(true);
      expect(result.definition).toEqual({ id: 'rest-api', name: 'REST API' });
    });

    it('should reject non-existing definition', () => {
      const result = validateDefinitionExists('unknown-api', availableDefinitions);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid definitionId');
      expect(result.error).toContain('unknown-api');
      expect(result.error).toContain('rest-api');
      expect(result.error).toContain('microsoft-graph');
      expect(result.error).toContain('postgresql');
    });

    it('should handle empty definitions list', () => {
      const result = validateDefinitionExists('rest-api', []);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid definitionId');
    });

    it('should be case-sensitive for definition IDs', () => {
      const result = validateDefinitionExists('REST-API', availableDefinitions);

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateDatasourceConfig', () => {
    it('should validate correct config', () => {
      const mockInstance = {
        id: 'instance-123',
        methods: { default: vi.fn() }
      };
      const createDatasourceInstance = vi.fn(() => mockInstance);

      const result = validateDatasourceConfig(
        createDatasourceInstance,
        'rest-api',
        { baseUrl: 'https://api.example.com' },
        'instance-123'
      );

      expect(result.isValid).toBe(true);
      expect(result.instance).toEqual(mockInstance);
      expect(createDatasourceInstance).toHaveBeenCalledWith(
        'rest-api',
        { baseUrl: 'https://api.example.com' },
        'instance-123'
      );
    });

    it('should reject config that throws error during instance creation', () => {
      const createDatasourceInstance = vi.fn(() => {
        throw new Error('Invalid configuration: missing required field');
      });

      const result = validateDatasourceConfig(
        createDatasourceInstance,
        'rest-api',
        { invalidField: 'value' },
        'instance-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid configuration: missing required field');
    });

    it('should handle various error types', () => {
      const createDatasourceInstance = vi.fn(() => {
        throw new TypeError('Config must be an object');
      });

      const result = validateDatasourceConfig(
        createDatasourceInstance,
        'rest-api',
        null,
        'instance-123'
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Config must be an object');
    });
  });

  describe('validateMethodExists', () => {
    it('should validate existing method', () => {
      const instance = {
        methods: {
          default: vi.fn(),
          getData: vi.fn(),
          postData: vi.fn()
        }
      };

      const result = validateMethodExists(instance, 'getData');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.availableMethods).toBeUndefined();
    });

    it('should reject non-existing method', () => {
      const instance = {
        methods: {
          default: vi.fn(),
          getData: vi.fn()
        }
      };

      const result = validateMethodExists(instance, 'postData');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Method 'postData' not available for this datasource");
      expect(result.availableMethods).toEqual(['default', 'getData']);
    });

    it('should reject method that is not a function', () => {
      const instance = {
        methods: {
          default: vi.fn(),
          getData: 'not-a-function'
        }
      };

      const result = validateMethodExists(instance, 'getData');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Method 'getData' not available for this datasource");
    });

    it('should reject method that is null', () => {
      const instance = {
        methods: {
          default: vi.fn(),
          getData: null
        }
      };

      const result = validateMethodExists(instance, 'getData');

      expect(result.isValid).toBe(false);
    });

    it('should handle instance with empty methods', () => {
      const instance = {
        methods: {}
      };

      const result = validateMethodExists(instance, 'default');

      expect(result.isValid).toBe(false);
      expect(result.availableMethods).toEqual([]);
    });
  });
});
