import { models } from '../models/models.js';

// === Custom Errors ===
export class CacheLoadError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'CacheLoadError';
    this.originalError = originalError;
    this.statusCode = 500;
  }
}

export class ConfigurationNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationNotFoundError';
    this.statusCode = 404;
  }
}

export class AssistantFetchError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AssistantFetchError';
    this.originalError = originalError;
    this.statusCode = 500;
  }
}

// === Constants ===
const ASSISTANT_ENDPOINT = '/api/assistant';

let configurationsCache = null;

// === Cache Utils ===
export const setConfigurationCache = (newCache) => {
  configurationsCache = newCache;
};

export const getConfigurationsCache = () => configurationsCache;

export async function updateConfigurationsCache() {
  configurationsCache = await models.Configuration.findAll();
}

async function fetchAllConfigurations() {
  try {
    return await models.Configuration.findAll();
  } catch (err) {
    throw new CacheLoadError('Failed to fetch configurations from database', err);
  }
}

export async function ensureConfigurationsLoaded() {
  if (!configurationsCache) {
    configurationsCache = await fetchAllConfigurations();
    if (!configurationsCache) {
      throw new CacheLoadError('Configurations cache is still empty after fetching.');
    }
  }
}

// === Matching Logic ===
function findMatchingConfiguration(endpoint, cache) {
  return cache.find(config => config.endpoint === endpoint && config.available !== undefined) || null;
}

// === Middleware: Endpoint Availability ===
export async function endpointAvailable(req, res, next) {
  try {
    await ensureConfigurationsLoaded();

    if (!configurationsCache) {
      throw new CacheLoadError('Configurations cache is unavailable.');
    }

    const endpoint = req.url;
    const matchingConfig = findMatchingConfiguration(endpoint, configurationsCache);

    if (!matchingConfig) {
      return res.status(404).json({ message: 'Endpoint not found' });
    }

    return matchingConfig.available
      ? next()
      : res.status(404).send('Endpoint not available');

  } catch (error) {
    next(error);
  }
}

// === Middleware Helpers ===
async function loadAssistantConfiguration(endpoint = ASSISTANT_ENDPOINT) {
  const config = await models.Configuration.findOne({ where: { endpoint } });

  if (!config || typeof config.limit === 'undefined') {
    throw new ConfigurationNotFoundError(`Endpoint configuration for ${endpoint} not found or limit not defined.`);
  }

  return config.limit;
}

async function getAssistantCount() {
  try {
    const assistants = await models.Assistant.findAll();
    if (!Array.isArray(assistants)) {
      throw new AssistantFetchError('Unexpected response when fetching assistants.');
    }
    return assistants.length;
  } catch (error) {
    throw new AssistantFetchError('Failed to fetch assistants from database', error);
  }
}

// === Middleware: Assistant Limit ===
export async function assistantlimitReached(req, res, next) {
  try {
    await ensureConfigurationsLoaded();

    if (!configurationsCache) {
      throw new CacheLoadError('Configurations cache is unavailable.');
    }

    const limit = await loadAssistantConfiguration();
    const assistantCount = await getAssistantCount();

    if (limit <= assistantCount) {
      return res.status(429).json({ 
        message: 'Assistant limit reached.',
        current: assistantCount,
        limit: limit
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}
