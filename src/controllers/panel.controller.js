import { methods } from '../config/grafana.js';
import { models } from '../models/models.js';
import createPanelTemplate from '../utils/panelStructures.js';
import { getSQLFromSequelize } from '../utils/sqlQueryBuilder.js';
import { handleControllerError } from '../utils/errorHandler.js';

export async function addDashboardPanel(req, res) {
  try {
    const {
      title,
      type,
      sqlQuery,
      displayName,
      gridPos = { x: 0, y: 0, w: 12, h: 8 },
      targets,  // Custom targets
    } = req.body;

    if (!title || !type || (!sqlQuery && !targets)) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const dashboardResponse = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );

    const dashboardMetadata = dashboardResponse.data.meta;
    const actualDashboard = dashboardResponse.data.dashboard;

    let newPanelId = 0;

    //Ensure that actualDashboard.panels is always an array
    actualDashboard.panels = actualDashboard.panels ?? [];

    if (actualDashboard.panels.length > 0) {
      newPanelId =
                Math.max(...actualDashboard.panels.map((panel) => panel.id)) +
                1;
      actualDashboard.panels.forEach((panel) => (panel.gridPos.y += 8));
    }
    const newPanel = createPanelTemplate(type);

    newPanel.id = newPanelId;
    newPanel.title = title;
    newPanel.fieldConfig.defaults.displayName = displayName;
    newPanel.gridPos = gridPos;

    if (targets) {
      newPanel.targets = targets;
    } else {
      const { model, operation, options } = sqlQuery;
      newPanel.targets[0].rawSql = await getSQLFromSequelize(
        models[model],
        operation,
        options
      );
    }

    actualDashboard.panels.push(newPanel);

    actualDashboard.version += 1;
    const response = await methods.dashboard.postDashboard({
      dashboard: actualDashboard,
      message: 'Panel added successfully',
      folderUid: dashboardMetadata.folderUid,
      overwrite: true,
    });

    return res.status(201).json({
      panelId: newPanelId,
      title: newPanel.title,
      type: newPanel.type,
      rawSql: newPanel.targets[0].rawSql,
      displayName: newPanel.fieldConfig.defaults.displayName,
      gridPos: newPanel.gridPos,
      ...response.data,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to add panel to dashboard in Grafana');
  }
}

export async function getPanelsByDashboardUID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );

    const dashboardPanels = response.data.dashboard.panels;

    if (!dashboardPanels || dashboardPanels.length === 0) {
      return res.status(404).json({
        message: 'Panel not found in dashboard.',
      });
    }

    const panels = dashboardPanels.map((panel) => {
      const rawSql = panel.targets?.[0]?.rawSql ?? null;
      const displayName = panel.fieldConfig?.defaults?.displayName ?? null;

      return {
        id: panel.id,
        title: panel.title,
        type: panel.type,
        rawSql: rawSql,
        displayName: displayName,
        gridPos: panel.gridPos,
      };
    });

    return res.status(200).json(panels);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve dashboard panels from Grafana');
  }
}

export async function getPanelQueryByID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(req.params.uid);
    const panels = response?.data?.dashboard?.panels ?? [];

    const panel = panels.find(
      (panel) => panel.id === parseInt(req.params.id, 10)
    );

    if (!panel) {
      return res.status(404).json({
        message: 'Panel not found in dashboard.',
      });
    }

    return res.status(200).json({
      id: panel.id,
      title: panel.title,
      type: panel.type,
      rawSql: panel.targets?.[0]?.rawSql ?? null,
      displayName: panel.fieldConfig?.defaults?.displayName ?? null,
      gridPos: panel.gridPos,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve panel from dashboard in Grafana');
  }
}

export async function getDashboardPanelQueriesByUID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );

    const dashboardPanels = response?.data?.dashboard?.panels ?? [];

    if (dashboardPanels.length === 0) {
      return res.status(404).json({
        message: 'Panel not found in dashboard.',
      });
    }

    const panelQueries = dashboardPanels.map((panel) => {
      const displayName = panel.fieldConfig?.defaults?.displayName ?? null;
      const rawSql = panel.targets?.[0]?.rawSql ?? null;

      return {
        id: panel.id,
        title: panel.title,
        displayName: displayName,
        rawSql: rawSql,
        type: panel.type,
      };
    });

    return res.status(200).json(panelQueries);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve dashboard panel queries from Grafana');
  }
}

