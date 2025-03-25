// checkRequiredProperties.test.js
import { expect, describe, it } from 'vitest'; // Importa 'describe' e 'it'
import { checkRequiredProperties } from '../../../src/utils/checkRequiredProperties'; // Ajusta la ruta

describe('Tests for valid objects', () => {
  it('should pass if object has all required properties', () => {
    const validObject = {
      userId: 123,
      userName: 'JohnDoe',
      email: 'john.doe@example.com',
    };
    const requiredProperties = ['userId', 'userName', 'email'];

    expect(checkRequiredProperties(validObject, requiredProperties)).toEqual({
      validation: true,
      textError: '',
    });
  });

  it('should fail if object is missing some required properties', () => {
    const partialObject = {
      userId: 123,
      userName: 'JohnDoe',
    };
    const requiredProperties = ['userId', 'userName', 'email'];

    expect(checkRequiredProperties(partialObject, requiredProperties)).toEqual({
      validation: false,
      textError: 'Missing required properties: email',
    });
  });

  it('should pass if the array of required properties is empty', () => {
      const obj = {userId: 123, userName: 'JohnDoe'};
      const requiredProperties = [];

      expect(checkRequiredProperties(obj, requiredProperties)).toEqual({
          validation: true,
          textError: '',
      });
  });
});

describe('Tests for invalid objects', () => {
  it('should fail if object is null', () => {
    expect(checkRequiredProperties(null, ['userId'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });
  });

  it('should fail if object is undefined', () => {
    expect(checkRequiredProperties(undefined, ['userId'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });
  });

  it('should fail if object is not an object (number)', () => {
    expect(checkRequiredProperties(123, ['userId'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });
  });

  it('should fail if object is not an object (string)', () => {
      expect(checkRequiredProperties('string', ['userId'])).toEqual({
          validation: false,
          textError: 'Invalid object or missing required properties',
      });
  });

  it('should fail if object is not an object (boolean)', () => {
      expect(checkRequiredProperties(true, ['userId'])).toEqual({
          validation: false,
          textError: 'Invalid object or missing required properties',
      });
  });
});