import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { updateOrCreateAgreement } from '../../../../src/controllers/catalog.controller.js';
import registry from '../../../../src/config/registry.js';
import * as agreementBuilderModule from '../../../../src/utils/agreementBuilder.js';

// --- Helpers ---
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
describe('updateOrCreateAgreement', () => {
  let registryGetSpy;
  let registryPostSpy;
  let registryPutSpy;
  let agreementBuilderSpy;
  
  const agreementId = 'tpa-a0b1c2d3-e4f5-6789-abcd-ef0123456789';
  const mockAgreement = {
    id: agreementId,
    name: 'Test Agreement',
    guarantees: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock registry methods
    registryGetSpy = vi.spyOn(registry, 'get');
    registryPostSpy = vi.spyOn(registry, 'post');
    registryPutSpy = vi.spyOn(registry, 'put');
    
    // Mock agreement builder
    agreementBuilderSpy = vi.spyOn(agreementBuilderModule, 'agreementBuilder');
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should update an existing agreement if it exists and has changes', async () => {
    // Setup
    const mockCatalog = createCatalogExample({ tpaId: agreementId });
    const mockControls = [{ id: 1, catalogId: mockCatalog.id }];
    
    // Mock agreementBuilder to return a new agreement object
    agreementBuilderSpy.mockResolvedValue(mockAgreement);
    
    // Mock registry.get to simulate an existing agreement
    registryGetSpy.mockResolvedValue({
      data: { ...mockAgreement, name: 'Old Name' } // Different from new agreement
    });
    
    // Mock registry.put for the update
    registryPutSpy.mockResolvedValue({ data: mockAgreement });
    
    // Execute
    await updateOrCreateAgreement(mockCatalog, mockControls, agreementId);
    
    // Verify
    expect(agreementBuilderSpy).toHaveBeenCalledWith(mockCatalog, mockControls, { id: agreementId });
    expect(registryGetSpy).toHaveBeenCalledWith(`api/v6/agreements/${agreementId}`);
    expect(registryPutSpy).toHaveBeenCalledWith(`api/v6/agreements/${agreementId}`, mockAgreement);
  });
  
  it('should not update an existing agreement if it exists and has no changes', async () => {
    // Setup
    const mockCatalog = createCatalogExample({ tpaId: agreementId });
    const mockControls = [{ id: 1, catalogId: mockCatalog.id }];
    
    // Mock agreementBuilder
    agreementBuilderSpy.mockResolvedValue(mockAgreement);
    
    // Mock registry.get to return the exact same agreement
    registryGetSpy.mockResolvedValue({ data: mockAgreement });
    
    // Execute
    await updateOrCreateAgreement(mockCatalog, mockControls, agreementId);
    
    // Verify
    expect(agreementBuilderSpy).toHaveBeenCalledWith(mockCatalog, mockControls, { id: agreementId });
    expect(registryGetSpy).toHaveBeenCalledWith(`api/v6/agreements/${agreementId}`);
    expect(registryPutSpy).not.toHaveBeenCalled(); // No update needed
  });
  
  it('should create a new agreement if it does not exist (404 response)', async () => {
    // Setup
    const mockCatalog = createCatalogExample({ tpaId: agreementId });
    const mockControls = [{ id: 1, catalogId: mockCatalog.id }];
    
    // Mock agreementBuilder
    agreementBuilderSpy.mockResolvedValue(mockAgreement);
    
    // Mock registry.get to simulate a 404 error
    const mockError = { response: { status: 404 } };
    registryGetSpy.mockRejectedValue(mockError);
    
    // Mock registry.post for the creation
    registryPostSpy.mockResolvedValue({ data: mockAgreement });
    
    // Execute
    await updateOrCreateAgreement(mockCatalog, mockControls, agreementId);
    
    // Verify
    expect(agreementBuilderSpy).toHaveBeenCalledWith(mockCatalog, mockControls, { id: agreementId });
    expect(registryGetSpy).toHaveBeenCalledWith(`api/v6/agreements/${agreementId}`);
    expect(registryPostSpy).toHaveBeenCalledWith('api/v6/agreements', mockAgreement);
  });
  
  it('should throw an error for non-404 error responses', async () => {
    // Setup
    const mockCatalog = createCatalogExample({ tpaId: agreementId });
    const mockControls = [{ id: 1, catalogId: mockCatalog.id }];
    
    // Mock agreementBuilder
    agreementBuilderSpy.mockResolvedValue(mockAgreement);
    
    // Mock registry.get to simulate a 500 error
    const mockError = { response: { status: 500 } };
    registryGetSpy.mockRejectedValue(mockError);
    
    // Execute & Verify
    await expect(updateOrCreateAgreement(mockCatalog, mockControls, agreementId))
      .rejects.toEqual(mockError);
    
    expect(agreementBuilderSpy).toHaveBeenCalledWith(mockCatalog, mockControls, { id: agreementId });
    expect(registryGetSpy).toHaveBeenCalledWith(`api/v6/agreements/${agreementId}`);
    expect(registryPostSpy).not.toHaveBeenCalled();
  });
});
