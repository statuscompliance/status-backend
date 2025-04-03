import { expect, describe, it } from 'vitest';
import { checkRequiredProperties } from '../../../src/utils/checkRequiredProperties';

describe('checkRequiredProperties', () => {
  
  describe('Tests for valid objects', () => {
    it.each([
      {
        object: { userId: 123, userName: 'John', email: 'john@example.com' },
        required: ['userId', 'userName', 'email'],
        expected: { validation: true, textError: '' },
        testName: 'should pass if object has all required properties',
      },
      {
        object: { userId: 123, userName: 'John' },
        required: ['userId', 'userName', 'email'],
        expected: { validation: false, textError: 'Missing required properties: email' },
        testName: 'should fail if object is missing some required properties',
      },
      {
        object: { userId: 123, userName: 'JohnDoe' },
        required: [],
        expected: { validation: true, textError: '' },
        testName: 'should pass if the array of required properties is empty',
      },
      {
        object: { userId: 1, name: 'Test', extra: 'value' },
        required: ['userId', 'name'],
        expected: { validation: true, textError: '' },
        testName: 'should pass if object has extra properties',
      },
      {
        object: { id: 1, value: null },
        required: ['id', 'value'],
        expected: { validation: true, textError: '' },
        testName: 'should pass if required property has a null value',
      },
      {
        object: { key: 1, exists: false },
        required: ['key', 'exists'],
        expected: { validation: true, textError: '' },
        testName: 'should pass if required property has a boolean value',
      },
    ])('$testName', ({ object, required, expected }) => {
      expect(checkRequiredProperties(object, required)).toEqual(expected);
    });
  });

  describe.each([
    [null, ['userId'], 'Invalid object or missing required properties'],
    [undefined, ['userId'], 'Invalid object or missing required properties'],
    [123, ['userId'], 'Invalid object or missing required properties'],
    ['string', ['userId'], 'Invalid object or missing required properties'],
    [true, ['userId'], 'Invalid object or missing required properties'],
  ])('Invalid objects', (obj, requiredProps, expectedError) => {
    it(`should fail when input is ${obj === null ? 'null' : typeof obj}`, () => {
      expect(checkRequiredProperties(obj, requiredProps)).toStrictEqual({
        validation: false,
        textError: expectedError,
      });
    });
  });
});
