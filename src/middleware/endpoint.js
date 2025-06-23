import { models } from '../models/models.js';

const API_PREFIX = process.env.API_PREFIX || '';
export const configurationsCache = { data: null };

export function getConfigurationsCache() {
  return configurationsCache.data;
}

export function setConfigurationsCache(value) {
  configurationsCache.data = value;
}

export async function updateConfigurationsCache() {
  setConfigurationsCache(await models.Configuration.findAll().catch((err) => {
    console.error(err);
  }));
}

export async function endpointAvailable(req, res, next) {
  if (!getConfigurationsCache()) {
    await updateConfigurationsCache();
  }
  const endpoint = req.url;
  const matchingConfig = getConfigurationsCache().find(
    (config) =>
      endpoint.includes(config.dataValues.endpoint) ||
            config.dataValues.endpoint.includes(endpoint)
  );
  if (matchingConfig === undefined) {
    return res.status(404).json({ message: 'Endpoint not found' });
  }
  
  if (matchingConfig.dataValues.available) {
    next();
  } else {
    res.status(404).send('Endpoint not available');
  }
}

export async function assistantlimitReached(req, res, next) {
  if (!getConfigurationsCache()) {
    await updateConfigurationsCache();
  }
  const matchingConfig = await models.Configuration.findOne({
    where: { endpoint: `${API_PREFIX}/assistant` },
  });
  if (matchingConfig === undefined) {
    return res.status(404).json({ message: 'Endpoint not found' });
  } else {
    const assistants = await models.Assistant.findAll();
    if (assistants) {
      if (matchingConfig.dataValues.limit <= assistants.length) {
        res.status(429).send('Limit reached');
      } else {
        next();
      }
    } else {
      next();
    }
  }
}