export async function deletePanelByID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    const dashboardPanels = response?.data?.dashboard?.panels ?? [];
    if (dashboardPanels.length === 0) {
      return res.status(404).json({
        message: 'No panels found in dashboard',
      });
    }

    const panelIndex = response.data.dashboard.panels.findIndex(
      (panel) => panel.id === parseInt(req.params.id, 10)
    );
    if (panelIndex >= 0) {
      dashboardPanels.splice(panelIndex, 1);
      response.data.dashboard.version += 1;

      const deleteResponse = await methods.dashboard.postDashboard({
        dashboard: response.data.dashboard,
        folderUid: response.data.meta.folderUid,
        overwrite: true,
      });
      return res.status(200).json(deleteResponse.data);
    }
    return res.status(404).json({
      message: 'Panel not found in dashboard.',
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to delete panel in Grafana');
  }
}

export async function updatePanelByID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );

    // Access the dashboard object and its array of panels securely.
    const actualDashboard = response?.data?.dashboard;
    const dashboardPanels = actualDashboard?.panels ?? [];

    const {
      title,
      type,
      sqlQuery,
      table,
      displayName,
      gridPos,
      targets,
    } = req.body;

    if (!actualDashboard || dashboardPanels.length === 0) {
      return res.status(404).json({
        message: 'Dashboard not found or contains no panels.',
      });
    }

    const panelIndex = dashboardPanels.findIndex(
      (panel) => panel.id === parseInt(req.params.id, 10)
    );

    if (panelIndex < 0) {
      return res.status(404).json({
        message: 'Panel not found in dashboard.',
      });
    }

    let panelToUpdate = dashboardPanels[panelIndex];

    if (type !== undefined && type !== panelToUpdate.type) {
      try {
        // Se crea una nueva plantilla base para el nuevo tipo de panel.
        const newPanelTemplate = createPanelTemplate(type);

        newPanelTemplate.id = panelToUpdate.id;

        newPanelTemplate.gridPos = gridPos !== undefined ? gridPos : panelToUpdate.gridPos;
        newPanelTemplate.title = title !== undefined ? title : panelToUpdate.title;

        panelToUpdate = newPanelTemplate;
      } catch (templateError) {
        return res.status(400).json({
          message: templateError.message || `Unsupported or invalid panel type: ${type}`,
        });
      }
    }

    if (title !== undefined && panelToUpdate.title !== title) {
      panelToUpdate.title = title;
    }
    if (gridPos !== undefined && JSON.stringify(panelToUpdate.gridPos) !== JSON.stringify(gridPos)) {
      panelToUpdate.gridPos = gridPos;
    }

    panelToUpdate.fieldConfig = panelToUpdate.fieldConfig || { defaults: {} };
    panelToUpdate.fieldConfig.defaults = panelToUpdate.fieldConfig.defaults || {};
    if (displayName !== undefined && panelToUpdate.fieldConfig.defaults.displayName !== displayName) {
      panelToUpdate.fieldConfig.defaults.displayName = displayName;
    }

    if (targets !== undefined) {
      panelToUpdate.targets = targets;
    } else if (sqlQuery !== undefined) {
      panelToUpdate.targets = panelToUpdate.targets || [{ refId: 'A' }];

      try {
        panelToUpdate.targets[0].rawSql = await getSQLFromSequelize(
          models[sqlQuery.model],
          sqlQuery.operation,
          sqlQuery.options
        );

        if (table !== undefined) {
          panelToUpdate.targets[0].table = table;
        }
      } catch (sqlError) {
        return res.status(400).json({
          message: sqlError.message || 'Error generating SQL query from provided data.',
        });
      }
    }

    dashboardPanels[panelIndex] = panelToUpdate;

    actualDashboard.version += 1;
    const updateResponse = await methods.dashboard.postDashboard({
      dashboard: actualDashboard,
      message: 'Panel updated successfully',
      folderUid: actualDashboard.meta?.folderUid,
      overwrite: true,
    });

    return res.status(200).json(updateResponse.data);

  } catch (error) {
    return handleControllerError(res, error, 'Failed to update panel in Grafana');
  }
}
