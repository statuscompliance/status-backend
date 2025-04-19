import { models } from '../models/models.js';
import { validate as uuidValidate } from 'uuid';

export const getPoints = async (req, res) => {
  try {
    const points = await models.Point.findAll();
    res.status(200).json(points);
  } catch (error) {
    console.error('Error getting points:', error);
    res.status(500).json({
      message: 'An error occurred while retrieving the points.',
    });
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
    console.error(`Error getting point by id ${req.params.id}:`, error);
    res.status(500).json({
      message: 'An error occurred while retrieving the point.',
    });
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
    res.status(204).end();;
  } catch (error) {
    console.error(`Error deleting point by id ${req.params.id}:`, error);
    res.status(500).json({
      message: 'An error occurred while deleting the point.',
    });
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
    console.error(`Error getting points by agreement id ${req.params.tpaId}:`, error);
    res.status(500).json({
      message: 'An error occurred while retrieving the points for this agreement.',
    });
  }
}

export const deleteAllPoints = async (req, res) => {
  try {
    await models.Point.destroy({ where: {} });
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting all points:', error);
    res.status(500).json({
      message: 'An error occurred while deleting all points.',
    });
  }
};
