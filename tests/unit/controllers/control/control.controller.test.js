import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as control from '../../../../src/controllers/control.controller.js';
import { models } from '../../../../src/models/models.js';
import * as utils from '../../../../src/utils/checkRequiredProperties.js';
import * as panelUtils from '../../../../src/utils/panelUtils.js';
import { createControlExample } from '../../../utils/createControlExample.js';
import { mockController } from '../../../utils/mockController.js';

// --- Helpers ---
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

// --- Suite ---
describe('Control Controller', () => {
  let res;
  const controlId = 'controlId';
  const panelId = 'panelId';
  const invalidId = 'invalidId';

  beforeEach(() => {
    vi.clearAllMocks();
    res = createRes();

    vi.spyOn(utils, 'checkRequiredProperties').mockReturnValue({
      validation: true,
      textError: '',
    });
  });

  describe('getControls', () => {
    it('should return 200 with an empty list', async () => {
      const spy = mockController(models.Control, 'findAll', []);

      await control.getControls({ query: {} }, res);
      expect(spy).toHaveBeenCalledWith({ where: {} });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 400 for invalid status filter', async () => {
      await control.getControls({ query: { status: 'bad' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid status filter: bad. Allowed values are finalized or draft.'
      });
    });

    it('should return 500 for internal server error', async () => {
      mockController(models.Control, 'findAll', null, new Error('Internal error'));
      await control.getControls({ query: {} }, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve controls',
        error: 'Internal error',
      });
    });
  });

  describe('getControl', () => {
    it('should return 404 if control does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.getControl({ params: { id: invalidId } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: `Control with ID ${invalidId} not found.`,
      });
    });

    it('should return 200 with the control if it exists', async () => {
      const mockControl = createControlExample({ id: controlId });

      mockController(models.Control, 'findByPk', mockControl);
      await control.getControl({ params: { id: '5' } }, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockControl);
    });

    it('should return 500 for internal server error', async () => {
      mockController(models.Control, 'findByPk', null, new Error('Internal error'));

      await control.getControl({ params: { id: '1' } }, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve control',
        error: 'Internal error',
      });
    });
  });

  describe('getCatalogControls', () => {
    const catalogId = 'catalog-1';
    it('should return 200 with controls filtered by catalogId', async () => {
      const getControls = mockController(models.Control, 'findAll', [{ any: 'clause' }]);
      const req = { params: { catalogId: catalogId }, query: { foo: 'bar' } };

      await control.getCatalogControls(req, res);

      expect(getControls).toHaveBeenCalledWith({
        where: { foo: 'bar', catalogId: catalogId },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid status filter', async () => {
      await control.getCatalogControls(
        { params: { catalogId: catalogId }, query: { status: 'any' } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 for internal server error', async () => {
      mockController(models.Control, 'findAll', null, new Error('Internal error'));
      await control.getCatalogControls(
        { params: { catalogId: catalogId }, query: {} },
        res
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve catalog controls',
        error: 'Internal error',
      });
    });
  });

  describe('createControl', () => {
    const bodyControl = createControlExample();

    it('should return 201 for valid control creation', async () => {
      const newControl = { id: 'newControlId' };
      mockController(models.Control, 'create', newControl);
      await control.createControl({ body: bodyControl }, res);

      expect(utils.checkRequiredProperties).toHaveBeenCalledWith(
        bodyControl.params,
        ['endpoint', 'threshold']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newControl);
    });
    it('should return 400 for invalid parameters', async () => {
      utils.checkRequiredProperties.mockReturnValueOnce({
        validation: false,
        textError: 'err',
      });

      await control.createControl(
        { body: { ...bodyControl, params: {} } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid parameters: err',
      });
    });

    it('should return 400 for malformed startDate', async () => {
      await control.createControl(
        { body: { ...bodyControl, startDate: 'malformed' } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid startDate format',
      });
    });
    it('should return 500 for internal server error during creation', async () => {
      mockController(models.Control, 'create', null, new Error('Internal error'));
      await control.createControl({ body: bodyControl }, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create control',
        error: 'Internal error',
      });
    });
  });

  describe('updateControl', () => {
    const currentControl = createControlExample({
      id: controlId,
      status: 'draft',
    });
    it('should return 404 if control to update does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.updateControl({ params: { id: invalidId }, body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if attempting to change status from finalized to draft', async () => {
      const finalized = createControlExample({
        id: 'any',
        status: 'finalized',
      });
      mockController(models.Control, 'findByPk', finalized);

      await control.updateControl(
        { params: { id: controlId }, body: { status: 'draft' } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot change status from finalized to draft',
      });
    });

    it('should return 200 and the updated control on successful update', async () => {
      const updatedControl = {
        ...currentControl,
        name: 'Updated Control',
        description: 'New Description',
      };

      vi.spyOn(models.Control, 'findByPk')
        .mockResolvedValueOnce(currentControl)
        .mockResolvedValueOnce(updatedControl);

      mockController(models.Control, 'update', [1]);

      await control.updateControl(
        { params: { id: controlId }, body: updatedControl },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedControl);
    });
  });

  describe('deleteControl', () => {
    it('should return 404 if control to delete does not exist', async () => {
      mockController(models.Control, 'destroy', 0);
      await control.deleteControl({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 204 on successful deletion', async () => {
      mockController(models.Control, 'destroy', 1);
      await control.deleteControl({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 500 for internal server error during deletion', async () => {
      mockController(models.Control, 'destroy', null, new Error('derr'));

      await control.deleteControl({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addPanelToControl', () => {
    it('should return 201 on successful panel addition', async () => {
      mockController(models.Control, 'findByPk', { id: controlId });
      const panel = { id: panelId, controlId: controlId, dashboardUid: 'u' };

      vi.spyOn(models.Panel, 'create').mockResolvedValueOnce(panel);

      await control.addPanelToControl(
        {
          params: { id: controlId, panelId: panelId },
          body: { dashboardUid: 'u' },
        },
        res
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Panel added to control successfully',
        data: panel,
      });
    });

    it('should return 404 if control does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.addPanelToControl(
        { params: { id: invalidId, panelId: panelId }, body: {} },
        res
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getPanelsByControlId', () => {
    beforeEach(() => {
      vi.spyOn(panelUtils, 'mapPanelsToDTO').mockResolvedValue([]);
      mockController(models.Control, 'findByPk', { id: controlId });
    });

    it('should return 200 with mapped panels DTO', async () => {
      vi.spyOn(models.Panel, 'findAll').mockResolvedValueOnce([
        { id: panelId },
      ]);

      panelUtils.mapPanelsToDTO.mockResolvedValueOnce([{ foo: 'bar' }]);

      await control.getPanelsByControlId({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ foo: 'bar' }]);
    });

    it('should return 404 if control does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.getPanelsByControlId({ params: { id: invalidId } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 if mapping panels fails', async () => {
      vi.spyOn(models.Panel, 'findAll').mockResolvedValueOnce([]);

      panelUtils.mapPanelsToDTO.mockRejectedValueOnce(
        new Error('Map panel error')
      );

      await control.getPanelsByControlId({ params: { id: invalidId } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to get panels from control, error in Grafana API',
        error: 'Map panel error',
      });
    });
  });

  describe('deletePanelFromControl', () => {
    const panelId = 'panelId';
    function mockPanelDestroy(returnValue, error = null) {
      const spy = vi.spyOn(models.Panel, 'destroy');

      if (error) spy.mockRejectedValueOnce(error);
      else spy.mockResolvedValueOnce(returnValue);
      return spy;
    }
    it('should return 404 if panel to delete does not exist for the control', async () => {
      mockPanelDestroy(0);
      await control.deletePanelFromControl(
        { params: { id: controlId, panelId: panelId } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should return 204 on successful panel deletion', async () => {
      mockPanelDestroy(1);
      await control.deletePanelFromControl(
        { params: { id: controlId, panelId: panelId } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
    it('should return 500 for internal server error during panel deletion', async () => {
      mockPanelDestroy(null, new Error('database error'));
      await control.deletePanelFromControl(
        { params: { id: controlId, panelId: panelId } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createDraftControl', () => {
    const controlCatalog = createControlExample({ catalogId: 'catalog-1' });

    it('should return 400 if required fields are missing', async () => {
      await control.createDraftControl({ body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 400 if params are invalid', async () => {
      utils.checkRequiredProperties.mockReturnValueOnce({
        validation: false,
        textError: 'required properties',
      });
      await control.createDraftControl(
        { body: { ...controlCatalog, params: {} } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 404 if catalog does not exist', async () => {
      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce(null);

      await control.createDraftControl({ body: controlCatalog }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should return 400 if catalog is not in draft status', async () => {
      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'finalized',
      });

      await control.createDraftControl({ body: controlCatalog }, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 201 and the created draft control', async () => {
      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'draft',
      });
      const controlDraft = { catalogId: 'catalog-1' };
      mockController(models.Control, 'create', controlDraft);

      await control.createDraftControl({ body: controlCatalog }, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(controlDraft);
    });
  });

  describe('finalizeControl', () => {
    const controlCatalog = createControlExample({ catalogId: 'catalog-1' });

    it('should return 404 if control does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.finalizeControl({ params: { id: invalidId } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
    it('should return 400 if control is not in draft status', async () => {
      mockController(models.Control, 'findByPk', {
        ...controlCatalog,
        status: 'finalized',
      });
      await control.finalizeControl({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 400 if associated catalog is not finalized', async () => {
      mockController(models.Control, 'findByPk', controlCatalog);

      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'draft',
      });

      await control.finalizeControl({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
    it('should return 400 if required parameters are invalid for finalizing', async () => {
      mockController(models.Control, 'findByPk', controlCatalog);

      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'finalized',
      });

      utils.checkRequiredProperties.mockReturnValueOnce({
        validation: false,
        textError: 'required properties',
      });
      await control.finalizeControl({ params: { id: controlId } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cannot finalize control: required properties',
      });
    });
    it('should return 200 and the finalized control on successful finalization', async () => {
      mockController(models.Control, 'findByPk', controlCatalog);
      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'finalized',
      });
      const updated = [{}, { id: controlId, status: 'finalized' }];

      vi.spyOn(models.Control, 'update').mockResolvedValueOnce(updated);

      await control.finalizeControl({ params: { id: controlId } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated[1][0]);
    });
  });

  describe('finalizeControlsByCatalogId', () => {
    it('should return an empty object if no draft controls are found', async () => {
      mockController(models.Control, 'findAll', []);
      const result = await control.finalizeControlsByCatalogId('catalog-1');
      expect(result).toEqual({});
    });
    it('should update existing draft controls to finalized', async () => {
      const otherControlId = 'otherControlId';
      const drafts = [{ id: controlId }, { id: otherControlId }];
      mockController(models.Control, 'findAll', drafts);
      const updated = ['draft'];

      const updateSpy = vi
        .spyOn(models.Control, 'update')
        .mockResolvedValueOnce(updated);

      const result = await control.finalizeControlsByCatalogId('catalog-1');

      expect(updateSpy).toHaveBeenCalledWith(
        { status: 'finalized' },
        { where: { id: [controlId, otherControlId] } }
      );
      expect(result).toBe(updated);
    });
    it('should throw an error if an internal error occurs', async () => {
      mockController(models.Control, 'findAll', null, new Error('Internal error'));
      await expect(
        control.finalizeControlsByCatalogId('catalog-1')
      ).rejects.toThrow('Internal error');
    });
  });
});
