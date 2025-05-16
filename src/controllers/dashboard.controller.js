import { methods } from '../config/grafana.js';
import { models } from '../models/models.js';
import createPanelTemplate from '../utils/panelStructures.js';
import { getSQLFromSequelize } from '../utils/sqlQueryBuilder.js';
import { handleControllerError } from '../utils/errorHandler.js';

export async function createDashboard(req, res) {
  try {
    const response = await methods.dashboard.postDashboard({
      dashboard: {
        annotations: req.body.dashboard.annotations || {
          list: [],
        },
        editable: req.body.dashboard.editable || true,
        fiscalYearStartMonth:
                    req.body.dashboard.fiscalYearStartMonth || 0,
        graphTooltip: req.body.dashboard.graphTooltip || 0,
        id: null,
        links: [],
        panels: req.body.dashboard.panels,
        schemaVersion: req.body.dashboard.schemaVersion || 16,
        tags: req.body.dashboard.tags || [],
        templating: req.body.dashboard.templating || {
          list: [],
        },
        time: req.body.dashboard.time || {
          from: 'now-6h',
          to: 'now',
        },
        timepicker: req.body.dashboard.timepicker || {},
        timezone: req.body.dashboard.timezone || 'browser',
        title: req.body.dashboard.title,
        version: req.body.dashboard.version || 0,
        weekStart: req.body.dashboard.weekStart || '',
      },
      overwrite: req.body.overwrite || true,
      inputs: req.body.inputs || [],
      folderUid: req.body.folderUid,
      message: 'Dashboard created successfully',
    });
    return res.status(201).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create dashboard in Grafana');
  }
}

export async function importDashboard(req, res) {
  try {
    const response = await methods.dashboard.importDashboard({
      dashboard: {
        annotations: req.body.dashboard.annotations || {
          list: [],
        },
        editable: req.body.dashboard.editable || true,
        fiscalYearStartMonth:
                    req.body.dashboard.fiscalYearStartMonth || 0,
        graphTooltip: req.body.dashboard.graphTooltip || 0,
        id: null,
        links: [],
        panels: req.body.dashboard.panels,
        schemaVersion: req.body.dashboard.schemaVersion || 16,
        tags: req.body.dashboard.tags || [],
        templating: req.body.dashboard.templating || {
          list: [],
        },
        time: req.body.dashboard.time || {
          from: 'now-6h',
          to: 'now',
        },
        timepicker: req.body.dashboard.timepicker || {},
        timezone: req.body.dashboard.timezone || 'browser',
        title: req.body.dashboard.title,
        version: req.body.dashboard.version || 0,
        weekStart: req.body.dashboard.weekStart || '',
      },
      overwrite: req.body.overwrite || true,
      inputs: req.body.inputs || [],
      folderUid: req.body.folderUid,
    });
    return res.status(201).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to import dashboard in Grafana');
  }
}

export async function getDashboardByUID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve dashboard in Grafana');
  }
}

export async function deleteDashboardByUID(req, res) {
  try {
    const response = await methods.dashboard.deleteDashboardByUID(
      req.params.uid
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to delete dashboard in Grafana');
  }
}

export async function createDashboardTemplate(req, res) {
  try {
    const { name, folderId, startDate, endDate } = req.body;

    // Set time range based on startDate and endDate parameters
    let timeRange = {
      from: 'now-6h',
      to: 'now'
    };

    if (startDate) {
      const startDateObj = new Date(startDate);
      timeRange.from = startDateObj.toISOString();
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      timeRange.to = endDateObj.toISOString();
    }

    const dashboardTemplate = {
      dashboard: {
        annotations: {
          list: []
        },
        editable: true,
        fiscalYearStartMonth: 0,
        graphTooltip: 0,
        panels: [],
        schemaVersion: 27,
        tags: [],
        templating: {
          list: []
        },
        time: timeRange,
        timepicker: null,
        timezone: 'browser',
        title: name || 'New Dashboard Template',
        version: 0,
        weekStart: ''
      },
      overwrite: false,
      inputs: [{}],
      folderUid: folderId || null
    };

    const response = await methods.dashboard.postDashboard(dashboardTemplate);
    return res.status(201).json({
      message: 'Dashboard template created successfully',
      dashboard: response.data
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create dashboard template in Grafana');
  }
}

export async function createTemporaryDashboard(req, res) {
  try {
    const { panelConfig, title, baseDashboardUid, timeRange, autoCleanup } = req.body;
    let dashboardTemplate = {
      annotations: { list: [] },
      editable: true,
      fiscalYearStartMonth: 0,
      graphTooltip: 0,
      panels: [],
      schemaVersion: 27,
      tags: ['temp', 'preview'],
      templating: { list: [] },
      time: timeRange || { from: 'now-6h', to: 'now' },
      timepicker: {},
      timezone: 'browser',
      title: title || `Temp Preview - ${new Date().toISOString()}`,
      version: 0,
      weekStart: '',
      refresh: '5s'
    };

    if (baseDashboardUid) {
      try {
        const baseResponse = await methods.dashboard.getDashboardByUID(baseDashboardUid);
        if (baseResponse.data && baseResponse.data.dashboard) {
          const baseDashboard = baseResponse.data.dashboard;
          dashboardTemplate = {
            ...baseDashboard,
            id: null,
            uid: null,
            title: title || `Temp Preview - ${new Date().toISOString()}`,
            tags: [...(baseDashboard.tags || []), 'temp', 'preview'],
            panels: []
          };
        }
      } catch (error) {
        console.warn('Error al obtener dashboard base:', error.message);
      }
    }

    if (panelConfig) {
      try {
        const newPanel = createPanelTemplate(panelConfig.type || 'gauge');
        newPanel.id = 1;
        newPanel.title = panelConfig.title || 'Panel Preview';
        newPanel.gridPos = panelConfig.gridPos || { x: 0, y: 0, w: 24, h: 15 };
        if (panelConfig.displayName) {
          newPanel.fieldConfig.defaults.displayName = panelConfig.displayName;
        }
        if (panelConfig.targets) {
          newPanel.targets = panelConfig.targets;
        } else if (panelConfig.sqlQuery && newPanel.targets && newPanel.targets.length > 0) {
          const { model, operation, options } = panelConfig.sqlQuery;
          const generatedSQLquery = await getSQLFromSequelize(
            models[model],
            operation,
            options
          );
          newPanel.targets[0].rawSql = typeof panelConfig.sqlQuery === 'string'
            ? panelConfig.sqlQuery
            : generatedSQLquery;
          newPanel.targets[0].table = panelConfig.table || 'Points';
        }
        dashboardTemplate.panels.push(newPanel);
      } catch (error) {
        return res.status(400).json({
          message: error.message || `Tipo de panel no soportado: ${panelConfig.type}`
        });
      }
    }

    const dashboardData = {
      dashboard: dashboardTemplate,
      overwrite: false,
      message: 'Temporary dashboard created successfully',
      folderUid: null,
      refresh: '5s'
    };
    const response = await methods.dashboard.postDashboard(dashboardData);

    return res.status(201).json({
      message: 'Temporary dashboard created successfully',
      dashboard: response.data,
      isTemporary: true,
      created: new Date().toISOString(),
      autoCleanup: autoCleanup !== false
    });
  } catch (error) {
    return handleControllerError(res, error, 'Error creating temporary dashboard in Grafana');
  }
}
