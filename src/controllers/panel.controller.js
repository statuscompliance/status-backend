import { methods } from '../config/grafana.js';
import { models } from '../models/models.js';
import createPanelTemplate from '../utils/panelStructures.js';
import { getSQLFromSequelize } from '../utils/sqlQueryBuilder.js';

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

    const dashboardResponse = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );

    const dashboardMetadata = dashboardResponse.data.meta;
    const actualDashboard = dashboardResponse.data.dashboard;
    let newPanelId = 0;
    if (actualDashboard.panels && actualDashboard.panels.length > 0) {
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
    // Si se proporciona targets personalizado, usarlo en lugar del predeterminado
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
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to add panel to dashboard in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function getPanelsByDashboardUID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    if (response.data.dashboard.panels.length > 0) {
      const panels = response.data.dashboard.panels.map((panel) => {
        return {
          id: panel.id,
          title: panel.title,
          type: panel.type,
          rawSql: panel.targets[0].rawSql,
          displayName: panel.fieldConfig.defaults.displayName,
          gridPos: panel.gridPos,
        };
      });
      return res.status(200).json(panels);
    }
    return res.status(404).json({
      message: 'No panels found in dashboard',
    });
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve dashboard in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function getPanelQueryByID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    if (response.data.dashboard.panels.length > 0) {
      const panel = response.data.dashboard.panels.find(
        (panel) => panel.id === parseInt(req.params.id, 10)
      );
      return res.status(200).json({
        id: panel.id,
        title: panel.title,
        type: panel.type,
        rawSql: panel.targets[0].rawSql,
        displayName: panel.fieldConfig.defaults.displayName,
        gridPos: panel.gridPos,
      });
    }
    return res.status(404).json({
      message: 'Panel not found in dashboard',
    });
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve dashboard in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function getDashboardPanelQueriesByUID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    if (response.data.dashboard.panels.length > 0) {
      const panelQueries = response.data.dashboard.panels.map((panel) => {
        return {
          id: panel.id,
          title: panel.title,
          displayName: panel.fieldConfig.defaults.displayName,
          rawSql: panel.targets[0].rawSql,
          type: panel.type,
        };
      });
      return res.status(200).json(panelQueries);
    }
    return res.status(404).json({
      message: 'No panels found in dashboard',
    });
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve dashboard in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function deletePanelByID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    if (response.data.dashboard.panels.length > 0) {
      const panelIndex = response.data.dashboard.panels.findIndex(
        (panel) => panel.id === parseInt(req.params.id, 10)
      );
      if (panelIndex >= 0) {
        response.data.dashboard.panels.splice(panelIndex, 1);
        response.data.dashboard.version += 1;
        const deleteResponse = await methods.dashboard.postDashboard({
          dashboard: response.data.dashboard,
          folderUid: response.data.meta.folderUid,
          overwrite: true,
        });
        return res.status(200).json(deleteResponse.data);
      }
      return res.status(404).json({
        message: 'Panel not found in dashboard',
      });
    }
    return res.status(404).json({
      message: 'No panels found in dashboard',
    });
  } catch (error) {
    if (error.response) {
      const { status, statusText, data } = error.response;
      return res.status(status).json({
        message: `Failed to delete panel in Grafana: ${statusText}`,
        error: data.message || error.message,
      });
    } else {
      return res.status(500).json({
        message:
                    'Failed to delete panel in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function updatePanelByID(req, res) {
  try {
    const response = await methods.dashboard.getDashboardByUID(
      req.params.uid
    );
    const {
      title,
      type,
      sqlQuery,
      table,
      displayName,
      gridPos = { x: 0, y: 0, w: 12, h: 8 },
      //TODO: Add support for updating targets
    } = req.body;

    if (response.data.dashboard.panels.length > 0) {
      const panelIndex = response.data.dashboard.panels.findIndex(
        (panel) => panel.id === parseInt(req.params.id, 10)
      );
      if (panelIndex >= 0) {
        const panel = response.data.dashboard.panels[panelIndex];
        try {
          const updatedPanel =
            type === undefined
              ? createPanelTemplate(panel.type)
              : createPanelTemplate(type);
              
          updatedPanel.id = parseInt(req.params.id, 10);
          updatedPanel.title = title === undefined ? panel.title : title;
          updatedPanel.fieldConfig.defaults.displayName =
            displayName === undefined
              ? panel.fieldConfig.defaults.displayName
              : displayName;
          updatedPanel.gridPos =
            gridPos === undefined ? panel.gridPos : gridPos;
          if (updatedPanel.targets && updatedPanel.targets.length > 0) {
            const { model, operation, options } = sqlQuery;
            updatedPanel.targets[0].rawSql =
              sqlQuery === undefined
                ? panel.targets[0].rawSql
                : await getSQLFromSequelize(
                  models[model],
                  operation,
                  options
                );
            updatedPanel.targets[0].table =
              table === undefined ? panel.targets[0].table : 'Points';
          }
          response.data.dashboard.panels[panelIndex] = updatedPanel;
        } catch (error) {
          return res.status(400).json({
            message: error.message || `Unsupported panel type: ${type || panel.type}`,
          });
        }
        
        response.data.dashboard.version += 1;
        const updateResponse = await methods.dashboard.postDashboard({
          dashboard: response.data.dashboard,
          folderUid: response.data.meta.folderUid,
          overwrite: true,
        });
        return res.status(200).json(updateResponse.data);
      }
      return res.status(404).json({
        message: 'Panel not found in dashboard',
      });
    }
    return res.status(404).json({
      message: 'No panels found in dashboard',
    });
  } catch (error) {
    if (error.response) {
      const { status, statusText, data } = error.response;
      return res.status(status).json({
        message: `Failed to update panel in Grafana: ${statusText}`,
        error: data.message || error.message,
      });
    } else {
      return res.status(500).json({
        message:
                    'Failed to update panel in Grafana due to server error',
        error: error.message,
      });
    }
  }
}
