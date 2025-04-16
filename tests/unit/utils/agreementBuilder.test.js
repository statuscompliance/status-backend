import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  agreementBuilder,
  createMetrics,
  createGuarantees,
  createContext,
  createTerms,
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

  // Mock data for testing
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


  describe('buildAgreementObject', () => {
    it('should build the base agreement structure with correct metadata', async () => {

      getScopeSetsByControlIdsSpy.mockResolvedValue({
        scopesKeySet: ['region', 'service'],
        scopeSets: mockScopeSets,
      });
      getScopeSpecsSpy.mockResolvedValue(mockScopeSpecs);

      const result = await agreementBuilder(mockCatalog, mockControls);

      expect(result.version).toBe('1.0.0');
      expect(result.type).toBe('agreement');
      expect(result.context.validity).toEqual({
        initial: '2022-01-01',
        timeZone: 'America/Los_Angeles',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
      });
      expect(result.context.definitions).toEqual({
        schemas: {},
        scopes: {},
      });
      expect(result.id).toBeTypeOf('string');
      expect(result.id.startsWith('tpa-')).toBe(true);
      expect(result.id).toHaveLength('tpa-'.length + 36);
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
    it('should generate metrics based on the provided controls', () => {
      const result = createMetrics(undefined);
      expect(result).toEqual({});

    });
    it('should create metrics from the provided controls', () => {
      const result = createMetrics(mockControls);
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['UPTIME_CHECK_METRIC', 'RESPONSE_TIME_METRIC'])
      );
      expect(Object.keys(result)).toHaveLength(mockControls.length);
    });

  });

  describe('createGuarantees', () => {
    const result = createGuarantees(mockControls, mockScopeSpecs, mockScopeSets);

    it('should return an empty array if controls is undefined', () => {
      const undefinedControls = createGuarantees(undefined, {}, []);
      expect(undefinedControls).toEqual([]);
    });
    it('should return the same number of guarantees as controls', () => {
      expect(result).toHaveLength(mockControls.length);
    });

    it('should correctly map each control to a guarantee', () => {
      result.forEach((guarantee, index) => {
        const control = mockControls[index];
        const expectedId = control.name.toUpperCase().replace(/\s+/g, '_');
        const expectedDescription = control.description || '';

        expect(guarantee.id).toBe(expectedId);
        expect(guarantee.description).toBe(expectedDescription);
        expect(guarantee.scope).toEqual(mockScopeSpecs);
        expect(Array.isArray(guarantee.of)).toBe(true);
      });
    });
  });

  describe('createTerms', () => {
    it('should define metrics and return an array for guarantees', () => {
      getScopeSpecsSpy.mockResolvedValue(mockScopeSpecs);
      const result = createTerms(mockControls, getScopeSpecsSpy,  mockScopeSets);
      expect(result.metrics).toBeDefined();
      expect(result.guarantees).toBeInstanceOf(Array);
    });
  });

  describe('createContext', () => {
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

    });
    it('should build the default context if no overrides are provided', async () => {
      getScopeSetsByControlIdsSpy.mockResolvedValue({
        scopesKeySet: [],
        scopeSets: [],
      });
      getScopeSpecsSpy.mockResolvedValue({});

      const result = createContext(mockCatalog);

      expect(result.validity).toEqual({
        initial: '2022-01-01',
        timeZone: 'America/Los_Angeles',
        startDate: '2023-01-01',
        endDate: '2024-01-01',
      });
      expect(result.definitions).toEqual({ schemas: {}, scopes: {} });
    });
  });
});
