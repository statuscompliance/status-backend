// checkRequiredProperties.test.js
import { expect, describe, it } from 'vitest'; // Importa 'describe' e 'it'
import { checkRequiredProperties } from '../../../src/utils/checkRequiredProperties'; // Ajusta la ruta

describe('checkRequiredProperties', () => {
  it('should fail if the object is null or not an object', () => {
    expect(checkRequiredProperties(null, ['prop1'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });

    expect(checkRequiredProperties(undefined, ['prop1'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });

    expect(checkRequiredProperties(123, ['prop1'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });

    expect(checkRequiredProperties('string', ['prop1'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });

    expect(checkRequiredProperties(true, ['prop1'])).toEqual({
      validation: false,
      textError: 'Invalid object or missing required properties',
    });
  });

  it('should pass if the object has all required properties', () => {
    const obj = { prop1: 'value1', prop2: 'value2' };
    const requiredProps = ['prop1', 'prop2'];

    expect(checkRequiredProperties(obj, requiredProps)).toEqual({
      validation: true,
      textError: '',
    });
  });

  it('should fail if required properties are missing', () => {
    const obj = { prop1: 'value1' };
    const requiredProps = ['prop1', 'prop2', 'prop3'];

    expect(checkRequiredProperties(obj, requiredProps)).toEqual({
      validation: false,
      textError: 'Missing required properties: prop2, prop3',
    });
  });

  it('should fail if the object is empty and required properties exist', () => {
    const obj = {};
    const requiredProps = ['prop1', 'prop2'];

    expect(checkRequiredProperties(obj, requiredProps)).toEqual({
      validation: false,
      textError: 'Missing required properties: prop1, prop2',
    });
  });

  it('should pass if the array of required properties is empty', () => {
    const obj = { prop1: 'value1', prop2: 'value2' };
    const requiredProps = [];

    expect(checkRequiredProperties(obj, requiredProps)).toEqual({
      validation: true,
      textError: '',
    });
  });
});