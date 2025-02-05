import models from '../../db/models.js';
import { Op } from 'sequelize';
import { checkRequiredProperties } from '../middleware/validation.js';
import nodered from '../config/nodered.js';
import { v4 as uuidv4 } from 'uuid';
import redis from '../config/redis.js';

export async function getComputations(req, res) {
  try {
    const computations = await models.Computation.findAll();
    res.status(200).json(computations);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get computations, error: ${error.message}`,
    });
  }
}

export async function getComputationsById(req, res) {
  try {
    const { id } = req.params;
    const computations = await models.Computation.findAll({ where: { computationGroup: id } });
    const ready = await redis.get(id);
    if (ready === 'true' && computations.length > 0) {
      res.status(200).json({
        code: 200,
        message: 'OK',
        computations: computations
      });
    } else if (ready === 'false' && computations.length > 0) {
      res.status(202).json({ message: 'Not ready yet' });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({
      message: `Failed to get computation, error: ${error.message}`,
    });
  }
}

export async function getComputationsByControlId(req, res) {
  try {
    const { control_id } = req.params;
    const computations = await models.Computation.findAll({
      where: { control_id },
    });
    res.status(200).json(computations);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get computations, error: ${error.message}`,
    });
  }
}

export async function getComputationsByControlIdAndCreationDate(req, res) {
  try {
    const { control_id, createdAt } = req.params;

    const startOfDay = new Date(createdAt);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(createdAt);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const computations = await models.Computation.findAll({
      where: {
        control_id,
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    res.status(200).json(computations);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get computations, error: ${error.message}`,
    });
  }
}

// TODO: Update this endpoint to handle period from to instead of start_compute and end_compute

export async function setComputeIntervalBytControlIdAndCreationDate(req, res) {
  try {
    const { start_compute, end_compute } = req.body;
    const { control_id, createdAt } = req.params;

    const computation = await models.Computation.update(
      { start_compute, end_compute },
      { where: { control_id, createdAt } }
    );
    res.status(204).json(computation);
  } catch (error) {
    res.status(500).json({
      message: `Failed to update computation, error: ${error.message}`,
    });
  }
}

export async function createComputation(req, res) {
  try {
    const { metric, config } = req.body;
    const {validation, textError} = checkRequiredProperties(metric, ['endpoint', 'params']);
    if(!validation){
      res.status(400).json({error: textError});
    }
    const endpoint = `/api/v1${metric.endpoint}`;
    const computationId = uuidv4();
    const params = {
      computationGroup: computationId,
      backendUrl: config.backendUrl,
      ...metric.params
    };
    const headers = {
      'x-access-token': req.cookies.accessToken
    };
    const response = await nodered.post(endpoint, params, { headers });
    if (response.status !== 200) {
      res.status(400).json({ message: 'Something went wrong when calling Node-RED' });
    }
    res.status(201).json({
      code: 201,
      message: 'OK',
      computation: '/api/v1/computation/' + computationId
    });
  } catch (error) {
    res.status(500).json({
      message: `Failed to create computation, error: ${error.message}`,
    });
  }
}

export async function bulkCreateComputations(req, res) {
  try {
    const { computations , done} = req.body;
    if (!Array.isArray(computations) || computations.length === 0) {
      return res.status(400).json({ error: 'Invalid computations' });
    }
    const { validation, textError } = checkRequiredProperties(computations[0], ['computationGroup']);
    if (!validation) {
      return res.status(400).json({ error: textError });
    }
    const newComputations = await models.Computation.bulkCreate(
      computations
    );
    if(done){
      const computationGroup = computations[0].computationGroup;
      await redis.set(computationGroup, true);
    }
    
    res.status(201).json(newComputations);
  } catch (error) {
    res.status(500).json({
      message: `Failed to create computations, error: ${error.message}`,
    });
  }
}

export async function deleteComputations(req, res) {
  try {
    await models.Computation.destroy({ where: {} });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({
      message: `Failed to delete computations, error: ${error.message}`,
    });
  }
}

export async function deleteComputationByControlId(req, res) {
  try {
    const { control_id } = req.params;
    await models.Computation.destroy({ where: { control_id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({
      message: `Failed to delete computation, error: ${error.message}`,
    });
  }
}
