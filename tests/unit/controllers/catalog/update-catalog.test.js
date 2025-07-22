import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { updateCatalog } from '../../../../src/controllers/catalog.controller.js';
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
describe('updateCatalog', () => {
  let res;
  let findByPkSpy;
  let updateSpy;
  
  const catalogId = 1;
  const invalidId = 999;
  
  const mockCatalog = createCatalogExample();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup response object
    res = createRes();
    
    // Mock Catalog model methods
    findByPkSpy = vi.spyOn(models.Catalog, 'findByPk');
    updateSpy = vi.spyOn(models.Catalog, 'update');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 200 and the updated catalog', async () => {
    // Setup
    const updateData = {
      name: 'Updated Catalog',
      description: 'Updated Description',
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      dashboard_id: 'dashboard-2',
      tpaId: 'tpa-existing-uuid',
      status: 'finalized'
    };
    
    const req = { params: { id: catalogId }, body: updateData };
    const updatedCatalog = { id: catalogId, ...updateData };
    
    findByPkSpy.mockResolvedValue(mockCatalog);
    updateSpy.mockResolvedValue([1, updatedCatalog]);
    
    // Execute
    await updateCatalog(req, res);
    
    // Verify
    expect(findByPkSpy).toHaveBeenCalledWith(catalogId);
    expect(updateSpy).toHaveBeenCalledWith(
      updateData,
      {
        where: { id: catalogId },
        returning: true,
        plain: true
      }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedCatalog);
  });
  
  it('should return 404 if catalog does not exist', async () => {
    // Setup
    const req = { 
      params: { id: invalidId },
      body: { name: 'Non-existent Catalog' }
    };
    
    findByPkSpy.mockResolvedValue(null);
    
    // Execute
    await updateCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Catalog not found' });
    expect(updateSpy).not.toHaveBeenCalled();
  });
  
  it('should return 400 if trying to change status from finalized to draft', async () => {
    // Setup
    const invalidUpdateData = {
      status: 'draft'
    };
    
    const req = { params: { id: catalogId }, body: invalidUpdateData };
    
    findByPkSpy.mockResolvedValue(mockCatalog); // mockCatalog has status='finalized'
    
    // Execute
    await updateCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot change status from finalized to draft'
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });
  
  it('should return 500 on error', async () => {
    // Setup
    const req = { 
      params: { id: catalogId },
      body: { name: 'Error Catalog' }
    };
    const mockError = new Error('Database error');
    
    findByPkSpy.mockResolvedValue(mockCatalog);
    updateSpy.mockRejectedValue(mockError);
    
    // Execute
    await updateCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to update catalog, error: ${mockError.message}`
    });
  });
});
