import { describe, it, expect } from 'vitest';
import {
  sanitizeLinker,
  checkLinkerOwnership,
  generateLinkerExecutionId
} from '../../../../../src/utils/databinder/linker/linkerUtils.js';

describe('linkerUtils', () => {
  describe('sanitizeLinker', () => {
    const mockLinker = {
      id: 'linker-123',
      name: 'Test Linker',
      defaultMethodName: 'getData',
      datasourceIds: ['ds-1', 'ds-2', 'ds-3'],
      datasourceConfigs: {
        'ds-1': { methodConfig: { methodName: 'getUsers' } },
        'ds-2': { propertyMapping: { oldKey: 'newKey' } }
      },
      description: 'A test linker',
      environment: 'production',
      isActive: true,
      createdBy: 'user-456',
      version: '1.0.0',
      lastExecutedAt: '2023-01-01T00:00:00Z',
      executionStatus: 'success',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      ownerId: 'user-456',
      internalField: 'should-not-be-included'
    };

    it('should sanitize linker without configs by default', () => {
      const result = sanitizeLinker(mockLinker);

      expect(result).toEqual({
        id: 'linker-123',
        name: 'Test Linker',
        defaultMethodName: 'getData',
        datasourceIds: ['ds-1', 'ds-2', 'ds-3'],
        description: 'A test linker',
        environment: 'production',
        isActive: true,
        createdBy: 'user-456',
        version: '1.0.0',
        lastExecutedAt: '2023-01-01T00:00:00Z',
        executionStatus: 'success',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        ownerId: 'user-456'
      });
      expect(result.datasourceConfigs).toBeUndefined();
      expect(result.internalField).toBeUndefined();
    });

    it('should include datasource configs when includeConfigs is true', () => {
      const result = sanitizeLinker(mockLinker, true);

      expect(result.datasourceConfigs).toEqual({
        'ds-1': { methodConfig: { methodName: 'getUsers' } },
        'ds-2': { propertyMapping: { oldKey: 'newKey' } }
      });
    });

    it('should return null for null linker', () => {
      const result = sanitizeLinker(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined linker', () => {
      const result = sanitizeLinker(undefined);

      expect(result).toBeNull();
    });

    it('should handle linker with minimal fields', () => {
      const minimalLinker = {
        id: 'linker-123',
        name: 'Minimal',
        datasourceIds: ['ds-1']
      };

      const result = sanitizeLinker(minimalLinker);

      expect(result.id).toBe('linker-123');
      expect(result.name).toBe('Minimal');
      expect(result.datasourceIds).toEqual(['ds-1']);
    });
  });

  describe('checkLinkerOwnership', () => {
    it('should return true when user owns the linker', () => {
      const linker = { id: 'linker-123', ownerId: 'user-456' };
      const userId = 'user-456';

      expect(checkLinkerOwnership(linker, userId)).toBe(true);
    });

    it('should return false when user does not own the linker', () => {
      const linker = { id: 'linker-123', ownerId: 'user-456' };
      const userId = 'user-789';

      expect(checkLinkerOwnership(linker, userId)).toBe(false);
    });

    it('should return false when linker is null', () => {
      expect(checkLinkerOwnership(null, 'user-456')).toBeFalsy();
    });

    it('should return false when linker is undefined', () => {
      expect(checkLinkerOwnership(undefined, 'user-456')).toBeFalsy();
    });

    it('should return false when ownerId is missing', () => {
      const linker = { id: 'linker-123' };
      expect(checkLinkerOwnership(linker, 'user-456')).toBe(false);
    });

    it('should handle numeric user IDs', () => {
      const linker = { id: 'linker-123', ownerId: 123 };
      expect(checkLinkerOwnership(linker, 123)).toBe(true);
      expect(checkLinkerOwnership(linker, 456)).toBe(false);
    });
  });

  describe('generateLinkerExecutionId', () => {
    it('should generate execution ID with linker ID and timestamp', () => {
      const linkerId = 'linker-123';
      const timestamp = 1672531200000;

      const result = generateLinkerExecutionId(linkerId, timestamp);

      expect(result).toBe('linker_linker-123_1672531200000');
    });

    it('should handle different linker IDs', () => {
      const timestamp = 1672531200000;

      const id1 = generateLinkerExecutionId('linker-abc', timestamp);
      const id2 = generateLinkerExecutionId('linker-xyz', timestamp);

      expect(id1).toBe('linker_linker-abc_1672531200000');
      expect(id2).toBe('linker_linker-xyz_1672531200000');
      expect(id1).not.toBe(id2);
    });

    it('should handle different timestamps', () => {
      const linkerId = 'linker-123';

      const id1 = generateLinkerExecutionId(linkerId, 1672531200000);
      const id2 = generateLinkerExecutionId(linkerId, 1672531300000);

      expect(id1).not.toBe(id2);
    });

    it('should generate consistent IDs for same inputs', () => {
      const linkerId = 'linker-123';
      const timestamp = 1672531200000;

      const id1 = generateLinkerExecutionId(linkerId, timestamp);
      const id2 = generateLinkerExecutionId(linkerId, timestamp);

      expect(id1).toBe(id2);
    });

    it('should handle linker IDs with special characters', () => {
      const result = generateLinkerExecutionId('linker-abc-123_test', 1672531200000);

      expect(result).toBe('linker_linker-abc-123_test_1672531200000');
    });
  });
});
