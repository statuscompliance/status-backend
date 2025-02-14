import models from '../models/models.js';
import { methods } from '../config/grafana.js';
import { checkRequiredProperties } from '../utils/checkRequiredProperties.js';

export const getControls = async (req, res) => {
  const rows = await models.Control.findAll();
  res.json(rows);
};

export const getControl = async (req, res) => {
  const row = await models.Control.findByPk(req.params.id);

  if (!row)
    return res.status(404).json({
      message: 'Control not found',
    });

  res.status(200).json(row);
};

export const getCatalogControls = async (req, res) => {
  const rows = await models.Control.findAll({
    where: {
      catalogId: req.params.catalogId,
    },
  });

  res.json(rows);
};


export const createControl = async (req, res) => {
  const {
    name,
    description,
    period,
    startDate,
    endDate,
    mashupId,
    catalogId,
    params, // Should include endpoint and threshold at least
  } = req.body;
  const {validation, textError} = checkRequiredProperties( params, ['endpoint', 'threshold']);

  if(!validation){
    res.status(400).json({error: textError});
  }

  const formattedStartDate = startDate ? new Date(startDate) : null;
  const formattedEndDate = endDate ? new Date(endDate) : null;

  const rows = await models.Control.create({
    name,
    description,
    period,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    mashupId,
    catalogId,
    params,
  });

  res.status(201).json({
    id: rows.id,
    name,
    description,
    period,
    formattedStartDate,
    formattedEndDate,
    mashupId,
    catalogId,
  });
};

export const updateControl = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    period,
    startDate,
    endDate,
    mashupId,
    catalogId,
    params,
  } = req.body;
  
  const {validation, textError} = checkRequiredProperties( params, ['endpoint', 'threshold']);

  if(!validation){
    res.status(400).json({error: textError});
  }

  const formattedStartDate = startDate ? new Date(startDate) : null;
  const formattedEndDate = endDate ? new Date(endDate) : null;

  const currentControl = await models.Control.findByPk(id);
  if (!currentControl) {
    return res.status(404).json({ message: 'Control not found' });
  }

  await models.Control.update(
    {
      name,
      description,
      period,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      mashupId,
      catalogId,
      params,
    },
    {
      where: {
        id,
      },
    }
  );

  const row = await models.Control.findByPk(id);
  res.status(200).json(row);
};

export const deleteControl = async (req, res) => {
  const result = await models.Control.destroy({
    where: {
      id: req.params.id,
    },
  });

  if (result <= 0)
    return res.status(404).json({
      message: 'Control not found',
    });

  res.status(204);
};

export async function addPanelToControl(req, res) {
  const { id, panelId } = req.params;

  const { dashboardUid } = req.body;

  try {
    const panel = await models.Panel.create({
      id: panelId,
      controlId: id,
      dashboardUid: dashboardUid,
    });
    res.status(201).json({
      message: 'Panel added to control',
      data: panel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: 'Error adding panel to control',
      error: error.message,
    });
  }
}

export async function getPanelsByControlId(req, res) {
  const { id } = req.params;

  try {
    const panels = await models.Panel.findAll({
      where: {
        controlId: id,
      },
    });
    let panelsDTO = [];

    // THIS MUST BE CACHED AND REFACTORED
    for (let panel of panels) {
      panel = panel.dataValues;
      let panelDTO = {};
      if (Object.prototype.hasOwnProperty.call(panel, 'dashboardUid')) {
        const dashboardUid = panel.dashboardUid;
        const dashboardResponse =
                    await methods.dashboard.getDashboardByUID(dashboardUid);
        const actualDashboard = dashboardResponse.data.dashboard;
        const panelElement = actualDashboard.panels.find(
          (e) => e.id == panel.id
        );
        panelDTO = {
          ...panel,
          title: panelElement.title,
          type: panelElement.type,
          sqlQuery: panelElement.targets[0].rawSql,
          table: panelElement.targets[0].table,
          displayName: panelElement.targets[0].alias,
          gridPos: panelElement.gridPos,
        };
        panelsDTO.push(panelDTO);
      }
    }
    res.status(200).json(panelsDTO);
  } catch (error) {
    if (error.response) {
      const { status, statusText } = error.response;
      return res.status(status).json({
        message: statusText,
        error: error,
      });
    } else {
      return res.status(500).json({
        message:
                    'Failed to get panels from control, error in Grafana API',
        error: error.message,
      });
    }
  }
}

export async function deletePanelFromControl(req, res) {
  const { id, panelId } = req.params;

  try {
    await models.Panel.destroy({
      where: {
        controlId: id,
        id: panelId,
      },
    });
    res.status(204).json({
      message: 'Panel deleted from control',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting panel from control',
      error: error.message,
    });
  }
}
