import { models } from '../models/models.js';

export let configurationsCache = null;

export const setConfigurationCache = (newCache) => {
  configurationsCache = newCache;
}

export async function updateConfigurationsCache() {
  try {
    configurationsCache = await models.Configuration.findAll();
  } catch (err) {
    console.error(err);
  }
}

//Endpoint
async function loadConfigurations() {
  try {
    await updateConfigurationsCache(models);
  } catch (error) {
    console.error('Error updating configurations cache:', error);
    throw new Error('Error loading configurations.');
  }
}

function findMatchingConfiguration(endpoint, cache) {
  return cache.find(
    (config) =>
      endpoint.includes(config.dataValues.endpoint) ||
      config.dataValues.endpoint.includes(endpoint)
  );
}

export async function endpointAvailable(req, res, next) {

  if (!configurationsCache) {
    try {
      await loadConfigurations(models);
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }

  if (!configurationsCache) {
    console.error('Configurations cache is still empty after loading.');
    return res.status(500).send('Error loading configurations.');
  }

  const endpoint = req.url;
  const matchingConfig = findMatchingConfiguration(endpoint, configurationsCache);

  if (!matchingConfig) {
    return res.status(404).json({ message: 'Endpoint not found' });
  }

  if (matchingConfig.dataValues.available) {
    next();
  } else {
    res.status(404).send('Endpoint not available');
  }
}

//Assistant
async function loadAssistantConfiguration(endpoint = '/api/assistant') {

  const config = await models.Configuration.findOne({ where: { endpoint } });

  if (!config || !config.dataValues || typeof config.dataValues.limit === 'undefined') {
    console.warn(`Configuration for ${endpoint} not found or limit not defined.`);
    throw new Error('Endpoint configuration not found.');
  }
  return config.dataValues.limit;
}

async function getAssistantCount() {
  try {
    const assistants = await models.Assistant.findAll();
    if (assistants) {
      return assistants.length;
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Error fetching assistants:', error);
    throw new Error('Error fetching assistants.');
  }
}

export async function assistantlimitReached(req, res, next) {
  if (!configurationsCache) {
    try {
      await updateConfigurationsCache(models);
    } catch (error) {
      console.error('Error updating configurations cache:', error);
      return res.status(500).send('Error loading configurations.');
    }
  }

  try {
    const limit = await loadAssistantConfiguration(models);
    const assistantCount = await getAssistantCount(models);

    if (limit <= assistantCount) {
      return res.status(429).send('Assistant limit reached.');
    }

    next();

  } catch (error) {
    if (error.message === 'Error loading configurations.') {
      return res.status(500).send(error.message);
    } else if (error.message === 'Endpoint configuration not found.') {
      return res.status(404).json({ message: error.message });
    } else if (error.message === 'Error fetching assistants.') {
      return res.status(500).send('Error checking assistant limits.');
    } else {
      console.error('Unhandled error in assistantlimitReached:', error);
      return res.status(500).send('Internal server error.');
    }
  }
}
