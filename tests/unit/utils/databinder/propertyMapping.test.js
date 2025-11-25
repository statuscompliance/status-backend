import { describe, it, expect } from 'vitest';
import {
  applyPropertyMapping,
  validatePropertyMapping,
  createMappingMetadata
} from '../../../../src/utils/databinder/propertyMapping.js';

describe('propertyMapping', () => {
  describe('applyPropertyMapping', () => {
    it('should return data unchanged if mapping is null or empty', () => {
      const data = { name: 'John', age: 30 };
      expect(applyPropertyMapping(data, null)).toEqual(data);
      expect(applyPropertyMapping(data, {})).toEqual(data);
    });

    it('should return data unchanged if data is not an object', () => {
      const mapping = { oldKey: 'newKey' };
      expect(applyPropertyMapping(null, mapping)).toBeNull();
      expect(applyPropertyMapping('string', mapping)).toBe('string');
      expect(applyPropertyMapping(123, mapping)).toBe(123);
      expect(applyPropertyMapping(undefined, mapping)).toBeUndefined();
    });

    it('should map properties correctly for a simple object', () => {
      const data = { firstName: 'John', lastName: 'Doe', age: 30 };
      const mapping = { firstName: 'given_name', lastName: 'family_name' };
      
      const result = applyPropertyMapping(data, mapping);
      
      expect(result).toEqual({
        given_name: 'John',
        family_name: 'Doe',
        age: 30
      });
    });

    it('should apply mapping to arrays of objects', () => {
      const data = [
        { firstName: 'John', age: 30 },
        { firstName: 'Jane', age: 25 }
      ];
      const mapping = { firstName: 'name' };
      
      const result = applyPropertyMapping(data, mapping);
      
      expect(result).toEqual([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ]);
    });

    it('should recursively apply mapping to nested objects', () => {
      const data = {
        user: {
          firstName: 'John',
          address: {
            streetName: 'Main St'
          }
        }
      };
      const mapping = { firstName: 'name', streetName: 'street' };
      
      const result = applyPropertyMapping(data, mapping);
      
      expect(result).toEqual({
        user: {
          name: 'John',
          address: {
            street: 'Main St'
          }
        }
      });
    });

    it('should recursively apply mapping to arrays within objects', () => {
      const data = {
        users: [
          { firstName: 'John' },
          { firstName: 'Jane' }
        ]
      };
      const mapping = { firstName: 'name' };
      
      const result = applyPropertyMapping(data, mapping);
      
      expect(result).toEqual({
        users: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      });
    });

    it('should handle null values in nested objects', () => {
      const data = {
        user: {
          firstName: 'John',
          address: null
        }
      };
      const mapping = { firstName: 'name' };
      
      const result = applyPropertyMapping(data, mapping);
      
      expect(result).toEqual({
        user: {
          name: 'John',
          address: null
        }
      });
    });

    it('should preserve properties not in the mapping', () => {
      const data = { firstName: 'John', age: 30, city: 'NYC' };
      const mapping = { firstName: 'name' };
      
      const result = applyPropertyMapping(data, mapping);
      
      expect(result).toEqual({
        name: 'John',
        age: 30,
        city: 'NYC'
      });
    });
  });

  describe('validatePropertyMapping', () => {
    it('should return valid for null or undefined mapping', () => {
      expect(validatePropertyMapping(null)).toEqual({ isValid: true });
      expect(validatePropertyMapping(undefined)).toEqual({ isValid: true });
    });

    it('should return invalid if mapping is not an object', () => {
      const result = validatePropertyMapping('not an object');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Property mapping must be an object');
    });

    it('should return invalid for duplicate mapping targets', () => {
      const mapping = {
        firstName: 'name',
        lastName: 'name', // duplicate
        middleName: 'name' // duplicate
      };
      
      const result = validatePropertyMapping(mapping);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Duplicate mapping targets found');
      expect(result.error).toContain('name');
    });

    it('should return valid for correct mapping without duplicates', () => {
      const mapping = {
        firstName: 'given_name',
        lastName: 'family_name',
        age: 'years'
      };
      
      const result = validatePropertyMapping(mapping);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for empty object mapping', () => {
      const result = validatePropertyMapping({});
      expect(result.isValid).toBe(true);
    });
  });

  describe('createMappingMetadata', () => {
    it('should create metadata with applied flag false when no mapping', () => {
      const originalData = { name: 'John' };
      const transformedData = { name: 'John' };
      
      const metadata = createMappingMetadata(originalData, transformedData, null);
      
      expect(metadata.applied).toBe(false);
      expect(metadata.mappingRules).toBeNull();
      expect(metadata.rulesCount).toBe(0);
    });

    it('should create metadata with applied flag true when mapping exists', () => {
      const originalData = { firstName: 'John' };
      const transformedData = { name: 'John' };
      const mapping = { firstName: 'name' };
      
      const metadata = createMappingMetadata(originalData, transformedData, mapping);
      
      expect(metadata.applied).toBe(true);
      expect(metadata.mappingRules).toEqual(mapping);
      expect(metadata.rulesCount).toBe(1);
    });

    it('should calculate size change correctly', () => {
      const originalData = { a: 1 };
      const transformedData = { veryLongPropertyName: 1 };
      const mapping = { a: 'veryLongPropertyName' };
      
      const metadata = createMappingMetadata(originalData, transformedData, mapping);
      
      expect(metadata.originalSize).toBeGreaterThan(0);
      expect(metadata.transformedSize).toBeGreaterThan(metadata.originalSize);
      expect(metadata.sizeChange).toBe(metadata.transformedSize - metadata.originalSize);
    });

    it('should handle complex nested objects in size calculation', () => {
      const originalData = { 
        users: [
          { firstName: 'John', age: 30 },
          { firstName: 'Jane', age: 25 }
        ]
      };
      const transformedData = { 
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      };
      const mapping = { firstName: 'name' };
      
      const metadata = createMappingMetadata(originalData, transformedData, mapping);
      
      expect(metadata.originalSize).toBeGreaterThan(0);
      expect(metadata.transformedSize).toBeGreaterThan(0);
      expect(typeof metadata.sizeChange).toBe('number');
    });
  });
});
