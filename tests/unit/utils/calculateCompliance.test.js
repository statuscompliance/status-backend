import { describe, it, expect } from 'vitest';
import { calculateCompliance } from '../../../src/utils/calculateCompliance';

describe('calculateCompliance', () => {
  it('should return an empty array when computations is empty', () => {
    const result = calculateCompliance([]);
    expect(result).toEqual([]);
  });

  it('should throw an error if scope is not an object', () => {
    const computations = [
      {
        computationGroup: 'group1',
        controlId: 'controlA',
        period: '2023',
        scope: null,
        evidences: [],
      },
    ];

    expect(() => calculateCompliance(computations)).toThrow(
      /Cannot convert undefined or null to object/
    );
  });

  it('should calculate compliance percentage correctly', () => {
    const computations = [
      {
        computationGroup: 'group1',
        controlId: 'controlA',
        period: '2023',
        scope: { key1: 'value1', key2: 'value2' },
        evidences: [{ result: true }, { result: false }],
      },
      {
        computationGroup: 'group1',
        controlId: 'controlA',
        period: '2023',
        scope: { key1: 'value1', key2: 'value2' },
        evidences: [{ result: true }],
      },
    ];

    // Total evidences: 3, evidences true: 2
    // Expected percentage: Math.round((2 / 3) * 100) => 67
    const result = calculateCompliance(computations);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'group1',
      value: 67,
      period: '2023',
      controlId: 'controlA',
      evidences: computations,
    });
  });

  it('should remove the last property from the scope', () => {
    const originalScope = { a: 1, b: 2, c: 3 };
    const computations = [
      {
        computationGroup: 'group1',
        controlId: 'controlA',
        period: '2023',
        scope: originalScope,
        evidences: [],
      },
    ];

    const result = calculateCompliance(computations);

    // gets modified scope without the last property (according to the order of Object.keys)
    const scopeKeys = Object.keys(originalScope);
    const expectedScope = { ...originalScope };
    delete expectedScope[scopeKeys[scopeKeys.length - 1]];

    expect(result[0].scope).toEqual(expectedScope);
  });
  it('should handle scope as an empty object (no properties to remove)', () => {
    const computations = [
      {
        computationGroup: 'groupEmptyScope',
        controlId: 'controlB',
        period: '2023',
        scope: {}, // empty object, no properties to delete
        evidences: [{ result: true }, { result: false }],
      },
    ];

    const result = calculateCompliance(computations);

    expect(result[0].scope).toEqual({});
  });

  it('should handle computations with evidences property not an array', () => {
    const computations = [
      {
        computationGroup: 'groupInvalidEvidences',
        controlId: 'controlC',
        period: '2023',
        scope: { x: 'val' },
        // simulates that evidences is not an array
        evidences: null,
      },
      {
        computationGroup: 'groupInvalidEvidences',
        controlId: 'controlC',
        period: '2023',
        scope: { x: 'val' },
        evidences: [{ result: true }],
      },
    ];

    // first computation, evidences will be treated as empty array
    // should have 1 true evidence from the second computation.
    const result = calculateCompliance(computations);
    expect(result[0].value).toBe(100);
  });
});
