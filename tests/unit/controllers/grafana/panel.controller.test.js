import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addDashboardPanel,
  getPanelsByDashboardUID,
  getPanelQueryByID,
  getDashboardPanelQueriesByUID,
  deletePanelByID,
  updatePanelByID,
} from '../../../../src/controllers/panel.controller.js';
import { methods } from '../../../../src/config/grafana.js';
import { mockController } from '../../../utils/mockController.js';
import * as sqlBuilder from '../../../../src/utils/sqlQueryBuilder.js'
import { createMockPanel } from '../../../utils/createMockPanel.js';
import { createRes } from '../../../utils/responseHelpers.js';
const dashboardWithoutPanel = {
  meta: { folderUid: 'folder-123' },
  dashboard: {
  },
};

const emptyDashboard = {
  ...dashboardWithoutPanel,
  dashboard: {
    title: 'Empty Dashboard',
    uid: 'empty-uid',
    version: 1,
    panels: [],
  },
};

const dataPanelGraph = { id: 1,
  title: 'Panel 1',
  type: 'graph',
  rawSql: null,
  displayName: 'P1',
};
const dataPanelTable = {
  id: 2,
  title: 'Panel 2',
  type: 'table',
  rawSql: 'SELECT * FROM data_2',
  displayName: 'P2',
};
const dataPanelStat = {
  id: 3,
  title: 'Panel 3',
  type: 'stat',
  rawSql: null,
  displayName: 'P3',
};

const panel1 = createMockPanel({...dataPanelGraph, datasourceType: 'prometheus', gridPos: { x: 0, y: 0, w: 12, h: 8 },})
const panel2 = createMockPanel({...dataPanelTable, datasourceType: 'grafana-postgresql-datasource', gridPos: { x: 0, y: 8, w: 12, h: 8 },})
const panel3 = createMockPanel({...dataPanelStat, datasourceType: 'prometheus', gridPos: { x: 0, y: 16, w: 6, h: 4 }})

