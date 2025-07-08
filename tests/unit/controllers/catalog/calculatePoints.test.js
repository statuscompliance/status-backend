import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculatePoints,
  //updateOrCreateAgreement
} from '../../../../src/controllers/catalog.controller.js';
import { models } from '../../../../src/models/models.js';
import registry from '../../../../src/config/registry.js';
import * as guarantees from '../../../../src/utils/storeGuaranteePoints.js';
import { mockController } from '../../../utils/mockController.js';
import { createControlExample } from '../../../utils/createControlExample.js';

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

const catalogId = 456;
const controlId = 123;
const invalidId = 'invalidId';
const mockAgreementId = 'tpa-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const mockCatalog = {
  id: catalogId,
  name: 'New Catalog',
  description: 'New Description',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  dashboard_id: 'dashboard-1',
  status: 'finalized',
  agreementId: mockAgreementId
};

describe('calculatePoints', () => {
  let res;
  let req;
  //let agreementUtils
  beforeEach(() => {
    //agreementUtils = { updateOrCreateAgreement: vi.fn() };
    vi.clearAllMocks();
    res = createRes();
    req = {
      params: { tpaId: mockAgreementId },
      query: {},
      cookies: {
        accessToken: 'token-fake'
      }
    };

  })
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if the agreementId format is invalid', async () => {
    const req = {
      params: { tpaId: invalidId },
      query: {}
    };

    await calculatePoints(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid agreementId format' });
  });

  it('should return 500 if Catalog.findOne throws an error', async () => {
    const error = 'DB error';

    mockController(
      models.Catalog,
      'findAll',
      null,
      new Error(error)
    );

    await calculatePoints(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to get points, error: ${error}`
    });
  });
  it('should return 500 if controls cannot be mapped due to invalid findAll response', async () => {

    const spyCatalog = mockController(models.Catalog, 'findOne', mockCatalog);
    mockController(models.Control, 'findAll', 'control not found');

    await calculatePoints(req, res);

    expect(spyCatalog).toHaveBeenCalledWith({ where:  {
      tpaId: mockAgreementId }}
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith( { message: 'Failed to get points, error: controls.map is not a function' });
  });
  it('should return 500 if registry.get returns null and storeGuaranteePoints returns errors', async () => {

    const mockControl = createControlExample({ id: controlId, catalogId });

    const spyCatalog = mockController(models.Catalog, 'findOne', mockCatalog);
    const spyControl = mockController(models.Control, 'findAll', [mockControl]);

    vi.spyOn(registry, 'get').mockReturnValue( null); // not found data
    vi.spyOn(guarantees, 'storeGuaranteePoints').mockReturnValue({
      storedPoints: [],
      error: [{ message: 'fake error' }]
    });

    await calculatePoints(req, res);

    expect(spyCatalog).toHaveBeenCalledWith({ where:  {
      tpaId: mockAgreementId }}
    );
    expect(spyControl).toHaveBeenCalledWith({ where:  {
      catalogId: catalogId }}
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Failed to get points, error: Cannot read properties of null (reading \'data\')'});
  });

  // TODO: Fix test failure caused by invalid URL construction in registry.get call.
  // Need to mock registry.get properly to avoid "Invalid URL" error in tests
  /*
  it('should return stored points if everything executes correctly and no errors are returned', async () => {
    const mockControl = createControlExample({ id: controlId, catalogId });
    const mockGuaranteeStatesData = [{
      agreementId: mockAgreementId,
      computationGroup: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      guaranteeId: 'string',
      guaranteeResult: true,
      guaranteeValue: 0,
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      metrics: {},
      scope: {},
      timestamp: '2025-07-08T11:14:28.367Z',
    }];
    const mockPoint =  {
      id: 'pointId',
      agreementId: mockAgreementId,
      guaranteeId: 'guaranteeId',
      guaranteeValue: 0,
      guaranteeResult: true,
      timestamp: '2025-07-08T11:14:28.367Z',
      metrics: {},
      scope: {},
      computationGroup: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    };

    mockController(models.Catalog, 'findOne', mockCatalog);
    mockController(models.Control, 'findAll', [mockControl]);
    mockController(models.Point, 'findAll', [mockPoint]);
    vi.spyOn(registry, 'get').mockResolvedValue({ data: mockGuaranteeStatesData });

    //vi.spyOn(registry, 'get').mockReturnValue({ data: 'any' });
    vi.spyOn(guarantees, 'storeGuaranteePoints').mockReturnValue({ storedPoints: [mockPoint], error: [] });

    // Mock updateOrCreateAgreement since it's called
    vi.spyOn(agreementUtils, 'updateOrCreateAgreement').mockResolvedValue(true)

    await calculatePoints(req, res);

    expect(models.Control.findAll).toHaveBeenCalledWith({
      where: { catalogId }
    });
    // expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([mockPoint]);
  });
  */
});
