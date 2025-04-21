import { models } from '../models/models.js';
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
  try {
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
    
    const {validation, textError} = checkRequiredProperties(params, ['endpoint', 'threshold']);

    if(!validation) {
      return res.status(400).json({error: textError});
    }
    
    let formattedStartDate = null;
    if (startDate) {
      formattedStartDate = new Date(startDate);
      if (isNaN(formattedStartDate.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate' });
      }
    }
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
      status: 'finalized',
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
  } catch (error) {
    console.error('Error creating control:', error);
    res.status(500).json({
      message: 'Error creating control',
      error: error.message,
    });
  }
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
    status,
  } = req.body;
  
  try {
    const currentControl = await models.Control.findByPk(id);
    if (!currentControl) {
      return res.status(404).json({ message: 'Control not found' });
    }
    
    // No se permite cambiar un control finalizado a borrador
    if (currentControl.status === 'finalized' && status === 'draft') {
      return res.status(400).json({ 
        message: 'Cannot change status from finalized to draft' 
      });
    }
    
    // Si es un control finalizado, validar los params
    if (status === 'finalized' || (!status && currentControl.status === 'finalized')) {
      const {validation, textError} = checkRequiredProperties(params || currentControl.params, ['endpoint', 'threshold']);
      if (!validation) {
        return res.status(400).json({error: textError});
      }
    }
    
    const formattedStartDate = startDate ? new Date(startDate) : currentControl.startDate;
    const formattedEndDate = endDate ? new Date(endDate) : currentControl.endDate;

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
        status,
      },
      {
        where: {
          id,
        },
      }
    );

    const row = await models.Control.findByPk(id);
    res.status(200).json(row);
  } catch (error) {
    res.status(500).json({ 
      message: `Failed to update control, error: ${error.message}` 
    });
  }
};

export const deleteControl = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await models.Control.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Control not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting control:', error);
    return res.status(500).json({
      message: 'Error deleting control',
      error: error.message,
    });
  }
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

// Draft controls

export const getDraftControls = async (req, res) => {
  try {
    const controls = await models.Control.findAll({
      where: {
        status: 'draft'
      }
    });
    res.status(200).json(controls);
  } catch (error) {
    res.status(500).json({ 
      message: `Failed to retrieve draft controls, error: ${error.message}` 
    });
  }
};

export const getDraftControlsByCatalogId = async (req, res) => {
  try {
    const { catalogId } = req.params;
    
    // Check if catalog exists
    const catalog = await models.Catalog.findByPk(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }
    
    const controls = await models.Control.findAll({
      where: {
        catalogId,
        status: 'draft'
      }
    });
    
    res.status(200).json(controls);
  } catch (error) {
    res.status(500).json({ 
      message: `Failed to retrieve draft controls, error: ${error.message}` 
    });
  }
};

export const createDraftControl = async (req, res) => {
  const {
    name,
    description,
    startDate,
    endDate,
    period,
    mashupId,
    catalogId,
    params,
  } = req.body;
  
  if (!name || !catalogId) {
    return res.status(400).json({
      error: 'Missing required fields for draft control: name and catalogId'
    });
  }
  
  try {
    // Check if catalog exists
    const catalog = await models.Catalog.findByPk(catalogId);
    if (!catalog) {
      return res.status(404).json({ error: 'Catalog not found' });
    }
    
    // Check if catalog is a draft
    if (catalog.status !== 'draft') {
      return res.status(400).json({
        error: 'Draft controls can only be added to draft catalogs'
      });
    }
    
    const rows = await models.Control.create({
      name,
      description: description || '',
      period: period || 'MONTHLY',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      mashupId: mashupId || '',
      catalogId,
      params: params || {},
      status: 'draft',
    });
    
    res.status(201).json(rows);
  } catch (error) {
    res.status(500).json({
      message: `Failed to create draft control, error: ${error.message}`
    });
  }
};

export const finalizeControl = async (req, res) => {
  try {
    const { id } = req.params;
    
    const currentControl = await models.Control.findByPk(id);
    if (!currentControl) {
      return res.status(404).json({ message: 'Control not found' });
    }
    
    if (currentControl.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft controls can be finalized' });
    }
    
    // Check if associated catalog is finalized
    const catalog = await models.Catalog.findByPk(currentControl.catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Associated catalog not found' });
    }
    
    if (catalog.status !== 'finalized') {
      return res.status(400).json({ 
        message: 'Cannot finalize a control that belongs to a draft catalog' 
      });
    }
    
    // Check required properties for finalized controls
    const {validation, textError} = checkRequiredProperties(
      currentControl.params, 
      ['endpoint', 'threshold']
    );
    
    if (!validation) {
      return res.status(400).json({
        error: `Cannot finalize control: ${textError}`
      });
    }
    
    const updatedControl = await models.Control.update(
      {
        status: 'finalized',
      },
      {
        where: {
          id,
        },
        returning: true,
      }
    );
    
    res.status(200).json(updatedControl[1][0]);
  } catch (error) {
    res.status(500).json({ 
      message: `Failed to finalize control, error: ${error.message}` 
    });
  }
};

// Method to finalize all draft controls in a catalog
export const finalizeControlsByCatalogId = async (catalogId) => {
  try {
    // Get draft controls
    const draftControls = await models.Control.findAll({
      where: {
        catalogId,
        status: 'draft'
      }
    });
    
    // Update valid controls to finalized
    let updatedControls = {};
    if (draftControls.length > 0) {
      updatedControls = await models.Control.update(
        { status: 'finalized' },
        {
          where: {
            id: draftControls.map(control => control.id)
          }
        }
      );
    }
    
    return updatedControls;
  } catch (error) {
    console.error('Error finalizing controls:', error);
    throw error;
  }
};
