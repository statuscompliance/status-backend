import { models } from '../../src/models/models.js';
import { updateConfigurationsCache } from '../../src/middleware/endpoint.js';

/**
 * Ensures the /assistant configuration exists with correct values
 * @param {Object} [options] - Configuration options
 * @param {boolean} [options.available=true] - Whether endpoint is available
 * @param {number} [options.limit=100] - Request limit
 * @returns {Promise<void>}
 */
export async function ensureAssistantConfig(options = {}) {
  const { available = true, limit = 100 } = options;
  
  const existingConfig = await models.Configuration.findOne({
    where: { endpoint: '/assistant' }
  });
  
  if (!existingConfig) {
    await models.Configuration.create({
      endpoint: '/assistant',
      available,
      limit,
    });
  } else {
    await models.Configuration.update(
      { available, limit },
      { where: { endpoint: '/assistant' } }
    );
  }
  
  // Update cache after modifying endpoint
  await updateConfigurationsCache();
}

/**
 * Restores the /assistant configuration to default values
 * @returns {Promise<void>}
 */
export async function restoreAssistantConfig() {
  const existingConfig = await models.Configuration.findOne({
    where: { endpoint: '/assistant' }
  });
  
  if (!existingConfig) {
    // If endpoint was destroyed, recreate it
    await models.Configuration.create({
      endpoint: '/assistant',
      available: true,
      limit: 100,
    });
  } else {
    // If endpoint exists, ensure it has correct values
    await models.Configuration.update(
      { available: true, limit: 100 },
      { where: { endpoint: '/assistant' } }
    );
  }
  
  // Update cache to reflect restored state
  await updateConfigurationsCache();
}

/**
 * Creates a beforeEach hook for assistant configuration setup
 * @param {Object} [options] - Configuration options
 * @returns {Function} beforeEach hook function
 */
export function setupAssistantConfigBeforeEach(options = {}) {
  return async () => {
    await ensureAssistantConfig(options);
  };
}

/**
 * Creates an afterEach hook for assistant configuration cleanup
 * @returns {Function} afterEach hook function
 */
export function cleanupAssistantConfigAfterEach() {
  return async () => {
    await restoreAssistantConfig();
  };
}
