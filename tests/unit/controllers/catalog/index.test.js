import { describe, it, expect } from 'vitest';
import * as catalogController from '../../../../src/controllers/catalog.controller.js';

describe('Catalog Controller Exports', () => {
  it('should export all required functions', () => {
    expect(catalogController.getCatalogs).toBeDefined();
    expect(catalogController.getCatalog).toBeDefined();
    expect(catalogController.createCatalog).toBeDefined();
    expect(catalogController.updateCatalog).toBeDefined();
    expect(catalogController.deleteCatalog).toBeDefined();
    expect(catalogController.calculatePoints).toBeDefined();
    expect(catalogController.updateOrCreateAgreement).toBeDefined();
    expect(catalogController.createDraftCatalog).toBeDefined();
    expect(catalogController.finalizeCatalog).toBeDefined();
    expect(catalogController.finalizeControlsByCatalogId).toBeDefined();
  });
});
