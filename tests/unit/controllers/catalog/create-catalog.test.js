import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createCatalog } from '../../../../src/controllers/catalog.controller.js';
import { models } from '../../../../src/models/models.js';

import { createRes } from '../../../utils/responseHelpers.js';

// Mock modules
vi.mock('uuid', () => {
  return {
    v4: () => 'mocked-uuid'
  };
});

// --- Test Suite ---
describe('createCatalog', () => {
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
  
  it('should return 201 and the created catalog when all required fields are provided', async () => {
    // Setup
    const validCatalogData = {
      name: 'New Catalog',
      description: 'New Description',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      dashboard_id: 'dashboard-1',
      status: 'finalized'
    };
    
    const req = { body: validCatalogData };
    // Match the actual pattern used for tpaId in the controller
    const createdCatalog = { id: 3, ...validCatalogData, tpaId: expect.stringMatching(/^tpa-[a-f0-9-]{36}$/) };
    
    catalogSpy.mockResolvedValue(createdCatalog);
    
    // Execute
    await createCatalog(req, res);
    
    // Verify - use expect.objectContaining to match partial object
    expect(catalogSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: validCatalogData.name,
      description: validCatalogData.description,
      startDate: validCatalogData.startDate,
      endDate: validCatalogData.endDate,
      dashboard_id: validCatalogData.dashboard_id,
      status: 'finalized'
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdCatalog);
  });
  
  it('should set tpaId to null if status is draft', async () => {
    // Setup
    const draftCatalogData = {
      name: 'Draft Catalog',
      description: 'Draft Description',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      status: 'draft'
    };
    
    const req = { body: draftCatalogData };
    const createdDraftCatalog = { id: 4, ...draftCatalogData, tpaId: null };
    
    catalogSpy.mockResolvedValue(createdDraftCatalog);
    
    // Execute
    await createCatalog(req, res);
    
    // Verify
    expect(catalogSpy).toHaveBeenCalledWith({
      ...draftCatalogData,
      tpaId: null,
      status: 'draft'
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });
  
  it('should return 400 when required fields are missing', async () => {
    // Setup - missing startDate
    const invalidCatalogData = {
      name: 'Invalid Catalog',
      description: 'Missing required fields'
    };
    
    const req = { body: invalidCatalogData };
    
    // Execute
    await createCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: name, startDate, and/or endDate'
    });
    expect(catalogSpy).not.toHaveBeenCalled();
  });
  
  it('should return 500 on error', async () => {
    // Setup
    const validCatalogData = {
      name: 'Error Catalog',
      description: 'Will cause error',
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    };
    
    const req = { body: validCatalogData };
    const mockError = new Error('Database error');
    
    catalogSpy.mockRejectedValue(mockError);
    
    // Execute
    await createCatalog(req, res);
    
    // Verify
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to create catalog, error: ${mockError.message}`
    });
  });
});
