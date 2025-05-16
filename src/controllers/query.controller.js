import { models } from '../models/models.js';
import { getSQLFromSequelize, parseSQLQuery } from '../utils/sqlQueryBuilder.js';
import { handleControllerError } from '../utils/errorHandler.js';

export async function createQuery(req, res) {
  const { model, operation, options } = req.body;
  try {
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
