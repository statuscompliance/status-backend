import models from '../models/models.js';
import { validate as uuidValidate } from 'uuid';

export const getPoints = async (req, res) => {
  try {
    const points = await models.Point.findAll();
    res.status(200).json(points);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get points, error: ${error.message}`,
    });
  }
};

export const getPointById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !uuidValidate(id)) {
      res.status(400).json({ message: 'Missing point id' });
      return;
    }
    const point = await models.Point.findByPk(id);
    res.status(200).json(point);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get point, error: ${error.message}`,
    });
  }
};

export const deletePointById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !uuidValidate(id)) {
      res.status(400).json({ message: 'Missing point id' });
      return;
    }
    await models.Point.destroy({ where: { id } });
    res.status(204).end();;
  } catch (error) {
    res.status(500).json({
      message: `Failed to delete point, error: ${error.message}`,
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
    res.status(500).json({
      message: `Failed to get points, error: ${error.message}`,
    });
  }
};

export const deleteAllPoints = async (req, res) => {
  try {
    await models.Point.destroy({ where: {} });
    res.status(204).end();;
  } catch (error) {
    res.status(500).json({
      message: `Failed to delete all points, error: ${error.message}`,
    });
  }
};
