import { describe, test, expect, beforeEach } from 'vitest';
import { agreementBuilder } from '../../../src/utils/agreementBuilder.js';
import { models } from '../../../src/models/models.js';
import { sampleCatalogs } from '../../utils/sampleCatalogData.js';
import { sampleControls } from '../../utils/sampleControlsData.js';

describe('agreementBuilder Integration', () => {
  
  beforeEach(async () => {
    
    // Clear existing catalogs and controls
    await models.Catalog.destroy({ where: {}, truncate: true, cascade: true });
    await models.Control.destroy({ where: {}, truncate: true, cascade: true });

    // Populate the database with sample data
    for (const catalogData of sampleCatalogs) {
      await models.Catalog.create(catalogData);
    }

    for (const controlData of sampleControls) {
      await models.Control.create(controlData);
    }
  });

  test('agreementBuilder generates a valid agreement with data from the database', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement).toBeDefined();
    expect(agreement.id).toBeDefined();
    expect(agreement.version).toBe('1.0.0');
    expect(agreement.type).toBe('agreement');
    expect(agreement.context).toBeDefined();
    expect(agreement.terms).toBeDefined();

    expect(agreement.context.validity).toBeDefined();
    expect(agreement.terms.metrics).toBeDefined();
    expect(Object.keys(agreement.terms.metrics).length).toBe(controls.length);

    expect(agreement.terms.guarantees).toBeDefined();
  });

  test('agreementBuilder handles missing catalog gracefully', async () => {
    const catalog = null;
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    await expect(agreementBuilder(catalog, controls))
      .rejects
      .toThrowError('Cannot read properties of null (reading \'startDate\')');
  });

  test('agreementBuilder handles missing controls gracefully', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = [];

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement).toBeDefined();
    expect(agreement.terms.metrics).toEqual({});
    expect(agreement.terms.guarantees).toEqual([]);
  });

  test('agreementBuilder applies overrides correctly', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const overrides = {
      id: 'test-override',
      context: {
        validity: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      },
    };

    const agreement = await agreementBuilder(catalog, controls, overrides);

    expect(agreement.id).toBe('test-override');
    expect(agreement.context.validity.startDate).toBe('2024-01-01');
    expect(agreement.context.validity.endDate).toBe('2024-12-31');
  });

  test('agreementBuilder generates unique IDs', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const agreement1 = await agreementBuilder(catalog, controls);
    const agreement2 = await agreementBuilder(catalog, controls);

    expect(agreement1.id).not.toBe(agreement2.id);
  });

  test('agreementBuilder transforms text correctly', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const agreement = await agreementBuilder(catalog, controls);

    controls.forEach(control => {
      const metricName = control.name.toUpperCase().replace(/\s+/g, '_') + '_METRIC';
      expect(agreement.terms.metrics[metricName]).toBeDefined();
    });
  });

  test('agreementBuilder handles empty catalog and controls', async () => {
    await expect(agreementBuilder(undefined, undefined)).rejects.toThrow(TypeError);
  });

  test('agreementBuilder startDate and endDate defaults', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement.context.validity.startDate).toBeDefined();
    expect(agreement.context.validity.endDate).toBeDefined();
  });

  test('agreementBuilder should use catalog dates when overrides are not provided', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement.context.validity.startDate).toBe(catalog.startDate);
    expect(agreement.context.validity.endDate).toBe(catalog.endDate);
  });

  test('agreementBuilder should use default dates when catalog dates are not provided', async () => {
    const catalog = { id: 11, name: 'Test Catalog' };
    const controls = [];

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement.context.validity.startDate).toBe('1975-01-01');
    expect(agreement.context.validity.endDate).toBe('2022-01-01');
  });

  test('agreementBuilder handles controls with missing catalogId', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = [{
      id: 99,
      name: 'Test Control Without Catalog',
      description: 'Control without a catalog association',
      period: 'Daily',
      params: { threshold: 50 }
    }];

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement).toBeDefined();
    expect(agreement.terms.metrics).toBeDefined();
  });

  test('agreementBuilder handles catalog with null values', async () => {
    const catalog = {
      id: 16,
      name: null,
      description: null,
      startDate: null,
      endDate: null
    };
    const controls = await models.Control.findAll({ where: { catalogId: 10 } });

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement).toBeDefined();
    expect(agreement.context.validity.startDate).toBe('1975-01-01');
    expect(agreement.context.validity.endDate).toBe('2022-01-01');
  });

  test('agreementBuilder handles controls with special characters in name', async () => {
    const catalog = await models.Catalog.findOne({ where: { id: 10 } });
    const controls = [{
      id: 100,
      name: 'Test Control with !@#$%^&*()_+',
      description: 'Control with special characters',
      period: 'Daily',
      params: { threshold: 50 }
    }];

    const agreement = await agreementBuilder(catalog, controls);

    expect(agreement).toBeDefined();
    expect(agreement.terms.metrics).toBeDefined();
  });
});
