import { models } from '../models/models.js';
import { getSQLFromSequelize, parseSQLQuery } from '../utils/sqlQueryBuilder.js';
import { handleControllerError } from '../utils/errorHandler.js';

/**
 * Verifies if the specified model is supported
 * @param {string} modelName - Name of the model to verify
 * @returns {boolean} - true if the model is supported, false otherwise
 */
function isModelSupported(modelName) {
  return models && modelName && Object.prototype.hasOwnProperty.call(models, modelName);
}

export async function createQuery(req, res) {
  const { model, operation, options } = req.body;
  
  try {
    if (!isModelSupported(model)) {
      return res.status(400).json({
        success: false,
        message: `Model not supported: ${model}`,
        supportedModels: Object.keys(models)
      });
    }
    
    const response = await getSQLFromSequelize(
      models[model],
      operation,
      options
    );
    return res.status(200).json({
      message: 'SQL query created successfully',
      query: response,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create SQL query');
  }
}

export async function parseQuery(req, res) {
  try {
    const response = parseSQLQuery(req.body.rawSql);
    return res.status(200).json({
      message: 'SQL query parsed successfully',
      sql: response,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to parse SQL query');
  }
}
