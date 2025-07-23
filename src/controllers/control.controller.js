import { models } from '../models/models.js';
import { checkRequiredProperties } from '../utils/checkRequiredProperties.js';
import { mapPanelsToDTO } from '../utils/panelUtils.js';
import { buildWhereClause } from '../utils/buildWhereClause.js';
import { handleControllerError } from '../utils/errorHandler.js';
import { Op } from 'sequelize';

const validFilters = {
  status: ['draft', 'finalized'],
};

// Function to check if a model instance exists by ID
export async function getModelById(res, model, id, { name = 'Resource' } = {}) {
  const entity = await model.findByPk(id);
  if (!entity) {
    res.status(404).json({ message: `${name} with ID ${id} not found.` });
    return null;
  }
  return entity;
}

export const getControls = async (req, res) => {
  try {
    const whereClause = buildWhereClause(req.query, validFilters);
    const controls = await models.Control.findAll({ where: whereClause });
    res.status(200).json(controls);
  } catch (error) {
    if (error.message.startsWith('Invalid value for')) {
      return res.status(400).json({ error: error.message });
    }
    handleControllerError(res, error, 'Failed to retrieve controls');
  }
};

export const getControl = async (req, res) => {
  try {
    const { id } = req.params;

    const control = await getModelById(res, models.Control, id, {
      name: 'Control',
    });
    if (!control) return; // aborts early with 404

    res.status(200).json(control);
  } catch (error) {
    handleControllerError(res, error, 'Failed to retrieve control');
  }
};

export const getCatalogControls = async (req, res) => {
  try {
    const { catalogId } = req.params;
    const query = { ...req.query, catalogId };
    const whereClause = buildWhereClause(query, validFilters);
    const controls = await models.Control.findAll({ where: whereClause });

    res.status(200).json(controls);
  } catch (error) {
    if (error.message.startsWith('Invalid value for')) {
      return res.status(400).json({ error: error.message });
    }
    handleControllerError(res, error, 'Failed to retrieve catalog controls');
  }
};

export const createControl = async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      period,
      startDate,
      endDate,
      mashupId,
      catalogId,
      params, // Should include endpoint and threshold at least
    } = req.body;

    const { validation, textError } = checkRequiredProperties(params, [
      'endpoint',
      'threshold',
    ]);

    if (!validation) {
      return res
        .status(400)
        .json({ error: `Invalid parameters: ${textError}` });
    }

    let formattedStartDate = null;
    if (startDate) {
      formattedStartDate = new Date(startDate);
      if (isNaN(formattedStartDate.getTime())) {
        return res.status(400).json({ error: 'Invalid startDate format' });
      }
    }
    const formattedEndDate = endDate ? new Date(endDate) : null;

    const newControl = await models.Control.create({
      id,
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
    res.status(201).json(newControl);
  } catch (error) {
    console.error('Error creating control:', error);
    handleControllerError(res, error, 'Failed to create control');
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
    lastComputed,
  } = req.body;

  try {
    const currentControl = await getModelById(res, models.Control, id, {
      name: 'Control',
    });
    if (!currentControl) return; // aborts early with 404

    if (currentControl.status === 'finalized' && status === 'draft') {
      return res.status(400).json({
        message: 'Cannot change status from finalized to draft',
      });
    }

    if (
      status === 'finalized' ||
      (!status && currentControl.status === 'finalized')
    ) {
      const { validation, textError } = checkRequiredProperties(
        params || currentControl.params,
        ['endpoint', 'threshold']
      );
      if (!validation) {
        return res.status(400).json({
          error: `Invalid parameters for finalized control: ${textError}`,
        });
      }
    }

    const formattedStartDate = startDate
      ? new Date(startDate)
      : currentControl.startDate;
    const formattedEndDate = endDate
      ? new Date(endDate)
      : currentControl.endDate;

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
        lastComputed,
      },
      {
        where: {
          id,
        },
      }
    );

    const control = await models.Control.findByPk(id);
    res.status(200).json(control);
  } catch (error) {
    handleControllerError(res, error, 'Failed to update control');
  }
};

export const deleteControl = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await models.Control.destroy({
      where: { id },
    });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `Control with ID ${id} not found.` });
    }

    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete control');
  }
};

