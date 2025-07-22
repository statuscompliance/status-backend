import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCatalogs } from '../../../../src/controllers/catalog.controller.js';
import { models } from '../../../../src/models/models.js';

// --- Helpers ---
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

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
describe('getCatalogs', () => {
  let res;
  let catalogSpy;
  
  const mockCatalog = createCatalogExample();
  const mockDraftCatalog = createCatalogExample({
    id: 2,
    status: 'draft',
    tpaId: null
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup response object
    res = createRes();
    
    // Mock Catalog model methods
    catalogSpy = vi.spyOn(models.Catalog, 'findAll');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 200 with all catalogs when no status is provided', async () => {
    // Setup
    const mockCatalogs = [mockCatalog, mockDraftCatalog];
    const req = { query: {} };
    
    catalogSpy.mockResolvedValue(mockCatalogs);
    
    // Execute
    await getCatalogs(req, res);
    
    // Verify
    expect(catalogSpy).toHaveBeenCalledWith({ where: {} });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockCatalogs);
  });
  
  it('should return 200 with finalized catalogs when status=finalized', async () => {
    // Setup
    const req = { query: { status: 'finalized' } };
    const finalizedCatalogs = [mockCatalog];
    
    catalogSpy.mockResolvedValue(finalizedCatalogs);
    
    // Execute
    await getCatalogs(req, res);
    
    // Verify
    expect(catalogSpy).toHaveBeenCalledWith({ where: { status: 'finalized' } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(finalizedCatalogs);
  });
  
  it('should return 500 on error', async () => {
    // Setup
    const req = { query: {} };
    const mockError = new Error('Database error');
    
    catalogSpy.mockRejectedValue(mockError);
    
    // Execute
    await getCatalogs(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to retrieve catalogs, error: ${mockError.message}`
    });
  });
});
