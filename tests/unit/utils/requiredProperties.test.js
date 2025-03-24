// checkRequiredProperties.test.js
import { expect, test, describe, it } from 'vitest';
import { checkRequiredProperties } from '../../../src/utils/checkRequiredProperties'; // Ajusta la ruta si es necesario

describe('checkRequiredProperties', () => {
  
    it('debería fallar si el objeto es nulo o no es un objeto', () => {
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
  
    it('debería pasar si el objeto tiene todas las propiedades requeridas', () => {
      const obj = { prop1: 'value1', prop2: 'value2' };
      const requiredProps = ['prop1', 'prop2'];
  
      expect(checkRequiredProperties(obj, requiredProps)).toEqual({
        validation: true,
        textError: '',
      });
    });
  
    it('debería fallar si faltan propiedades requeridas', () => {
      const obj = { prop1: 'value1' };
      const requiredProps = ['prop1', 'prop2', 'prop3'];
  
      expect(checkRequiredProperties(obj, requiredProps)).toEqual({
        validation: false,
        textError: 'Missing required properties: prop2, prop3',
      });
    });
  
      it('debería fallar si el objeto esta vacio y se requieren propiedades', () => {
          const obj = {};
          const requiredProps = ['prop1', 'prop2'];
  
          expect(checkRequiredProperties(obj, requiredProps)).toEqual({
              validation: false,
              textError: 'Missing required properties: prop1, prop2',
          });
      });
  
      it('debería pasar si el array de propiedades requeridas esta vacio', () => {
          const obj = { prop1: 'value1', prop2: 'value2' };
          const requiredProps = [];
  
          expect(checkRequiredProperties(obj, requiredProps)).toEqual({
              validation: true,
              textError: '',
          });
      });
  });