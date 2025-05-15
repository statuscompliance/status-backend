import { methods } from '../config/grafana.js';
import crypto from 'crypto';

export async function getDatasources(req, res) {
  try {
    const response = await methods.datasource.getDataSources();
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve datasources in Grafana due to server error',
        error: error.message,
      });
    }
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
    if (error.response) {
      const { status, statusText, data } = error.response;
      return res.status(status).json({
        message: `Failed to create datasource in Grafana: ${statusText}`,
        error: data.message || error.message,
      });
    } else {
      return res.status(500).json({
        message:
                    'Failed to create datasource in Grafana due to server error',
        error: error.message,
      });
    }
  }
}
