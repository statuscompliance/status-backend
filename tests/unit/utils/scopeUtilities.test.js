import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getScopeSpecs, getScopeSetsByControlIds, getUniqueScopeKeys } from '../../../src/utils/scopeUtilities'; // Ajustá ruta
import { models } from '../../../src/models/models';
import ScopeSet from '../../../src/models/scopeSet.model.js';
import { Op } from 'sequelize';

describe('getScopeSpecs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a scopeSpecs object from scope keys', async () => {
    const mockScopes = [
      { name: 'scope1', description: 'desc1', type: 'type1', default: true },
      { name: 'scope2', description: 'desc2', type: 'type2', default: false },
    ];

    vi.spyOn(models.Scope, 'findAll').mockResolvedValue(mockScopes);

    const result = await getScopeSpecs(['scope1', 'scope2']);
    expect(models.Scope.findAll).toHaveBeenCalledWith({
      attributes: ['name', 'description', 'type', 'default'],
      where: {
        name: {
          [Op.in]: ['scope1', 'scope2'],
        },
      },
    });

    expect(result).toEqual({
      scope1: mockScopes[0],
      scope2: mockScopes[1],
    });
  });

  it('should throw error if findAll fails', async () => {
    vi.spyOn(models.Scope, 'findAll').mockRejectedValue(new Error('DB error'));

    await expect(getScopeSpecs(['a'])).rejects.toThrow('DB error');
  });
});

describe('getScopeSetsByControlIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return scopeSets and unique scope key set', async () => {
    const mockScopeSets = [
      {
        controlId: 1,
        scopes: new Map([['s1', true], ['s2', false]]),
      },
      {
        controlId: 2,
        scopes: new Map([['s2', true], ['s3', true]]),
      },
    ];

    const mockSelect = vi.fn().mockResolvedValue(mockScopeSets);
    vi.spyOn(ScopeSet, 'find').mockReturnValue({ select: mockSelect });

    const result = await getScopeSetsByControlIds([1, 2]);

    expect(ScopeSet.find).toHaveBeenCalledWith({ controlId: { $in: [1, 2] } });
    expect(result).toEqual({
      scopeSets: mockScopeSets,
      scopesKeySet: ['s1', 's2', 's3'],
    });
  });

  it('should throw error if ScopeSet.find fails', async () => {
    const mockSelect = vi.fn().mockRejectedValue(new Error('Find failed'));
    vi.spyOn(ScopeSet, 'find').mockReturnValue({ select: mockSelect });

    await expect(getScopeSetsByControlIds([1])).rejects.toThrow('Find failed');
  });
});

describe('getUniqueScopeKeys (internal)', () => {
 
  it('should extract unique keys from scopes maps', () => {
    const input = [
      { scopes: new Map([['a', true], ['b', false]]) },
      { scopes: new Map([['b', true], ['c', true]]) },
    ];

    const result = getUniqueScopeKeys(input);
    expect(result.sort()).toEqual(['a', 'b', 'c']);
  });

  it('should handle single object input', () => {
    const input = { scopes: new Map([['x', true]]) };
    const result = getUniqueScopeKeys(input);
    expect(result).toEqual(['x']);
  });
  it('should return empty array if object has no scopes property', () => {
    const input = [{ controlId: 123 }];
    const result = getUniqueScopeKeys(input);
    expect(result).toEqual([]);
  });
  it('should return empty array if scopes is null or undefined', () => {
    const input = [{ scopes: null }, { scopes: undefined }];
    const result = getUniqueScopeKeys(input);
    expect(result).toEqual([]);
  });
  it('should return empty array if scopes is not a Map', () => {
    const input = [{ scopes: 'notAMap' }, { scopes: 123 }];
    const result = getUniqueScopeKeys(input);
    expect(result).toEqual([]);
  });
  it('should return empty array for empty array input', () => {
    const result = getUniqueScopeKeys([]);
    expect(result).toEqual([]);
  });

  it('should return empty array for null input (if supported)', () => {
    const result = getUniqueScopeKeys(null);
    expect(result).toEqual([]);
  });

  it('should return empty array for undefined input (if supported)', () => {
    const result = getUniqueScopeKeys(undefined);
    expect(result).toEqual([]);
  });
});
