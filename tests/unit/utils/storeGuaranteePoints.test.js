import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeGuaranteePoints } from '../../../src/utils/storeGuaranteePoints.js'; // Adjust the path according to your structure
import { models } from '../../../src/models/models';
import { getDates } from '../../../src/utils/dates.js';

// Mock for the dates module (getDates)
vi.mock('../../../src/utils/dates.js', () => {
  return {
    getDates: vi.fn()
  };
});

describe('storeGuaranteePoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip guaranteeStates that do not match any guarantee term', async () => {
    const guaranteeStates = [
      {
        id: 1,
        period: { from: '2022-01-01', to: '2022-01-31' },
        metrics: { metric1: 10 },
        value: true,
        agreementId: 'A1',
        evidences: [],
        scope: { region: 'EU' }
      }
    ];
    const agreement = { terms: { guarantees: [] } };
    const result = await storeGuaranteePoints(guaranteeStates, agreement);
    expect(result).toEqual({ storedPoints: [], error: [] });
  });

  it('should detect a duplicate point and add an error message', async () => {
    // Configure getDates to return an array of Date objects
    getDates.mockReturnValue([
      new Date('2022-01-01T00:00:00.000Z'),
      new Date('2022-01-31T00:00:00.000Z')
    ]);
    
    // Configure models.Point.findOne to simulate that a point already exists
    vi.spyOn(models.Point, 'findOne').mockResolvedValue({ id: 'duplicatedPoint' });
    const guaranteeStates = [
      {
        id: 'g1',
        period: { from: '2022-01-01', to: '2022-01-31' },
        metrics: { metric1: 200 },
        value: false,
        agreementId: 'A2',
        evidences: [{ computationGroup: 'group2' }],
        scope: { region: 'US' }
      }
    ];
    const agreement = {
      terms: {
        guarantees: [
          {
            id: 'g1',
            of: [{ window: { period: 'monthly' } }]
          }
        ]
      }
    };

    const result = await storeGuaranteePoints(guaranteeStates, agreement);

    expect(models.Point.findOne).toHaveBeenCalledTimes(1);
    expect(result.error.length).toBeGreaterThan(0);
    expect(result.storedPoints).toEqual([]);
  });

  it('should catch and return an error when bulkCreate fails', async () => {
    getDates.mockReturnValue([
      new Date('2022-01-01T00:00:00.000Z'),
      new Date('2022-01-31T00:00:00.000Z')
    ]);
    vi.spyOn(models.Point, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.Point, 'bulkCreate').mockRejectedValue(new Error('Database error'));
    
    const guaranteeStates = [
      {
        id: 'g1',
        period: { from: '2022-01-01', to: '2022-01-31' },
        metrics: { metric1: 150 },
        value: true,
        agreementId: 'A3',
        evidences: [{ computationGroup: 'group3' }],
        scope: { region: 'APAC' }
      }
    ];
    const agreement = {
      terms: {
        guarantees: [
          { id: 'g1', of: [{ window: { period: 'monthly' } }] }
        ]
      }
    };
    
    const result = await storeGuaranteePoints(guaranteeStates, agreement);
    expect(models.Point.findOne).toHaveBeenCalled();
    expect(models.Point.bulkCreate).toHaveBeenCalled();
    expect(result.storedPoints).toEqual([]);
    expect(result.error[0].type).toBe('STORE_ERROR');
    expect(result.error[0].message).toBe('Error storing guarantee points');
  });
    
  it('should skip guaranteeStates if guaranteeTerm.of[0] does not have window', async () => {
    const guaranteeStates = [
      {
        id: 'g1',
        period: { from: '2022-01-01', to: '2022-01-31' },
        metrics: { metric1: 100 },
        value: true,
        agreementId: 'A1',
        evidences: [],
        scope: { region: 'EU' }
      }
    ];
    const agreement = {
      terms: {
        guarantees: [
          { id: 'g1', of: [{}] } // <- without window
        ]
      }
    };
  
    const result = await storeGuaranteePoints(guaranteeStates, agreement);
    expect(result.storedPoints).toEqual([]);
    expect(result.error).toEqual([]);
  });

  it('should catch and return an error if findOne throws an exception', async () => {
    getDates.mockReturnValue([
      new Date('2022-01-01T00:00:00.000Z'),
      new Date('2022-01-31T00:00:00.000Z')
    ]);
  
    const error = new Error('Fallo en findOne');
    vi.spyOn(models.Point, 'findOne').mockRejectedValue(error);
  
    const guaranteeStates = [
      {
        id: 'g1',
        period: { from: '2022-01-01', to: '2022-01-31' },
        metrics: { metric1: 150 },
        value: true,
        agreementId: 'A4',
        evidences: [{ computationGroup: 'group4' }],
        scope: { region: 'LATAM' }
      }
    ];
  
    const agreement = {
      terms: {
        guarantees: [
          { id: 'g1', of: [{ window: { period: 'monthly' } }] }
        ]
      }
    };
  
    const result = await storeGuaranteePoints(guaranteeStates, agreement);
  
    expect(models.Point.findOne).toHaveBeenCalled();
    expect(result.storedPoints).toEqual([]);
  });

  it('should skip guaranteeStates if period or its subproperties are missing', async () => {
    const guaranteeStates = [
      {
        id: 'g1',
        metrics: { metric1: 100 },
        value: true,
        agreementId: 'A1',
        evidences: [],
        scope: { region: 'EU' }
        // period is missing
      },
      {
        id: 'g2',
        period: {}, // period exists but is empty
        metrics: { metric1: 100 },
        value: true,
        agreementId: 'A1',
        evidences: [],
        scope: { region: 'EU' }
      },
      {
        id: 'g3',
        period: { from: '2022-01-01' }, // 'to' is missing
        metrics: { metric1: 100 },
        value: true,
        agreementId: 'A1',
        evidences: [],
        scope: { region: 'EU' }
      },
      {
        id: 'g4',
        period: { to: '2022-01-31' }, // 'from' is missing
        metrics: { metric1: 100 },
        value: true,
        agreementId: 'A1',
        evidences: [],
        scope: { region: 'EU' }
      }
    ];
    const agreement = {
      terms: {
        guarantees: [
          { id: 'g1', of: [{ window: { period: 'monthly' } }] },
          { id: 'g2', of: [{ window: { period: 'monthly' } }] },
          { id: 'g3', of: [{ window: { period: 'monthly' } }] },
          { id: 'g4', of: [{ window: { period: 'monthly' } }] }
        ]
      }
    };
  
    const result = await storeGuaranteePoints(guaranteeStates, agreement);
    expect(result.storedPoints).toEqual([]);
    expect(result.error).toEqual([]);
  });

  it('should use "monthly" as default if period is not specified in window', async () => {
    // Configure getDates to return two known dates
    const getDatesMock = getDates;
    const windowDates = [
      new Date('2022-01-01T00:00:00.000Z'),
      new Date('2022-01-31T00:00:00.000Z')
    ];
    
    getDatesMock.mockReturnValue(windowDates);
  
    // Simulate that no duplicate exists and point creation is successful.
    vi.spyOn(models.Point, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.Point, 'bulkCreate').mockResolvedValue(['createdPoint']);
  
    // Fixture: complete data so that the block that calls getDates is executed
    const guaranteeStates = [
      {
        id: 'g1',
        agreementId: 'DEF-123',
        period: { from: '2022-01-01', to: '2022-01-31' },
        metrics: { metric1: 123 },
        value: true,
        scope: { zone: 'NA' },
        evidences: [{ computationGroup: 'testGroup' }]
      }
    ];
  
    // In the guarantee, window exists but without the 'period' property, forcing the default value 'monthly'
    const agreement = {
      terms: {
        guarantees: [
          {
            id: 'g1',
            of: [{ window: {} }]
          }
        ]
      }
    };
  
    const result = await storeGuaranteePoints(guaranteeStates, agreement);
  
    expect(result.storedPoints).toEqual(['createdPoint']);
    expect(result.error).toEqual([]);
  });
});
