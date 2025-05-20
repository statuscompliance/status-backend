import { models } from '../models/models.js';
import { validate as uuidValidate } from 'uuid';
import { handleControllerError } from '../utils/errorHandler.js';

export const getPoints = async (req, res) => {
  try {
    const points = await models.Point.findAll();
    res.status(200).json(points);
  } catch (error) {
    return handleControllerError(res, error, 'An error occurred while retrieving the points.');
  }
};

export const getPointById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !uuidValidate(id)) {
      res.status(400).json({ message: 'Invalid point id'});
      return;
    }
    const point = await models.Point.findByPk(id);
    if (!point) {
      res.status(404).json({ message: `Point with id ${id} not found` });
      return;
    }
    res.status(200).json(point);
  } catch (error) {
    return handleControllerError(res, error, 'An error occurred while retrieving the point.');
  }
};

export const deletePointById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !uuidValidate(id)) {
      res.status(400).json({ message: 'Invalid point id'});
      return;
    }
    const deletedRows = await models.Point.destroy({ where: { id } });
    if (deletedRows === 0) {
      res.status(404).json({ message: `Point with id ${id} not found` });
      return;
    }
    res.status(204).end();
  } catch (error) {
    return handleControllerError(res, error, 'An error occurred while deleting the point.');
  }
}

export const getPointsByAgreementId = async (req, res) => {
  try {
    const agreementId = req.params.tpaId;
    if(!agreementId) {
      res.status(400).json({ message: 'Missing agreement id' });
      return;
    }
    const points = await models.Point.findAll({ where: { agreementId } });
    res.status(200).json(points);
  } catch (error) {
    return handleControllerError(res, error, 'An error occurred while retrieving the points for this agreement.');
  }
}

export const deleteAllPoints = async (req, res) => {
  try {
    await models.Point.destroy({ where: {} });
    res.status(204).end();
  } catch (error) {
    return handleControllerError(res, error, 'An error occurred while deleting all points.');
  }
};

export const updatePointByComputationGroup = async (req, res) => {
  try {
    const { computationGroup } = req.params;
    const updateData = req.body;
    
    if (!computationGroup || !uuidValidate(computationGroup)) {
      return res.status(400).json({ message: 'Invalid computation group id' });
    }
    
    const points = await models.Point.findAll({
      where: { computationGroup }
    });
    
    if (points.length === 0) {
      return res.status(404).json({ 
        message: `No points found with computation group ${computationGroup}` 
      });
    }
    
    await models.Point.update(
      updateData,
      { where: { computationGroup } }
    );
    
    const updatedPoints = await models.Point.findAll({
      where: { computationGroup }
    });
    
    return res.status(200).json({
      message: 'Points updated successfully',
      points: updatedPoints
    });
  } catch (error) {
    return handleControllerError(res, error, 'An error occurred while updating the points.');
  }
};
