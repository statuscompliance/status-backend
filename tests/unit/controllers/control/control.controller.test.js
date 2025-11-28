import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as control from '../../../../src/controllers/control.controller.js';
import { models } from '../../../../src/models/models.js';
import * as utils from '../../../../src/utils/checkRequiredProperties.js';
import * as panelUtils from '../../../../src/utils/panelUtils.js';
import { createControlExample } from '../../../utils/sampleControlsData.js';
import { mockController } from '../../../utils/mockController.js';
import { Op } from 'sequelize';
import { createRes } from '../../../utils/responseHelpers.js';

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
      const statusInvalid = 'bad';
      await control.getControls({ query: { status: statusInvalid } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: `Invalid value for "status": "${statusInvalid}". Allowed values are draft or finalized.`,
      });
    });

    it('should return 500 for internal server error', async () => {
      mockController(
        models.Control,
        'findAll',
        null,
        new Error('Internal error')
      );
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
      mockController(
        models.Control,
        'findByPk',
        null,
        new Error('Internal error')
      );

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
      const getControls = mockController(models.Control, 'findAll', [
        { any: 'clause' },
      ]);
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
      mockController(
        models.Control,
        'findAll',
        null,
        new Error('Internal error')
      );
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

    it('should return 201 when only startDate is valid', async () => {
      const newControl = { id: 'newControlId' };
      const controlWithStartDate = {
        ...bodyControl,
        startDate: '2023-01-01T00:00:00Z',
        endDate: undefined, // Ensure endDate is not present
      };
      mockController(models.Control, 'create', newControl);

      await control.createControl({ body: controlWithStartDate }, res);

      expect(models.Control.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2023-01-01T00:00:00Z'),
          endDate: null,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newControl);
    });

    it('should return 201 when only endDate is valid', async () => {
      const newControl = { id: 'newControlId' };
      const controlWithEndDate = {
        ...bodyControl,
        startDate: undefined, // Ensure startDate is not present
        endDate: '2023-12-31T23:59:59Z',
      };
      mockController(models.Control, 'create', newControl);

      await control.createControl({ body: controlWithEndDate }, res);

      expect(models.Control.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: null,
          endDate: new Date('2023-12-31T23:59:59Z'),
        })
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
      mockController(
        models.Control,
        'create',
        null,
        new Error('Internal error')
      );
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
    const finalizedControl = createControlExample({
      id: controlId,
      status: 'finalized',
      params: { endpoint: 'valid', threshold: 10 }, // Valid initial params
    });

    it('should return 404 if control to update does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.updateControl({ params: { id: invalidId }, body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if attempting to change status from finalized to draft', async () => {
      mockController(models.Control, 'findByPk', finalizedControl);

      await control.updateControl(
        { params: { id: controlId }, body: { status: 'draft' } },
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot change status from finalized to draft',
      });
    });

    it('should return 400 if a finalized control is updated with invalid params (no status change)', async () => {
      const finalizedControl = createControlExample({
        id: controlId,
        status: 'finalized',
        params: { some_invalid_param: 'value' }, // invalid params
      });
      mockController(models.Control, 'findByPk', finalizedControl);

      utils.checkRequiredProperties.mockReturnValueOnce({
        validation: false,
        textError: 'missing endpoint',
      });

      await control.updateControl(
        {
          params: { id: controlId },
          body: {
            name: 'Updated Name',
          },
        },
        res
      );

      expect(utils.checkRequiredProperties).toHaveBeenCalledWith(
        { some_invalid_param: 'value' },
        ['endpoint', 'threshold']
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid parameters for finalized control: missing endpoint',
      });
    });

    it('should return 200 and the updated control on successful update', async () => {
      const updatedControl = {
        ...currentControl,
        name: 'Updated Control',
        description: 'New Description',
        params: {},
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

    it('should return 500 for internal server error during update', async () => {
      mockController(models.Control, 'findByPk', controlId);

      // Mock the update method to throw an error, simulating a database failure
      vi.spyOn(models.Control, 'update').mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await control.updateControl(
        { params: { id: controlId }, body: { name: 'New Name' } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to update control',
        error: 'Database connection lost',
      });
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
    it('should return 500 for internal server error during panel addition', async () => {
      mockController(models.Control, 'findByPk', { id: controlId });

      // Mock models.Panel.create to throw an error, simulating a database failure
      vi.spyOn(models.Panel, 'create').mockImplementation(() => {
        throw new Error('Database write failed');
      });

      await control.addPanelToControl(
        {
          params: { id: controlId, panelId: panelId },
          body: { dashboardUid: 'dashboardUid' },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to add panel to control',
        error: 'Database write failed',
      });
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
    const controlCatalog = createControlExample({
      catalogId: 'catalog-1',
      status: 'draft',
    });

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
    it('should return 201 and the created draft control when description is not provided', async () => {
      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'draft',
      });
      const controlDataWithoutDescription = {
        ...controlCatalog,
        description: undefined, // Explicitly set to undefined
      };
      const createdControlResult = {
        ...controlDataWithoutDescription,
        description: '', // Expected default value control.controller.js
      };
      mockController(models.Control, 'create', createdControlResult);

      await control.createDraftControl(
        { body: controlDataWithoutDescription },
        res
      );

      expect(models.Control.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: '',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdControlResult);
    });

    it('should set period to MONTHLY by default if not provided', async () => {
      const controlBodyWithoutPeriod = {
        name: 'Control without period',
        catalogId: 'catalog-1',
        description: 'Some description',
        params: {}, // Provide valid params to pass initial validation
      };

      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        id: 'catalog-1',
        status: 'draft',
      });

      // Ensure checkRequiredProperties passes for this scenario
      vi.spyOn(utils, 'checkRequiredProperties').mockReturnValueOnce({
        validation: true,
        textError: '',
      });

      const createdControl = {
        ...controlCatalog,
        period: null, // default value MONTHLY
      };

      mockController(models.Control, 'create', createdControl);

      await control.createDraftControl({ body: controlBodyWithoutPeriod }, res);

      // Verify that models.Control.create was called with 'MONTHLY' for period
      expect(models.Control.create).toHaveBeenCalledWith(
        expect.objectContaining({
          period: 'MONTHLY',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdControl);
    });

    it('should return 500 for internal server error during draft control creation', async () => {
      // Ensure catalog exists and is draft
      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        id: 'catalog-1',
        status: 'draft',
      });

      // Mock the control creation to throw an error
      vi.spyOn(models.Control, 'create').mockImplementation(() => {
        throw new Error('Database insert failed for draft control');
      });

      await control.createDraftControl({ body: controlCatalog }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create draft control',
        error: 'Database insert failed for draft control',
      });
    });
  });

  describe('finalizeControl', () => {
    const controlCatalog = createControlExample({ catalogId: 'catalog-1' });

    it('should return 404 if control does not exist', async () => {
      mockController(models.Control, 'findByPk', null);
      await control.finalizeControl({ params: { id: invalidId } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if associated catalog does not exist during finalization', async () => {
      const draftControlWithMissingCatalog = {
        ...controlCatalog,
        catalogId: 'nonExistentCatalogId', // Point to a missing catalog
        status: 'draft',
      };
      mockController(
        models.Control,
        'findByPk',
        draftControlWithMissingCatalog
      );

      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce(null);

      await control.finalizeControl({ params: { id: controlId } }, res);

      expect(models.Catalog.findByPk).toHaveBeenCalledWith(
        'nonExistentCatalogId'
      );
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Associated catalog with ID nonExistentCatalogId not found.',
      });
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
    it('should return 500 for internal server error during control finalization', async () => {
      const draftControl = { ...controlCatalog, status: 'draft' };
      mockController(models.Control, 'findByPk', draftControl); // Control found and is draft

      vi.spyOn(models.Catalog, 'findByPk').mockResolvedValueOnce({
        status: 'finalized', // Catalog is finalized
      });

      // Mock the update method to throw an error, simulating a database failure
      vi.spyOn(models.Control, 'update').mockImplementation(() => {
        throw new Error('Database connection lost during finalization');
      });

      await control.finalizeControl({ params: { id: controlId } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to finalize control',
        error: 'Database connection lost during finalization',
      });
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
      mockController(
        models.Control,
        'findAll',
        null,
        new Error('Internal error')
      );
      await expect(
        control.finalizeControlsByCatalogId('catalog-1')
      ).rejects.toThrow('Internal error');
    });
  });
  describe('getModelById Helper', async () => {
    it('should use default resource name if not provided and return 404', async () => {
      mockController(models.Control, 'findByPk', null); // Mock findByPk to return null (not found)
      const mockRes = createRes(); // Use your helper to create a mock res

      // Call getModelById directly, omitting the 'name' option
      const result = await control.getModelById(
        mockRes,
        models.Control,
        'nonExistentId'
      );

      expect(result).toBeNull();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      // Crucially, expect the message to use the default 'Resource' name
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource with ID nonExistentId not found.',
      });
    });
  });
  //Pemdinf
  describe('getPendingControls', () => {
    const today = new Date().toISOString().split('T')[0];

    it('should return 200 with the list of pending controls', async () => {
      const mockControls = [{ id: 'ctrl-1' }, { id: 'ctrl-2' }];

      const spy = mockController(models.Control, 'findAll', mockControls);

      await control.getPendingControls({}, res);

      expect(spy).toHaveBeenCalledWith({
        where: {
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today },
          [Op.or]: [
            { lastComputed: null },
            { lastComputed: { [Op.lt]: today } },
          ],
          status: 'finalized',
        },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockControls);
    });

    it('should return 200 with empty list when no pending controls found', async () => {
      mockController(models.Control, 'findAll', []);

      await control.getPendingControls({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on internal server error', async () => {
      mockController(
        models.Control,
        'findAll',
        null,
        new Error('DB error')
      );

      await control.getPendingControls({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to get pending controls',
        error: 'DB error',
      });
    });
  });

});
