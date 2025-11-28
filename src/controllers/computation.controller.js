import { models } from '../models/models.js';
import { Op , Sequelize} from 'sequelize';
import { checkRequiredProperties } from '../utils/checkRequiredProperties.js';
import nodered from '../config/nodered.js';
import { v4 as uuidv4 } from 'uuid';
import redis from '../config/redis.js';
import { calculateCompliance } from '../utils/calculateCompliance.js';
import { handleControllerError } from '../utils/errorHandler.js';

const isTestEnvironment = !!import.meta.env?.VITEST;
const API_PREFIX = isTestEnvironment ? '' : process.env.API_PREFIX;

/**
 * Validates that the endpoint doesn't contain malicious patterns.
 * 
 * Security measures:
 * - Prevents path traversal attacks (../)
 * - Blocks URL encoding bypass attempts (%2e, %2f, %5c)
 * - Rejects null bytes and special characters
 * - Ensures clean path format (no backslashes, double slashes)
 * - Restricts to safe character set: alphanumeric, hyphens, underscores, slashes
 * 
 * @param {string} endpoint - The endpoint to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidNodeRedEndpoint(endpoint) {
  if (!endpoint || typeof endpoint !== 'string') {
    return false;
  }
  
  // Ensure it starts with /
  if (!endpoint.startsWith('/')) {
    return false;
  }
  
  // Prevent path traversal attempts
  if (endpoint.includes('..')) {
    return false;
  }
  
  // Prevent backslashes (use forward slashes only)
  if (endpoint.includes('\\')) {
    return false;
  }
  
  // Prevent null bytes
  if (endpoint.includes('\0') || endpoint.includes('%00')) {
    return false;
  }
  
  // Prevent URL encoding that could be used to bypass filters
  if (endpoint.match(/%2e|%2f|%5c/i)) {
    return false;
  }
  
  // Only allow alphanumeric, hyphens, underscores, and forward slashes
  if (!/^[a-zA-Z0-9/_-]+$/.test(endpoint)) {
    return false;
  }
  
  // Prevent multiple consecutive slashes
  if (endpoint.includes('//')) {
    return false;
  }
  
  return true;
}

export async function getComputations(req, res) {
  try {
    const computations = await models.Computation.findAll();
    res.status(200).json(computations);
  } catch (error) {
    handleControllerError(res, error, 'Failed to get computations');
  }
}

export async function getComputationsById(req, res) {
  try {
    const { id } = req.params;
    const computations = await models.Computation.findAll({
      where: { computationGroup: id },
    });
    const ready = await redis.get(id);
    if (computations.length === 0) {
      return res.status(404).json({ message: 'Computations not found' });
    }
    if (ready !== 'true') {
      return res.status(202).json({ message: 'Not ready yet' });
    }
    return res.status(200).json({
      code: 200,
      message: 'OK',
      computations: calculateCompliance(computations),
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to get computation by ID');
  }
}

export async function getComputationsByControlId(req, res) {
  try {
    const { controlId } = req.params;
    const computations = await models.Computation.findAll({
      where: { controlId },
    });
    res.status(200).json(computations);
  } catch (error) {
    handleControllerError(res, error, 'Failed to get computations by control ID');
  }
}

export async function getComputationsByControlIdAndCreationDate(req, res) {
  try {
    const { controlId, createdAt } = req.params;

    const startOfDay = new Date(createdAt);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(createdAt);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const computations = await models.Computation.findAll({
      where: {
        controlId,
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    res.status(200).json(computations);
  } catch (error) {
    handleControllerError(res, error, 'Failed to get computation by control ID and creation date');
  }
}

export async function setComputeIntervalBytControlIdAndCreationDate(req, res) {
  try {
    const { controlId } = req.params;
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: '"from" and "to" are required in body' });
    }
    const [updated] = await models.Computation.update(
      { period: { from, to } },
      {
        where: {
          controlId,
          [Op.and]: [
            // Use Sequelize.literal to explicitly extract the 'from' value as text
            // and then cast it to TIMESTAMPTZ for comparison.
            Sequelize.where(
              Sequelize.cast(Sequelize.literal("period->>'from'"), 'TIMESTAMPTZ'),
              { [Op.gte]: from }
            ),
            // Do the same for the 'to' value.
            Sequelize.where(
              Sequelize.cast(Sequelize.literal("period->>'to'"), 'TIMESTAMPTZ'),
              { [Op.lte]: to }
            )
          ]
        },
      }
    );
    if (updated === 0) {
      return res.status(404).json({ message: 'No computations found for the given controlId' });
    }

    return res.status(204).json({ message: `${updated} computations updated.` });
  } catch (error) {
    handleControllerError(res, error, 'Failed to update computation interval');
  }
};

export async function createComputation(req, res) {
  try {
    const { metric, config } = req.body;
    const { validation, textError } = checkRequiredProperties(metric, [
      'endpoint',
      'params',
    ]);
    if (!validation) {
      return res.status(400).json({ error: textError });
    }
    
    // Validate the endpoint against whitelist
    if (!isValidNodeRedEndpoint(metric.endpoint)) {
      return res.status(400).json({ 
        error: 'Invalid endpoint. The specified endpoint is not allowed.' 
      });
    }
    
    const endpoint = `/${API_PREFIX}${metric.endpoint}`;
    const computationId = uuidv4();
    const { end: to, ...restWindow } = metric.window;
    const params = {
      computationGroup: computationId,
      backendUrl: config.backendUrl,
      ...metric.params,
      scope: metric.scope,
      to,
      ...restWindow,
    };
    const headers = {
      'x-access-token': req.cookies.accessToken,
    };
    const response = await nodered.post(endpoint, params, { headers });
    if (response.status !== 200) {
      return res
        .status(400)
        .json({ message: 'Something went wrong when calling Node-RED' });
    }
    res.status(201).json({
      code: 201,
      message: 'OK',
      computation: `${API_PREFIX}/computations/${computationId}`,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to create computation');
  }
}

export async function bulkCreateComputations(req, res) {
  try {
    const { computations, done } = req.body;
    if (!Array.isArray(computations) || computations.length === 0) {
      return res.status(400).json({ error: 'Invalid computations' });
    }
    const { validation, textError } = checkRequiredProperties(computations[0], [
      'computationGroup',
    ]);
    if (!validation) {
      return res.status(400).json({ error: textError });
    }
    const newComputations = await models.Computation.bulkCreate(computations);
    if (done) {
      const computationGroup = computations[0].computationGroup;
      await redis.set(computationGroup, true);
    }
    res.status(201).json(newComputations);
  } catch (error) {
    handleControllerError(res, error, 'Failed to create computations');
  }
}

export async function deleteComputations(req, res) {
  try {
    await models.Computation.destroy({ where: {} });
    res.status(204).end();
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete computations');

  }
}

export async function deleteComputationByControlId(req, res) {
  try {
    const { controlId } = req.params;
    const deletedCount = await models.Computation.destroy({ where: { controlId } });
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'No computations found to delete' });
    }
    res.status(204).end();
  } catch (error) {
    handleControllerError(res, error, 'Failed to delete computation by control ID');
  }
}
