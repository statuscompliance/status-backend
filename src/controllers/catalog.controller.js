import models from '../../db/models.js';
import { storeGuaranteePoints } from '../utils/storeGuaranteePoints.js';
import registry from '../config/registry.js';
import { createAgreement } from '../utils/agreementTranslator.js';

export const getCatalogs = async (req, res) => {
  const catalogs = await models.Catalog.findAll();
  res.json(catalogs);
};

export const getCatalog = async (req, res) => {
  const row = await models.Catalog.findByPk(req.params.id);

  if (!row)
    return res.status(404).json({
      message: 'Catalog not found',
    });

  res.json(row);
};

export const createCatalog = async (req, res) => {
  const { name, startDate, endDate, dashboard_id } = req.body;
  const rows = await models.Catalog.create({
    name,
    startDate,
    endDate,
    dashboard_id,
  });
  res.send({
    id: rows.id,
    name,
    startDate,
    endDate,
    dashboard_id,
  });
};

export const updateCatalog = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, dashboard_id, tpaId } = req.body;

    const currentCatalog = await models.Catalog.findByPk(id);
    if (!currentCatalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    const updatedCatalog = await models.Catalog.update(
      {
        name,
        startDate,
        endDate,
        dashboard_id,
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
    //In this point, the catalog should be translated to agreement

    const catalog = await models.Catalog.findOne({ where: {tpaId: agreementId}});
    //Get controls by catalogId
    const controls = await models.Control.findAll({where: {catalogId: catalog.id}});

    const agreement = createAgreement(catalog, controls,{}, {}); // Update the Agreement or Create it ?
    
    console.log('Agreement \n', JSON.stringify(agreement, null, 2));
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