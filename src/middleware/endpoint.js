import { models } from '../models/models.js';

class CacheLoadError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'CacheLoadError';
    this.originalError = originalError;
  }
}

class ConfigurationNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationNotFoundError';
  }
}

class AssistantFetchError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AssistantFetchError';
    this.originalError = originalError;
  }
}

const ASSISTANT_ENDPOINT = '/api/assistant';
const ERROR_MESSAGE_GENERIC = 'Internal server error.';

let configurationsCache = null;

export const setConfigurationCache = (newCache) => {
  configurationsCache = newCache;
};

export const getConfigurationsCache = () => configurationsCache;

export async function updateConfigurationsCache() {
  try {
    configurationsCache = await models.Configuration.findAll();
  } catch (err) {
    console.error(err);
  }
}

async function fetchAllConfigurations() {
  try {
    return await models.Configuration.findAll();
  } catch (err) {
    console.error('Error fetching configurations from DB:', err);
    throw new CacheLoadError('Failed to fetch configurations from database', err);
  }
}

export async function ensureConfigurationsLoaded() {
  if (!configurationsCache) {
    try {
      configurationsCache = await fetchAllConfigurations();
      if (!configurationsCache) {
        // This case might happen if findAll returns null/undefined unexpectedly
        // Although less likely for findAll, adding a check is safer.
        console.error('fetchAllConfigurations returned null or undefined.');
        throw new CacheLoadError('Configurations cache is still empty after fetching.');
      }
      console.log('Configurations cache loaded successfully.');
    } catch (error) {
      // Re-throw the custom error caught from fetchAllConfigurations
      console.error(error);
      throw error;
    }
  }
}

function findMatchingConfiguration(endpoint, cache) {
  const matchingConfig = cache.find(
    (config) => config.endpoint === endpoint
  );

  if (matchingConfig && typeof matchingConfig.available !== 'undefined') {
    return matchingConfig;
  }

  return null;
}

export async function endpointAvailable(req, res, next) {
  try {
    await ensureConfigurationsLoaded();
    
    if (!configurationsCache) {
      console.error('Configurations cache is unexpectedly empty.');
      throw new CacheLoadError('Configurations cache is unavailable.');
    }


    const endpoint = req.url;
    const matchingConfig = findMatchingConfiguration(endpoint, configurationsCache);

    if (!matchingConfig) {
      return res.status(404).json({ message: 'Endpoint not found' });
    }

    if (matchingConfig.available) {
      next();
    } else {
      res.status(404).send('Endpoint not available');
    }

  } catch (error) {
    if (error instanceof CacheLoadError) {
      console.error('Endpoint Availability Middleware Error:', error);
      return res.status(500).send('Error loading configurations.');
    } else {
      console.error('Unhandled error in endpointAvailable middleware:', error);
      return res.status(500).send(ERROR_MESSAGE_GENERIC);
    }
  }
}

async function loadAssistantConfiguration(endpoint = ASSISTANT_ENDPOINT) {
  try {

    const config = await models.Configuration.findOne({ where: { endpoint } });

    if (!config || typeof config.limit === 'undefined') {
      console.warn(`Configuration for ${endpoint} not found or limit not defined.`);
      throw new ConfigurationNotFoundError(`Endpoint configuration for ${endpoint} not found or limit not defined.`);
    }

    return config.limit;

  } catch (error) {

    if (!(error instanceof ConfigurationNotFoundError)) {
      console.error(`Error fetching assistant configuration for ${endpoint}:`, error);
    }
    throw error;
  }
}

async function getAssistantCount() {
  try {
    const assistants = await models.Assistant.findAll();
    if (Array.isArray(assistants)) {
      return assistants.length;
    } else {
      console.error('models.Assistant.findAll did not return an array.');
      throw new AssistantFetchError('Failed to get assistant count: unexpected database response.');
    }
  } catch (error) {
    console.error('Error fetching assistants from DB:', error);
    throw new AssistantFetchError('Failed to fetch assistants from database', error);
  }
}

export async function assistantlimitReached(req, res, next) {
  try {
    await ensureConfigurationsLoaded();

    if (!configurationsCache) {

      console.error('Configurations cache is unexpectedly empty.');
      throw new CacheLoadError('Configurations cache is unavailable.');
    }

    const limit = await loadAssistantConfiguration();
    const assistantCount = await getAssistantCount();

    if (limit <= assistantCount) {
      return res.status(429).send('Assistant limit reached.');
    }

    next();

  } catch (error) {

    if (error instanceof CacheLoadError) {
      console.error('Assistant Limit Middleware Error (Cache):', error);
      return res.status(500).send('Error loading configurations.');
    } else if (error instanceof ConfigurationNotFoundError) {
      console.warn('Assistant Limit Middleware Error (Config Not Found):', error.message);
      return res.status(404).json({ message: error.message });
    } else if (error instanceof AssistantFetchError) {
      console.error('Assistant Limit Middleware Error (Fetch):', error);
      return res.status(500).send('Error checking assistant limits.');
    } else {
      console.error('Unhandled error in assistantlimitReached middleware:', error);
      return res.status(500).send(ERROR_MESSAGE_GENERIC);
    }
  }
}