describe('Grafana: Panel Controller', () => {
  let req;
  let res;
  let mockDashboardData;

  beforeEach(() => {
    req = { body: {}, params: { uid: 'test-uid' } };
    res = createRes();
    vi.clearAllMocks();

    mockDashboardData = {
      ...dashboardWithoutPanel,
      dashboard: {
        title: 'Test Dashboard',
        uid: 'test-uid',
        version: 1,
        panels: [panel1, panel2, panel3
        ],
      },
    };
  });
  const PANEL_NOT_FOUND_MSG = 'Panel not found in dashboard.';

  const mockSuccessfulGetDashboard = (data) => {
    mockController(methods.dashboard, 'getDashboardByUID', { data }, null, false);
  };

  const mockSuccessfulPostDashboard = (data) => {
    mockController(methods.dashboard, 'postDashboard', { data }, null, false);
  };

  const mockFailedGetDashboard = (error) => {
    mockController(methods.dashboard, 'getDashboardByUID', null, error, null, false);
  };
  // --- addDashboardPanel Tests ---
  describe('addDashboardPanel', () => {
    const request = {
      title: 'New Panel',
      displayName: 'New Display',
      gridPos: { x: 0, y: 16, w: 12, h: 8 },
    }
    const postDashboard = { message: 'Panel updated', version: 2 }
    it('should return 201 and add a new panel using sqlQuery', async () => {
      req.body = {
        ...request,
        type: 'graph',
        sqlQuery: { model: 'points', operation: 'findAll', options: {} },
      };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue('SELECT * FROM points');
      mockSuccessfulGetDashboard(mockDashboardData)
      mockSuccessfulPostDashboard(postDashboard)


      await addDashboardPanel(req, res);

      expect(sqlBuilder.getSQLFromSequelize).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        panelId: 4,
        title: 'New Panel',
        type: 'graph',
        rawSql: 'SELECT * FROM points',
        displayName: 'New Display',
        gridPos: { x: 0, y: 16, w: 12, h: 8 },
      }));
    });

    it('should return 201 and add a new panel using custom targets', async () => {
      req.body = {
        ...request,
        type: 'stat',
        targets: [{ refId: 'C', expr: 'sum(metric)', datasource: { type: 'prometheus', uid: 'mock-ds' } }],
      };

      mockSuccessfulGetDashboard(mockDashboardData)
      mockSuccessfulPostDashboard(postDashboard)

      await addDashboardPanel(req, res);

      expect(sqlBuilder.getSQLFromSequelize).not.toHaveBeenCalled(); // Should not be called when targets are provided
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        panelId: 4,
        title: 'New Panel',
        type: 'stat',
        rawSql: undefined, // No rawSql in this case as targets were custom
        displayName: 'New Display',
      }));
    });

    it('should return 201 handle adding a panel to an empty dashboard', async () => {
      req.body = {
        ...request,
        type: 'graph',
        sqlQuery: { model: 'points', operation: 'findAll', options: {} },
      };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue('SELECT * FROM first_points');

      mockSuccessfulGetDashboard(emptyDashboard)
      mockSuccessfulPostDashboard(postDashboard)

      await addDashboardPanel(req, res);

      expect(sqlBuilder.getSQLFromSequelize).toHaveBeenCalledTimes(1);
      expect(methods.dashboard.postDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          dashboard: expect.objectContaining({
            version: 2,
            panels: [
              expect.objectContaining({
                id: 0, // First panel ID should be 0
                title: 'New Panel',
              }),
            ],
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ panelId: 0 }));
    });

    it('should return 500 if dashboard retrieval fails', async () => {
      const error = new Error('Grafana API error');
      mockFailedGetDashboard(error)

      req.body = {
        ...request,
        type: 'graph',
        sqlQuery: { model: 'points', operation: 'findAll' },
      };

      await addDashboardPanel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to add panel to dashboard in Grafana',
        error: 'Grafana API error',
      });
    });

    it('should return 500 if updating dashboard fails', async () => {
      const error = new Error('Grafana post error');
      mockSuccessfulGetDashboard(mockDashboardData)
      mockController(methods.dashboard, 'postDashboard', null, error, null, false);

      req.body = {
        ...request,
        type: 'graph',
        sqlQuery: { model: 'points', operation: 'findAll' },
      };
      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue('SELECT * FROM points');

      await addDashboardPanel(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to add panel to dashboard in Grafana',
        error: 'Grafana post error',
      });
    });

    it('should return 400 if neither targets nor sqlQuery are provided for a data-driven panel', async () => {
      req.body = {
        ...request,
        type: 'graph', // A type that typically requires data
      };
      mockSuccessfulGetDashboard(mockDashboardData)

      await addDashboardPanel(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing required fields.',
      });
    });
  });

  // --- getPanelsByDashboardUID Tests ---
  describe('getPanelsByDashboardUID', () => {
    const FAILED_RETRIEVE_PANELS_MSG = 'Failed to retrieve dashboard panels from Grafana';
    it('should return 200 and a list of panels when found', async () => {
      mockSuccessfulGetDashboard(mockDashboardData)

      await getPanelsByDashboardUID(req, res);

      expect(methods.dashboard.getDashboardByUID).toHaveBeenCalledWith('test-uid');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        {...dataPanelGraph,
          gridPos: { x: 0, y: 24, w: 12, h: 8 },
        },
        {...dataPanelTable,
          gridPos: { x: 0, y: 32, w: 12, h: 8 },
        },
        {...dataPanelStat,
          gridPos: { x: 0, y: 40, w: 6, h: 4 },
        },
      ]);
    });
    it('should return 200 and an empty array if no panels are found in the dashboard', async () => {

      mockSuccessfulGetDashboard(emptyDashboard)

      await getPanelsByDashboardUID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveLength(0);
    });

    it('should return 500 if dashboard retrieval fails', async () => {
      const error = new Error('Grafana API error');
      mockFailedGetDashboard(error);

      await getPanelsByDashboardUID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: FAILED_RETRIEVE_PANELS_MSG,
        error: 'Grafana API error',
      });
    });
    it('should return 404 if the dashboard itself is not found by UID', async () => {
      const error = new Error('Dashboard not found');
      error.response = { status: 404, data: { message: 'Dashboard not found' } };
      mockFailedGetDashboard(error);

      req.params.uid = 'non-existent-uid';

      await getPanelsByDashboardUID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: FAILED_RETRIEVE_PANELS_MSG,
        error: 'Dashboard not found'
      });
    });
    it('should return 404 if no panels are found in the dashboard', async () => {

      mockSuccessfulGetDashboard(dashboardWithoutPanel);

      await getPanelsByDashboardUID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: PANEL_NOT_FOUND_MSG,
      });
    });
  });

  // --- getPanelQueryByID Tests ---
  describe('getPanelQueryByID', () => {

    beforeEach(() => {
      req.params.id = '1';
    })
    it('should return 200 and the specific panel query when found', async () => {
      mockSuccessfulGetDashboard(mockDashboardData);

      await getPanelQueryByID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        ...dataPanelGraph,
        gridPos: { x: 0, y: 24, w: 12, h: 8 },
      });
    });

    it('should return 404 if no panels exist in the dashboard', async () => {

      mockSuccessfulGetDashboard(emptyDashboard);

      await getPanelQueryByID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: PANEL_NOT_FOUND_MSG,
      });
    });

    it('should return 500 if dashboard retrieval fails', async () => {
      const error = new Error('Grafana API error');
      mockFailedGetDashboard(error);

      await getPanelQueryByID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve panel from dashboard in Grafana',
        error: 'Grafana API error',
      });
    });
  });

  // --- getDashboardPanelQueriesByUID Tests ---
  describe('getDashboardPanelQueriesByUID', () => {
    it('should return 200 and a list of panel queries', async () => {
      mockSuccessfulGetDashboard(mockDashboardData);

      await getDashboardPanelQueriesByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        dataPanelGraph,
        dataPanelTable,
        dataPanelStat
      ]);
    });
    it('should return 200 if no panels', async () => {
      mockSuccessfulGetDashboard(emptyDashboard);

      await getDashboardPanelQueriesByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveLength(0);
    });
    it('should return 404 if no panels are found in the dashboard', async () => {

      mockSuccessfulGetDashboard(dashboardWithoutPanel);

      await getDashboardPanelQueriesByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveLength(0);
      expect(res.json).toHaveBeenCalledWith({
        message: PANEL_NOT_FOUND_MSG,
      });
    });

    it('should return 500 if dashboard retrieval fails', async () => {
      const error = new Error('Grafana API error');
      mockFailedGetDashboard(error);

      await getDashboardPanelQueriesByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve dashboard panel queries from Grafana',
        error: 'Grafana API error',
      });
    });
  });

  // --- deletePanelByID Tests ---
  describe('deletePanelByID', () => {
    beforeEach(() => {
      req.params.id = '1';
    })
    const dashboardDelete  = { message: 'Dashboard updated', version: 2 }
    it('should return 200 when a panel is deleted successfully', async () => {

      mockSuccessfulGetDashboard(mockDashboardData);
      mockSuccessfulPostDashboard(dashboardDelete);

      await deletePanelByID(req, res);

      expect(methods.dashboard.postDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          dashboard: expect.objectContaining({
            title: 'Test Dashboard',
            uid: 'test-uid',
            version: 2,
            panels: [panel2, panel3],
          }),
          overwrite: true,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(dashboardDelete);
    });
    it('should return 404 if no panels exist in the dashboard', async () => {

      mockSuccessfulGetDashboard(emptyDashboard);

      await deletePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: PANEL_NOT_FOUND_MSG,
      });
    });
    it('should return 404 if no panels are found in the dashboard', async () => {

      mockSuccessfulGetDashboard(dashboardWithoutPanel);
      await deletePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveLength(0);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No panels found in dashboard'
      });
    });
    it('should return 404 if the panel to delete is not found', async () => {
      req.params.id = '999'; // Non-existent ID
      mockSuccessfulGetDashboard(mockDashboardData);

      await deletePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: PANEL_NOT_FOUND_MSG,
      });
    });
    it('should return 500 if dashboard retrieval fails', async () => {
      const error = new Error('Grafana API error');
      mockFailedGetDashboard(error);

      await deletePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to delete panel in Grafana',
        error: 'Grafana API error',
      });
    });

    it('should return 500 if updating dashboard after deletion fails', async () => {
      const error = new Error('Grafana post error');
      mockSuccessfulGetDashboard(mockDashboardData);
      mockController(methods.dashboard, 'postDashboard', null, error, null, false);

      await deletePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to delete panel in Grafana',
        error: 'Grafana post error',
      });
    });
  });

  // --- updatePanelByID Tests ---
  describe('updatePanelByID', () => {
    beforeEach(() => {
      req.params.id = '1';
    })
    const updateDashboard = { message: 'Dashboard updated', version: 2 };
    it('should return 200 and update panel properties including sqlQuery', async () => {
      req.body = {
        title: 'Updated Panel Title',
        displayName: 'Updated Display Name',
        sqlQuery: { model: 'points', operation: 'findLast', options: {} },
        gridPos: { x: 1, y: 1, w: 6, h: 4 },
      };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue('SELECT * FROM points ORDER BY time DESC LIMIT 1');
      mockSuccessfulGetDashboard(mockDashboardData);
      mockSuccessfulPostDashboard(updateDashboard);

      await updatePanelByID(req, res);

      expect(sqlBuilder.getSQLFromSequelize).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Dashboard updated', version: 2 });
    });
    it('should return 200 and update panel type and related properties', async () => {
      req.body = {
        type: 'stat',
        title: 'Updated Stat Panel',
        displayName: 'New Stat Display',
        sqlQuery: { model: 'points', operation: 'count', options: {} },
      };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue('SELECT COUNT(*) FROM points');
      mockSuccessfulGetDashboard(mockDashboardData);
      mockSuccessfulPostDashboard(updateDashboard);

      await updatePanelByID(req, res);

      expect(sqlBuilder.getSQLFromSequelize).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Dashboard updated', version: 2 });
    });
    it('should return 200 and replace panel targets directly when targets array is provided', async () => {
      req.body = {
        targets: [{ refId: 'D', expr: 'new_metric_query', datasource: { type: 'loki', uid: 'loki-ds' } }],
      };

      mockSuccessfulGetDashboard(mockDashboardData);
      mockSuccessfulPostDashboard(updateDashboard);

      await updatePanelByID(req, res);

      expect(sqlBuilder.getSQLFromSequelize).not.toHaveBeenCalled(); // Should not be called if targets array is provided
      expect(methods.dashboard.postDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          dashboard: expect.objectContaining({
            version: 2,
            panels: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                targets: [{ refId: 'D', expr: 'new_metric_query', datasource: { type: 'loki', uid: 'loki-ds' } }],
              }),
            ]),
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Dashboard updated', version: 2 });
    });
    it('should return 200 update the table property when sqlQuery and table are provided', async () => {
      req.params.id = '2'; // Update Panel 2 (table type)
      req.body = {
        sqlQuery: { model: 'points', operation: 'findAll', options: {} },
        table: 'NewPointsTable' // Explicitly providing the new table name
      };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue('SELECT * FROM NewPointsTable');
      mockSuccessfulGetDashboard(mockDashboardData);
      mockSuccessfulPostDashboard(updateDashboard);

      await updatePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(sqlBuilder.getSQLFromSequelize).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Dashboard updated', version: 2 });
    });
    it('should return 404 if the panel to update is not found', async () => {
      req.params.id = '999'; // Non-existent ID
      req.body = { title: 'Non Existent' };

      mockSuccessfulGetDashboard(mockDashboardData);

      await updatePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveLength(0);
      expect(res.json).toHaveBeenCalledWith({
        message: PANEL_NOT_FOUND_MSG,
      });
    });
    it('should return 404 if no panels are found in the dashboard', async () => {

      mockSuccessfulGetDashboard(dashboardWithoutPanel);

      await updatePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveLength(0);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Dashboard not found or contains no panels.'
      });
    });
    it('should return 400 if an unsupported panel type is provided for update', async () => {

      req.body = {
        type: 'unsupported_type_update',
        title: 'Invalid Type Panel',
      };

      // mockController for getDashboardByUID to ensure panel exists initially
      mockSuccessfulGetDashboard(mockDashboardData);

      await updatePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unsupported panel type: unsupported_type_update',
      });
    });

    it('should return 400 if getSQLFromSequelize throws an error', async () => {
      req.body = {
        sqlQuery: { model: 'points', operation: 'invalidOp', options: {} },
      };

      const sqlError = new Error('Invalid Sequelize operation');

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockRejectedValue(sqlError);

      mockSuccessfulGetDashboard(mockDashboardData);

      await updatePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid Sequelize operation',
      });
    });
    it('should return 500 if updating dashboard fails', async () => {
      req.body = { title: 'Updated' };
      const error = new Error('Grafana post error');
      mockSuccessfulGetDashboard(mockDashboardData);
      mockController(methods.dashboard, 'postDashboard', null, error, null, false);

      await updatePanelByID(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to update panel in Grafana',
        error: 'Grafana post error',
      });
    });
  });
});
