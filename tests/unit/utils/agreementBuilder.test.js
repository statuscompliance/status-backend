import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  agreementBuilder,
  createMetrics,
  createGuarantees,
} from '../../../src/utils/agreementBuilder';
import * as scopeUtils from '../../../src/utils/scopeUtilities';

vi.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('test: agreementBuilder', () => {
  let getScopeSetsByControlIdsSpy;

  let getScopeSpecsSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the functions from scopeUtilities
    getScopeSetsByControlIdsSpy = vi.spyOn(
      scopeUtils,
      'getScopeSetsByControlIds'
    );
    getScopeSpecsSpy = vi.spyOn(scopeUtils, 'getScopeSpecs');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('agreementBuilder', () => {
    it('should build an agreement object correctly', async () => {
      const mockCatalog = {
        startDate: '2023-01-01',
        endDate: '2024-01-01',
      };

      const mockControls = [
        {
          id: 1,
          name: 'Uptime Check',
          description: 'Check system uptime daily',
          params: {
            endpoint: '/status',
            threshold: 99.9,
          },
          period: 'DAILY',
        },
        {
          id: 2,
          name: 'Response Time',
          description: 'Measure response time',
          params: {
            endpoint: '/response',
            threshold: 200,
            timeout: 5000,
          },
          period: 'WEEKLY',
        },
      ];

      const mockScopeSets = [
        {
          scopes: [
            ['region', 'us-west'],
            ['service', 'api'],
          ],
        },
      ];

      const mockScopeSpecs = {
        region: ['us-west'],
        service: ['api'],
      };

      getScopeSetsByControlIdsSpy.mockResolvedValue({
        scopesKeySet: ['region', 'service'],
        scopeSets: mockScopeSets,
      });
      getScopeSpecsSpy.mockResolvedValue(mockScopeSpecs);

      const result = await agreementBuilder(mockCatalog, mockControls);

      expect(result).toMatchObject({
      // id: 'tpa-mocked-uuid',
        version: '1.0.0',
        type: 'agreement',
        context: {
          validity: {
            initial: '2022-01-01',
            timeZone: 'America/Los_Angeles',
            startDate: '2023-01-01',
            endDate: '2024-01-01',
          },
          definitions: {
            schemas: {},
            scopes: {},
          },
        },
        terms: {
          metrics: {
            UPTIME_CHECK_METRIC: expect.any(Object),
            RESPONSE_TIME_METRIC: expect.any(Object),
          },
          guarantees: expect.any(Array),
        },
      });
      // Validate that both controls generate a metric with correct names
      expect(Object.keys(result.terms.metrics)).toEqual(
        expect.arrayContaining(['UPTIME_CHECK_METRIC', 'RESPONSE_TIME_METRIC'])
      );
      // check structure of the guarantees for each control
      expect(result.terms.guarantees).toHaveLength(2);
      result.terms.guarantees.forEach((guarantee, index) => {
      // check each guarantee has a correct id (transformed to upper case and underscores)
        expect(guarantee.id).toBe(
          mockControls[index].name.toUpperCase().replace(/\s+/g, '_')
        );
        // check description matches or is empty if not provided
        expect(guarantee.description).toBe(mockControls[index].description || '');
        // check the scope specifications provided
        expect(guarantee.scope).toEqual(mockScopeSpecs);
        // check property “of” has at least one element and contains the correct time window
        expect(guarantee.of).toBeInstanceOf(Array);
        guarantee.of.forEach((ofElement) => {
          expect(ofElement.window.period).toBe(
            mockControls[index].period.toLowerCase()
          );
        });
      });
      expect(result.id).to.be.a('string'); // Verify that the id is a string
      expect(result.id).to.have.string('tpa-'); // Verify that the id starts with 'tpa-'
      expect(result.id.length).toBeGreaterThan('tpa-'.length);
      expect(result.id.length).toBe('tpa-'.length + 36);
    });
    it('should allow overwriting context.validity and context.definitions', async () => {
      const mockCatalog = {};
      const mockControls = [{ id: 1, name: 'X', params: {}, period: 'DAILY' }];
      const overrides = {
        context: {
          validity: {
            initial: '2030-01-01',
            timeZone: 'UTC',
            startDate: '2030-01-01',
            endDate: '2031-01-01',
          },
          definitions: {
            schemas: { foo: 'bar' },
            scopes: { env: 'test' },
          },
        },
      };
      getScopeSetsByControlIdsSpy.mockResolvedValue({
        scopesKeySet: [],
        scopeSets: [],
      });
      getScopeSpecsSpy.mockResolvedValue({});

      const result = await agreementBuilder(mockCatalog, mockControls, overrides);

      expect(result.context.validity).toMatchObject(overrides.context.validity);
      expect(result.context.definitions).toMatchObject(
        overrides.context.definitions
      );

      expect(result.terms.guarantees[0].description).toBe('');
    });
    it('should use the provided id without adding "tpa-" if it already exists', async () => {
      getScopeSetsByControlIdsSpy.mockResolvedValue({
        scopesKeySet: [],
        scopeSets: [],
      });
      getScopeSpecsSpy.mockResolvedValue({});
      const result = await agreementBuilder({}, [], { id: 'tpa-custom-id' });
      expect(result.id).toBe('tpa-custom-id');
    });

  });
  describe('createMetrics', () => {
    it('createMetrics should return empty object if controls is undefined', () => {
      const result = createMetrics(undefined);
      expect(result).toEqual({});

    });
  });

  describe('createGuarantees', () => {
    it('createGuarantees should return empty array if controls is undefined', () => {
      const result = createGuarantees(undefined, {}, []);
      expect(result).toEqual([]);
    });
  });
});
