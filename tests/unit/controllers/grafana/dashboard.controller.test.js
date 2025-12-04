import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDashboard,
  importDashboard,
  getDashboardByUID,
  deleteDashboardByUID,
  createDashboardTemplate,
  createTemporaryDashboard,
} from '../../../../src/controllers/dashboard.controller.js';
import { mockController } from '../../../utils/mockController.js';
import { methods } from '../../../../src/config/grafana.js';
import * as sqlBuilder from '../../../../src/utils/sqlQueryBuilder.js';

describe('Grafana: Dashboard Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('createDashboard', () => {
    it('should return 201 and the created dashboard when creation succeeds', async () => {
      const mockResponse = { id: 1 };
      req.body = {
        dashboard: { title: 'Test Dashboard', panels: [] },
        folderUid: 'folder-1',
        annotations: 'asd'
      };
      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 500 and error message when dashboard creation fails', async () => {
      const error = new Error('Dashboard creation failed');
      mockController(methods.dashboard, 'postDashboard', null, error, null, false);

      await createDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create dashboard in Grafana',
        error: "Cannot read properties of undefined (reading 'annotations')",
      });
    });
  });

  describe('importDashboard', () => {
    it('should return 201 and the imported dashboard when import is successful', async () => {
      const mockResponse = { id: 2 };
      req.body = {
        dashboard: { title: 'Imported Dashboard', panels: [] },
        folderUid: 'folder-2'
      };
      mockController(methods.dashboard, 'importDashboard', { data: mockResponse }, null, false);

      await importDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });
    it('should return 500 and error message when dashboard import fails', async () => {
      const error = new Error('Import error');
      mockController(methods.dashboard, 'importDashboard', null, error, null, false);

      await importDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to import dashboard in Grafana',
        error: "Cannot read properties of undefined (reading 'annotations')",
      });
    });
  });

  describe('getDashboardByUID', () => {
    it('should return 200 and dashboard data when the UID exists', async () => {
      const mockResponse = { id: 3 };
      req.params.uid = 'uid-123';
      mockController(methods.dashboard, 'getDashboardByUID', { data: mockResponse }, null, false);

      await getDashboardByUID(req, res);

      expect(methods.dashboard.getDashboardByUID).toHaveBeenCalledWith('uid-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });
    it('should return 500 and error message when dashboard retrieval fails', async () => {
      const error = new Error('Retrieve failed');
      mockController(methods.dashboard, 'getDashboardByUID', null, error, null, false);

      await getDashboardByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve dashboard in Grafana',
        error: 'Retrieve failed',
      });
    });
  });

  describe('deleteDashboardByUID', () => {
    it('should return 200 when dashboard is deleted successfully by UID', async () => {
      const mockResponse = { message: 'Deleted' };
      req.params.uid = 'uid-456';
      mockController(methods.dashboard, 'deleteDashboardByUID', { data: mockResponse }, null, false);

      await deleteDashboardByUID(req, res);

      expect(methods.dashboard.deleteDashboardByUID).toHaveBeenCalledWith('uid-456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });
    it('should return 500 and error message when dashboard deletion fails', async () => {
      const error = new Error('Delete failed');
      mockController(methods.dashboard, 'deleteDashboardByUID', null, error, null, false);

      await deleteDashboardByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to delete dashboard in Grafana',
        error: 'Delete failed',
      });
    });
  });

  describe('createDashboardTemplate', () => {
    it('should return 201 and template info when created with default time range', async () => {
      const mockResponse = { id: 4 };
      req.body = { name: 'Template Test' };
      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createDashboardTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Dashboard template created successfully',
        dashboard: mockResponse
      });
    });
    it('should return 201 when custom time range is provided and template is created', async () => {
      const mockResponse = { id: 5 };
      req.body = {
        name: 'Time Range Template',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-02T00:00:00Z'
      };
      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createDashboardTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
    it('should return 500 and error message when template creation fails', async () => {
      // ...
      const error = new Error('Creation failed');
      mockController(methods.dashboard, 'postDashboard', null, error, null, false);

      await createDashboardTemplate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create dashboard template in Grafana',
        error: 'Creation failed',
      });
    });
  });

  describe('createTemporaryDashboard', () => {
    it('should handle error when baseDashboardUid fetch fails', async () => {
      const error = new Error('Base dashboard fetch error');
      mockController(methods.dashboard, 'getDashboardByUID', null, error, null, false);
      mockController(methods.dashboard, 'postDashboard', { data: { id: 9 } }, null, false);

      req.body = {
        baseDashboardUid: 'invalid-uid',
        panelConfig: { type: 'gauge' }
      };

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201); // still continues despite error
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temporary dashboard created successfully',
        isTemporary: true,
        autoCleanup: true,
      }));
    });

    it('should return 201 and metadata when a temporary dashboard is created with default values', async () => {
      const mockResponse = { id: 6 };
      req.body = { panelConfig: { type: 'gauge' } };
      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temporary dashboard created successfully',
        isTemporary: true,
        autoCleanup: true,
      }));
    });

    it('should return 400 and a clear message when panel type is unsupported', async () => {
      const invalidType = 'invalid_type';
      req.body = {
        panelConfig: { type: invalidType }
      };

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: `Unsupported panel type: ${invalidType}`

      });

    });
    it('should return 201 when a base dashboard UID is provided and used to create the new dashboard', async () => {
      const mockResponse = { dashboard: { title: 'Base Dashboard', panels: [], tags: [] } };
      mockController(methods.dashboard, 'getDashboardByUID', { data: mockResponse }, null, false);
      mockController(methods.dashboard, 'postDashboard', { data: { id: 7 } }, null, false);

      req.body = {
        baseDashboardUid: 'base-uid',
        panelConfig: { type: 'gauge' }
      };

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
    it('should return 500 and error message when temporary dashboard creation fails', async () => {
      const error = new Error('Create failed');
      mockController(methods.dashboard, 'postDashboard', null, error, null, false);

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating temporary dashboard in Grafana',
        error: 'Create failed',
      });
    });

    it('should create dashboard with a specific displayName for the panel', async () => {
      const mockResponse = { id: 11 };
      req.body = {
        panelConfig: { type: 'stat', displayName: 'My Custom Display Name' }
      };
      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temporary dashboard created successfully',
        isTemporary: true,
        autoCleanup: true,
      }));
    })
    it('should create dashboard with custom targets for the panel', async () => {
      const mockResponse = { id: 12 };
      req.body = {
        panelConfig: {
          type: 'graph',
          targets: [{ refId: 'A', expr: 'my_metric' }]
        }
      };
      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temporary dashboard created successfully',
        isTemporary: true,
        autoCleanup: true,
      }));
    });
    it('should create panel using sqlQuery when targets is not present', async () => {
      const mockSQL = 'SELECT * FROM Points';
      const mockResponse = { id: 13 };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue(mockSQL);

      req.body = {
        panelConfig: {
          type: 'table',
          sqlQuery: {
            model: 'points',
            operation: 'findAll',
            options: {}
          },
          table: 'Points'
        }
      };

      mockController(methods.dashboard, 'postDashboard', { data: mockResponse }, null, false);

      await createTemporaryDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temporary dashboard created successfully',
        isTemporary: true
      }));
    });
  });
});
