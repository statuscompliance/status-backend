import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeGuaranteePoints } from '../../../src/utils/storeGuaranteePoints.js';
import { models } from '../../../src/models/models';
import { getDates } from '../../../src/utils/dates.js';

vi.mock('../../../src/utils/dates.js', () => ({
  getDates: vi.fn(),
}));

const mockGetDates = getDates;

const createGuaranteeState = (overrides = {}) => ({
  id: 'g1',
  period: { from: '2022-01-01', to: '2022-01-31' },
  metrics: { metric1: 10 },
  value: true,
  agreementId: 'A1',
  evidences: [{ computationGroup: 'group1' }],
  scope: { region: 'EU' },
  ...overrides,
});

const createAgreement = (overrides = {}) => ({
  terms: {
    guarantees: [
      {
        id: 'g1',
        of: [{ window: { period: 'monthly' } }],
      },
    ],
  },
  ...overrides,
});

describe('storeGuaranteePoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should skip guaranteeStates with no matching guarantee term', async () => {
    const agreement = createAgreement({ terms: { guarantees: [] } });
    const result = await storeGuaranteePoints([createGuaranteeState()], agreement);
    expect(result).toEqual({ storedPoints: [], error: [] });
  });

  it('should detect a duplicate point and add an error message', async () => {
    vi.spyOn(models.Point, 'findOne').mockResolvedValue({ id: 'existing' });

    const result = await storeGuaranteePoints([createGuaranteeState()], createAgreement());

    expect(models.Point.findOne).toHaveBeenCalledOnce();
    expect(result.storedPoints).toEqual([]);
    expect(result.error).toHaveLength(1);
    expect(result.error[0].type).toBe('DUPLICATE_POINT');
    expect(result.error[0].data.guaranteeId).toBe('g1');
  });

  it('should return an error if findOne throws', async () => {
    const error = new Error('DB error');
    vi.spyOn(models.Point, 'findOne').mockRejectedValue(error);

    const result = await storeGuaranteePoints([createGuaranteeState()], createAgreement());

    expect(result.storedPoints).toEqual([]);
    expect(result.error).toHaveLength(1);
    expect(result.error[0].type).toBe('CHECK_ERROR');
    expect(result.error[0].message).toBe('Error checking existing point');
  });

  it('should return an error if bulkCreate fails', async () => {
    vi.spyOn(models.Point, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.Point, 'bulkCreate').mockRejectedValue(new Error('Insert failed'));

    mockGetDates.mockReturnValue([
      new Date('2022-01-01'),
      new Date('2022-01-31'),
    ]);

    const result = await storeGuaranteePoints([createGuaranteeState()], createAgreement());

    expect(models.Point.bulkCreate).toHaveBeenCalled();
    expect(result.storedPoints).toEqual([]);
    expect(result.error[0].type).toBe('STORE_ERROR');
  });

  it('should use "monthly" as default period if window has no period', async () => {
    vi.spyOn(models.Point, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.Point, 'bulkCreate').mockResolvedValue(['createdPoint']);

    mockGetDates.mockReturnValue([
      new Date('2022-01-01'),
      new Date('2022-01-31'),
    ]);

    const agreement = createAgreement({
      terms: { guarantees: [{ id: 'g1', of: [{ window: {} }] }] },
    });

    const result = await storeGuaranteePoints([createGuaranteeState()], agreement);

    expect(result.storedPoints).toEqual(['createdPoint']);
    expect(result.error).toEqual([]);
  });

  it('should skip guaranteeStates if guaranteeTerm.of[0] has no window', async () => {
    const agreement = createAgreement({
      terms: { guarantees: [{ id: 'g1', of: [{}] }] },
    });

    const result = await storeGuaranteePoints([createGuaranteeState()], agreement);

    expect(result.storedPoints).toEqual([]);
    expect(result.error).toEqual([]);
  });

  it('should skip guaranteeStates with invalid period data', async () => {
    const invalidStates = [
      createGuaranteeState({ period: undefined }),
      createGuaranteeState({ period: {} }),
      createGuaranteeState({ period: { from: '2022-01-01' } }),
      createGuaranteeState({ period: { to: '2022-01-31' } }),
    ];

    const agreement = createAgreement({
      terms: {
        guarantees: invalidStates.map((s) => ({
          id: s.id,
          of: [{ window: { period: 'monthly' } }],
        })),
      },
    });

    const result = await storeGuaranteePoints(invalidStates, agreement);

    expect(result.storedPoints).toEqual([]);
    expect(result.error).toEqual([]);
  });

  it('should store a valid guarantee point (happy path)', async () => {
    const guaranteeState = createGuaranteeState();
    const agreement = createAgreement();

    vi.spyOn(models.Point, 'findOne').mockResolvedValue(null);
    vi.spyOn(models.Point, 'bulkCreate').mockResolvedValue(['createdPoint']);

    mockGetDates.mockReturnValue([
      new Date('2022-01-01'),
      new Date('2022-01-31'),
    ]);

    const result = await storeGuaranteePoints([guaranteeState], agreement);

    expect(models.Point.findOne).toHaveBeenCalledOnce();
    expect(models.Point.bulkCreate).toHaveBeenCalledOnce();
    expect(result.storedPoints).toEqual(['createdPoint']);
    expect(result.error).toEqual([]);
  });
});
