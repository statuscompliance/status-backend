import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCatalog } from '../../../../src/controllers/catalog.controller.js';
import { models } from '../../../../src/models/models.js';
import { createRes } from '../../../utils/responseHelpers.js';

function createCatalogExample(overrides = {}) {
  return {
    id: 1,
    name: 'Test Catalog',
    description: 'Test Description',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    dashboard_id: 'dashboard-1',
    tpaId: 'tpa-existing-uuid',
    status: 'finalized',
    ...overrides
  };
}

// --- Test Suite ---
describe('getCatalog', () => {
  let res;
  let catalogSpy;
  
  const catalogId = 1;
  const invalidId = 999;
  
  const mockCatalog = createCatalogExample();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup response object
    res = createRes();
    
    // Mock Catalog model methods
    catalogSpy = vi.spyOn(models.Catalog, 'findByPk');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 200 with the catalog if it exists', async () => {
    // Setup
    const req = { params: { id: catalogId } };
    
    catalogSpy.mockResolvedValue(mockCatalog);
    
    // Execute
    await getCatalog(req, res);
    
    // Verify
    expect(catalogSpy).toHaveBeenCalledWith(catalogId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCatalog);
  });
  
  it('should return 404 if catalog does not exist', async () => {
    // Setup
    const req = { params: { id: invalidId } };
    
    catalogSpy.mockResolvedValue(null);
    
    // Execute
    await getCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Catalog not found' });
  });
  
  it('should return 500 on error', async () => {
    // Setup
    const req = { params: { id: catalogId } };
    const mockError = new Error('Database error');
    
    catalogSpy.mockRejectedValue(mockError);
    
    // Execute
    await getCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to retrieve catalog, error: ${mockError.message}`
    });
  });
});
