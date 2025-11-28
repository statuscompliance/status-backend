import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { finalizeCatalog } from '../../../../src/controllers/catalog.controller.js';
import { models } from '../../../../src/models/models.js';
import * as controlController from '../../../../src/controllers/control.controller.js';

import { createRes } from '../../../utils/responseHelpers.js';

// Mock modules
vi.mock('uuid', () => {
  return {
    v4: () => 'mocked-uuid'
  };
});

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
describe('finalizeCatalog', () => {
  let res;
  let findByPkSpy;
  let updateSpy;
  let finalizeControlsSpy;
  
  const catalogId = 1;
  const invalidId = 999;
  
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
    findByPkSpy = vi.spyOn(models.Catalog, 'findByPk');
    updateSpy = vi.spyOn(models.Catalog, 'update');
    
    // Mock finalizeControlsByCatalogId
    finalizeControlsSpy = vi.spyOn(controlController, 'finalizeControlsByCatalogId');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 200 and the finalized catalog when finalization is successful', async () => {
    // Setup
    const req = { params: { id: 2 } }; // ID of a draft catalog
    const updatedCatalog = {
      ...mockDraftCatalog,
      status: 'finalized',
      tpaId: expect.stringMatching(/^tpa-[a-f0-9-]{36}$/)
    };
    
    findByPkSpy.mockResolvedValue(mockDraftCatalog);
    updateSpy.mockResolvedValue([1, updatedCatalog]);
    finalizeControlsSpy.mockResolvedValue({
      updated: [{ id: 1 }, { id: 2 }] // 2 controls were finalized
    });
    
    // Execute
    await finalizeCatalog(req, res);
    
    // Verify - use numeric ID and expect.objectContaining
    expect(findByPkSpy).toHaveBeenCalledWith(2);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'finalized'
      }),
      expect.objectContaining({
        where: { id: 2 },
        returning: true,
        plain: true
      })
    );
    expect(finalizeControlsSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
  
  it('should return 404 if catalog does not exist', async () => {
    // Setup
    const req = { params: { id: invalidId } };
    
    findByPkSpy.mockResolvedValue(null);
    
    // Execute
    await finalizeCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Catalog not found' });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(finalizeControlsSpy).not.toHaveBeenCalled();
  });
  
  it('should return 400 if catalog is not in draft status', async () => {
    // Setup
    const req = { params: { id: catalogId } };
    
    findByPkSpy.mockResolvedValue(mockCatalog); // mockCatalog is already finalized
    
    // Execute
    await finalizeCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Only draft catalogs can be finalized' });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(finalizeControlsSpy).not.toHaveBeenCalled();
  });
  
  it('should return 400 if catalog is missing startDate or endDate', async () => {
    // Setup
    const req = { params: { id: 3 } };
    const invalidDraftCatalog = {
      ...mockDraftCatalog,
      id: 3,
      startDate: null // Missing startDate
    };
    
    findByPkSpy.mockResolvedValue(invalidDraftCatalog);
    
    // Execute
    await finalizeCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      message: 'Catalog must have startDate and endDate to be finalized' 
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(finalizeControlsSpy).not.toHaveBeenCalled();
  });
  
  it('should return 500 on error', async () => {
    // Setup
    const req = { params: { id: 2 } };
    const mockError = new Error('Database error');
    
    findByPkSpy.mockResolvedValue(mockDraftCatalog);
    updateSpy.mockRejectedValue(mockError);
    
    // Execute
    await finalizeCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to finalize catalog, error: ${mockError.message}`
    });
  });
});
