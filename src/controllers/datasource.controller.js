import { methods } from '../config/grafana.js';
import crypto from 'node:crypto';
import { handleControllerError } from '../utils/errorHandler.js';

export async function getDatasources(req, res) {
  try {
    const response = await methods.datasource.getDataSources();
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve datasources in Grafana');
  }
}

export async function addDatasource(req, res) {
  try {
    const response = await methods.datasource.addDataSource({
      access: req.body.access,
      basicAuth: req.body.basicAuth,
      basicAuthUser: process.env.GRAFANA_USER,
      database: req.body.database,
      isDefault: req.body.isDefault,
      jsonData: req.body.jsonData,
      name: req.body.datasourceName,
      type: req.body.type,
      uid: crypto.randomUUID(),
      url: req.body.url,
      user: req.body.user,
      withCredentials: true,
    });
    return res.status(201).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create datasource in Grafana');
  }
}