export async function addPanelToControl(req, res) {
  const { id, panelId } = req.params;
  const { dashboardUid } = req.body;

  try {
    const control = await getModelById(res, models.Control, id, {
      name: 'Control',
    });
    if (!control) return; // aborts early with 404

    const panel = await models.Panel.create({
      id: panelId,
      controlId: id,
      dashboardUid: dashboardUid,
    });
    res.status(201).json({
      message: 'Panel added to control successfully',
      data: panel,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to add panel to control');
  }
}

export async function getPanelsByControlId(req, res) {
  const { id } = req.params;

  try {
    // Verify control exists
    const control = await getModelById(res, models.Control, id, {
      name: 'Control',
    });
    if (!control) return; // aborts early with 404
    // Fetch associated panels
    const panels = await models.Panel.findAll({
      where: {
        controlId: id,
      },
    });
    // Map to enriched DTOs
    const panelsDTO = await mapPanelsToDTO(panels);

    res.status(200).json(panelsDTO);
  } catch (error) {
    const message = 'Failed to get panels from control, error in Grafana API';
    const status = (error.response && error.response.status) || 500;
    return res.status(status).json({ message, error: error.message });
  }
}

export async function deletePanelFromControl(req, res) {
  const { id, panelId } = req.params;

  try {
    const deletedCount = await models.Panel.destroy({
      where: {
        controlId: id,
        id: panelId,
      },
    });
    if (deletedCount === 0) {
      return res.status(404).json({
        message: `Panel with ID ${panelId} not found for control ID ${id}.`,
      });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete panel from control');
  }
}

// Draft controls

export const createDraftControl = async (req, res) => {
  const {
    id,
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
      error: 'Missing required fields for draft control: name and catalogId',
    });
  }

  const { validation, textError } = checkRequiredProperties(params, [
    'endpoint',
    'threshold',
  ]);
  if (!validation) {
    return res.status(400).json({ error: textError });
  }

  try {
    // Check if catalog exists
    const catalog = await getModelById(res, models.Catalog, catalogId, {
      name: 'Catalog',
    });
    if (!catalog) return; // aborts early with 404

    // Check if catalog is a draft
    if (catalog.status !== 'draft') {
      return res.status(400).json({
        error: 'Draft controls can only be added to draft catalogs',
      });
    }

    const newControl = await models.Control.create({
      id,
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

    res.status(201).json(newControl);
  } catch (error) {
    handleControllerError(res, error, 'Failed to create draft control');
  }
};

export const finalizeControl = async (req, res) => {
  try {
    const { id } = req.params;

    const currentControl = await getModelById(res, models.Control, id, {
      name: 'Control',
    });
    if (!currentControl) return; // aborts early with 404

    if (currentControl.status !== 'draft') {
      return res
        .status(400)
        .json({ message: 'Only draft controls can be finalized' });
    }

    // Check if associated catalog is finalized
    const catalog = await getModelById(
      res,
      models.Catalog,
      currentControl.catalogId,
      { name: 'Associated catalog' }
    );
    if (!catalog) return; // aborts early with 404

    if (catalog.status !== 'finalized') {
      return res.status(400).json({
        message: 'Cannot finalize a control that belongs to a draft catalog',
      });
    }

    // Check required properties for finalized controls
    const { validation, textError } = checkRequiredProperties(
      currentControl.params,
      ['endpoint', 'threshold']
    );

    if (!validation) {
      return res.status(400).json({
        error: `Cannot finalize control: ${textError}`,
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
    handleControllerError(res, error, 'Failed to finalize control');
  }
};

// Method to finalize all draft controls in a catalog
export const finalizeControlsByCatalogId = async (catalogId) => {
  try {
    // Get draft controls
    const draftControls = await models.Control.findAll({
      where: {
        catalogId,
        status: 'draft',
      },
    });

    // Update valid controls to finalized
    let updatedControls = {};
    if (draftControls.length > 0) {
      updatedControls = await models.Control.update(
        { status: 'finalized' },
        {
          where: {
            id: draftControls.map((control) => control.id),
          },
        }
      );
    }

    return updatedControls;
  } catch (error) {
    console.error(
      `Error finalizing controls for catalog ID ${catalogId}:`,
      error
    );
    throw error;
  }
};

export const getPendingControls = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // format 'YYYY-MM-DD'

    const controls = await models.Control.findAll({
      where: {
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
        [Op.or]: [
          { lastComputed: null },
          { lastComputed: { [Op.lt]: today } }
        ],
        status: 'finalized',
      },
    });

    res.status(200).json(controls);
  } catch (error) {
    handleControllerError(res, error, 'Failed to get pending controls');
  }
};
