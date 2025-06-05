import { describe, it, expect } from 'vitest';
import { buildWhereClause } from '../../../src/utils/buildWhereClause.js';

describe('buildWhereClause', () => {
  it('should build a simple where clause without validation constraints', () => {
    const query = {
      status: 'active',
      count: 5,
      isEnabled: true
    };
    
    const result = buildWhereClause(query);
    
    expect(result).toEqual({
      status: 'active',
      count: 5,
      isEnabled: true
    });
  });

  it('should build a where clause with valid params according to validParamsMap', () => {
    const query = {
      status: 'active',
      priority: 'high'
    };
    
    const validParamsMap = {
      status: ['active', 'inactive', 'pending'],
      priority: ['low', 'medium', 'high']
    };
    
    const result = buildWhereClause(query, validParamsMap);
    
    expect(result).toEqual({
      status: 'active',
      priority: 'high'
    });
  });

  it('should throw an error when a param has an invalid value', () => {
    const query = {
      status: 'unknown'
    };
    
    const validParamsMap = {
      status: ['active', 'inactive', 'pending']
    };
    
    expect(() => buildWhereClause(query, validParamsMap)).toThrow(
      'Invalid value for "status": "unknown". Allowed values are active or inactive or pending.'
    );
  });

  it('should return an empty object when query is empty', () => {
    const query = {};
    const validParamsMap = {
      status: ['active', 'inactive']
    };
    
    const result = buildWhereClause(query, validParamsMap);
    
    expect(result).toEqual({});
  });

  it('should handle undefined validParamsMap', () => {
    const query = {
      status: 'active',
      count: 5
    };
    
    const result = buildWhereClause(query, undefined);
    
    expect(result).toEqual({
      status: 'active',
      count: 5
    });
  });

  it('should handle a mix of validated and non-validated params', () => {
    const query = {
      status: 'active',
      count: 5,
      priority: 'high',
      search: 'test'
    };
    
    const validParamsMap = {
      status: ['active', 'inactive'],
      priority: ['low', 'medium', 'high']
    };
    
    const result = buildWhereClause(query, validParamsMap);
    
    expect(result).toEqual({
      status: 'active',
      count: 5,
      priority: 'high',
      search: 'test'
    });
  });

  it('should handle boolean values correctly', () => {
    const query = {
      isActive: true,
      isAdmin: false
    };
    
    const validParamsMap = {
      isActive: [true, false]
    };
    
    const result = buildWhereClause(query, validParamsMap);
    
    expect(result).toEqual({
      isActive: true,
      isAdmin: false
    });
  });

  it('should handle numeric values correctly', () => {
    const query = {
      level: 2
    };
    
    const validParamsMap = {
      level: [1, 2, 3]
    };
    
    const result = buildWhereClause(query, validParamsMap);
    
    expect(result).toEqual({
      level: 2
    });
  });

  it('should throw an error when a numeric param has an invalid value', () => {
    const query = {
      level: 5
    };
    
    const validParamsMap = {
      level: [1, 2, 3]
    };
    
    expect(() => buildWhereClause(query, validParamsMap)).toThrow(
      'Invalid value for "level": "5". Allowed values are 1 or 2 or 3.'
    );
  });
  
  it('should handle null values in validParamsMap correctly', () => {
    const query = {
      status: null
    };
    
    const validParamsMap = {
      status: ['active', 'inactive', null]
    };
    
    const result = buildWhereClause(query, validParamsMap);
    
    expect(result).toEqual({
      status: null
    });
  });
});
