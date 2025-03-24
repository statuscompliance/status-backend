import models from '../models/models.js';
import { storeGuaranteePoints } from '../utils/storeGuaranteePoints.js';
import registry from '../config/registry.js';
import { agreementBuilder } from '../utils/agreementBuilder.js';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import { finalizeControlsByCatalogId } from './control.controller.js';

export const getCatalogs = async (req, res) => {
  try {
    const catalogs = await models.Catalog.findAll();
    res.status(200).json(catalogs);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve catalogs, error: ${error.message}` });
  }
};

export const getCatalog = async (req, res) => {
  try {
    const row = await models.Catalog.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    res.status(200).json(row);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve catalog, error: ${error.message}` });
  }
};

export const createCatalog = async (req, res) => {
  try {
    const { name, description, startDate, endDate, dashboard_id, status } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required fields: name, startDate, and/or endDate' });
    }
    const tpaId = status === 'draft' ? null : `tpa-${uuidv4()}`;
    const rows = await models.Catalog.create({
      name,
      description,
      startDate,
      endDate,
      dashboard_id,
      tpaId,
      status: status || 'finalized',
    });
    res.status(201).json(rows);
  } catch (error) {
    res.status(500).json({ message: `Failed to create catalog, error: ${error.message}` });
  }
};

export const updateCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, dashboard_id, tpaId, status } = req.body;

    const currentCatalog = await models.Catalog.findByPk(id);
    if (!currentCatalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    // Prevent changing status from finalized to draft
    if (currentCatalog.status === 'finalized' && status === 'draft') {
      return res.status(400).json({ message: 'Cannot change status from finalized to draft' });
    }

    const updatedCatalog = await models.Catalog.update(
      {
        name,
        description,
        startDate,
        endDate,
        dashboard_id,
        tpaId,
        status,
      },
      {
        where: {
          id,
        },
        returning: true,
        plain: true,
      }
    );
    res.status(200).json(updatedCatalog[1]); // The first element is the number of affectedRows
  } catch (error) {
    res.status(500).json({ message: `Failed to update catalog, error: ${error.message}` });
  }
};

export const deleteCatalog = async (req, res) => {
  const result = await models.Catalog.destroy({
    where: {
      id: req.params.id,
    },
  });

  if (result <= 0)
    return res.status(404).json({
      message: 'Catalog not found',
    });

  res.sendStatus(204);
};

export async function calculatePoints(req, res) {
  try {
    const agreementId = req.params.tpaId;
    const { from, to } = req.query;

    const catalog = await models.Catalog.findOne({ where: {tpaId: agreementId}});
    const controls = await models.Control.findAll({where: {catalogId: catalog.id}});

    await updateOrCreateAgreement(catalog, controls, agreementId);
    
    const guaranteesStates = await registry.get(`api/v6/states/${agreementId}/guarantees`, {
      params: { from, to, newPeriodsFromGuarantees: false },
      headers: { 'x-access-token': req.cookies.accessToken }
    });
    const { storedPoints, error } = await storeGuaranteePoints(guaranteesStates.data, agreementId);
    if (error.length > 0) {
      const points = await models.Point.findAll({where: {agreementId}});
      if (points.length > 0) {
        res.status(200).json(points);
      } else {
        res.status(400).json(error);
      }
    } else {
      res.status(200).json(storedPoints);
    }
  } catch (error) {
    res.status(500).json({
      message: `Failed to get points, error: ${error.message}`,
    });
  }
}

async function updateOrCreateAgreement(catalog, controls, agreementId) {
  const agreement = await agreementBuilder(catalog, controls, { id: agreementId });
  try {
    const response = await registry.get(`api/v6/agreements/${agreementId}`);
    const oldAgreement = response.data;

    if (!_.isEqual(agreement, oldAgreement)) {
      console.log(`Updating agreement ${agreementId}`);
      await registry.put(`api/v6/agreements/${agreementId}`, agreement);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`Creating agreement ${agreementId}`);
      await registry.post('api/v6/agreements', agreement);
    } else {
      throw error; // Rethrow other errors
    }
  }
}

// Draft Catalogs

export const getDraftCatalogs = async (req, res) => {
  try {
    const catalogs = await models.Catalog.findAll({
      where: {
        status: 'draft'
      }
    });
    res.status(200).json(catalogs);
  } catch (error) {
    res.status(500).json({ message: `Failed to retrieve draft catalogs, error: ${error.message}` });
  }
};

export const createDraftCatalog = async (req, res) => {
  try {
    const { name, description, startDate, endDate, dashboard_id } = req.body;
    if (!name || !startDate) {
      return res.status(400).json({ message: 'Missing required fields: name and/or startDate' });
    }
    
    const rows = await models.Catalog.create({
      name,
      description,
      startDate: startDate,
      endDate,
      dashboard_id,
      tpaId: null,
      status: 'draft',
    });
    res.status(201).json(rows);
  } catch (error) {
    res.status(500).json({ message: `Failed to create draft catalog, error: ${error.message}` });
  }
};

export const finalizeCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const currentCatalog = await models.Catalog.findByPk(id);
    if (!currentCatalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }
    
    if (currentCatalog.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft catalogs can be finalized' });
    }
    
    if (!currentCatalog.startDate || !currentCatalog.endDate) {
      return res.status(400).json({ message: 'Catalog must have startDate and endDate to be finalized' });
    }
    
    const tpaId = `tpa-${uuidv4()}`;
    
    // First we update the catalog status and TPA ID
    const updatedCatalog = await models.Catalog.update(
      {
        status: 'finalized',
        tpaId,
      },
      {
        where: {
          id,
        },
        returning: true,
        plain: true,
      }
    );
    
    // Then we finalize the controls
    const controlsResult = await finalizeControlsByCatalogId(id);
    
    // Return the updated catalog and the number of finalized controls
    res.status(200).json({
      catalog: updatedCatalog[1],
      controls: {
        finalized: controlsResult.updated.length,
      }
    });
  } catch (error) {
    res.status(500).json({ message: `Failed to finalize catalog, error: ${error.message}` });
  }
};