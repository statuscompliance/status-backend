import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDraftCatalog } from '../../../../src/controllers/catalog.controller.js';
import { models } from '../../../../src/models/models.js';
import { createRes } from '../../../utils/responseHelpers.js';

// --- Test Suite ---
describe('createDraftCatalog', () => {
  let res;
  let catalogSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup response object
    res = createRes();
    
    // Mock Catalog model methods
    catalogSpy = vi.spyOn(models.Catalog, 'create');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 201 and the created draft catalog', async () => {
    // Setup
    const draftCatalogData = {
      name: 'New Draft Catalog',
      description: 'Draft Description',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      dashboard_id: 'dashboard-draft'
    };
    
    const req = { body: draftCatalogData };
    const createdDraftCatalog = { 
      id: 3, 
      ...draftCatalogData, 
      tpaId: null, 
      status: 'draft' 
    };
    
    catalogSpy.mockResolvedValue(createdDraftCatalog);
    
    // Execute
    await createDraftCatalog(req, res);
    
    // Verify
    expect(catalogSpy).toHaveBeenCalledWith({
      ...draftCatalogData,
      tpaId: null,
      status: 'draft'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdDraftCatalog);
  });
  
  it('should return 400 when name or startDate is missing', async () => {
    // Setup - missing name
    const invalidDraftCatalogData = {
      description: 'Draft Description',
      startDate: '2025-01-01'
    };
    
    const req = { body: invalidDraftCatalogData };
    
    // Execute
    await createDraftCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: name and/or startDate'
    });
    expect(catalogSpy).not.toHaveBeenCalled();
  });
  
  it('should return 500 on error', async () => {
    // Setup
    const validDraftCatalogData = {
      name: 'Error Draft Catalog',
      description: 'Will cause error',
      startDate: '2025-01-01'
    };
    
    const req = { body: validDraftCatalogData };
    const mockError = new Error('Database error');
    
    catalogSpy.mockRejectedValue(mockError);
    
    // Execute
    await createDraftCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to create draft catalog, error: ${mockError.message}`
    });
  });
});
