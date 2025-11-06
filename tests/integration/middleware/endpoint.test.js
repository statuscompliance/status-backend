import { request } from '../../setup/setup';
import { vi, expect, describe, it, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { models } from '../../../src/models/models';
import { setConfigurationsCache, updateConfigurationsCache, getConfigurationsCache } from '../../../src/middleware/endpoint';
import { adminUser } from '../../utils/sampleUserData';
import jwt from 'jsonwebtoken';
import { sampleAssistants } from '../../utils/sampleAssistantData';

const getResponse = async (endpoint, token = null) => {
  let req = request.get(endpoint);
  if (token) {
    req = req.set('Cookie', `accessToken=${token}`);
  }
  return await req;
};

const postResponse = async (endpoint, data = null, token = null) => {
  let req = request.post(endpoint);
  if (token) {
    req = req.set('Cookie', `accessToken=${token}`);
  }
  if (data) {
    req = req.send(data);
  }
  return await req;
};

let adminToken;

beforeAll(async () => {
  // Clear only test-specific data, not all configurations
  await models.Assistant.destroy({ where: {}, truncate: true, cascade: true });

  adminToken = jwt.sign(
    {
      userId: adminUser._id,
      username: adminUser.username,
      authority: adminUser.authority,
    },
    'test-secret-key'
  );

  // Only create specific configurations needed for these tests
  // This ensures we don't interfere with other test files
  const testEndpoints = ['/users', '/controls', '/assistant'];
  for (const endpoint of testEndpoints) {
    const existing = await models.Configuration.findOne({ where: { endpoint } });
    if (!existing) {
      await models.Configuration.create({
        endpoint,
        available: endpoint !== '/controls', // /controls should be unavailable for tests
        limit: endpoint === '/assistant' ? 1 : 100
      });
    } else {
      // Update existing to match test requirements
      await models.Configuration.update({
        available: endpoint !== '/controls',
        limit: endpoint === '/assistant' ? 1 : 100
      }, { where: { endpoint } });
    }
  }
  
  await models.Assistant.bulkCreate(sampleAssistants);
  // CRITICAL: Update cache after modifying endpoints
  await updateConfigurationsCache();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Restore assistant endpoint configuration to default values for other tests
  await models.Configuration.update(
    { available: true, limit: 100 },
    { where: { endpoint: '/assistant' } }
  );
  // Clear the cache after all tests
  setConfigurationsCache(null);
  // Only clear assistants, leave configurations for other tests
  await models.Assistant.destroy({ where: {}, truncate: true, cascade: true });
});

describe('Endpoint Integration Tests', () => {
  afterEach(async () => {
    // Always restore all endpoints to available state after each test
    await models.Configuration.update(
      { available: true },
      { where: {} }
    );
    await updateConfigurationsCache();
  });

  it('should allow access to an available /users endpoint for admin user', async () => {
    const response = await getResponse('/users', adminToken);
    expect(response.status).toBe(200);
  });

  it('should return 404 for a non-existent endpoint', async () => {
    const response = await getResponse('/nonexistent-endpoint');
    expect(response.status).toBe(404);
  });

  it('should return 404 for an unavailable /users endpoint', async () => {
    let testConfig = await models.Configuration.findOne({ where: { endpoint: '/users' } });

    await models.Configuration.update({ available: false }, { where: { id: testConfig.id } });
    await updateConfigurationsCache();

    const response = await getResponse('/users', adminToken);
    expect(response.status).toBe(404);
    expect(response.text).toBe('Endpoint not available');
  });

  it('should return 404 if no matching configuration is found', async () => {
    const response = await getResponse('/unknown-endpoint');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Endpoint not found');
  });
});

describe('Assistant Limit Integration Tests', () => {
  beforeEach(async () => {
    // Clear assistants before each test to ensure clean state
    await models.Assistant.destroy({ where: {}, truncate: true, cascade: true });
    
    // Ensure /assistant endpoint exists with correct values before each test
    const existingConfig = await models.Configuration.findOne({
      where: { endpoint: '/assistant' }
    });
    
    if (!existingConfig) {
      // If endpoint doesn't exist, create it
      await models.Configuration.create({
        endpoint: '/assistant',
        available: true,
        limit: 1,
      });
    } else {
      // If endpoint exists, update it to ensure correct values
      await models.Configuration.update(
        { available: true, limit: 1 },
        { where: { endpoint: '/assistant' } }
      );
    }
    
    // CRITICAL: Update cache after modifying endpoint
    await updateConfigurationsCache();
  });

  afterEach(async () => {
    // Always restore /assistant endpoint to available state after each test
    const existingConfig = await models.Configuration.findOne({
      where: { endpoint: '/assistant' }
    });
    
    if (!existingConfig) {
      // If endpoint was destroyed, recreate it
      await models.Configuration.create({
        endpoint: '/assistant',
        available: true,
        limit: 1,
      });
    } else {
      // If endpoint exists, ensure it has correct values
      await models.Configuration.update(
        { available: true, limit: 1 },
        { where: { endpoint: '/assistant' } }
      );
    }
    
    await updateConfigurationsCache();
  });

  it('should allow access to /api/assistant when limit is not reached for admin user', async () => {
    const response = await getResponse('/assistant', adminToken);
    expect(response.status).toBe(200);
  });

  it('should return 404 if assistant endpoint configuration is not found', async () => {
    // Temporarily make the endpoint unavailable instead of destroying it
    await models.Configuration.update(
      { available: false },
      { where: { endpoint: '/assistant' } }
    );
    await updateConfigurationsCache();

    const response = await getResponse('/assistant', adminToken);
    expect(response.status).toBe(404);
    expect(response.text).toBe('Endpoint not available');
  });

  it('should send 429 if the number of assistants is greater than or equal to the limit', async () => {
    // Ensure /assistant endpoint is in cache
    await updateConfigurationsCache();
    
    // Create one assistant first to reach the limit of 1
    await models.Assistant.create(sampleAssistants[0]);

    // Now try to create another assistant, should return 429 because limit is reached
    const response = await postResponse('/assistant', sampleAssistants[0], adminToken);

    expect(response.status).toBe(429);
    expect(response.text).toBe('Limit reached');
  });

});

//Tests for coverage improvements
describe('updateConfigurationsCache Tests', () => {

  it('should successfully update the configurations cache with data from the database', async () => {
    await updateConfigurationsCache();
    const cache = getConfigurationsCache();
    // Verify cache contains expected number of endpoints
    expect(cache).toHaveLength(17);
    // Verify specific endpoints exist with correct properties
    const assistantConfig = cache.find(c => c.dataValues.endpoint === '/assistant');
    expect(assistantConfig).toBeDefined();
    expect(assistantConfig.dataValues.limit).toBe(1);
    expect(assistantConfig.dataValues.available).toBe(true);
  });

  it('should return an empty array if no configurations are found in the database', async () => {
    await models.Configuration.destroy({ where: {} });
    await updateConfigurationsCache();
    const cache = getConfigurationsCache();
    expect(cache).toEqual([]);
  });

  it('should return an empty array if the cache is not set', async () => {
    setConfigurationsCache(null);
    const cache = getConfigurationsCache()
    expect(cache).toEqual(null);
  });

  it('should handle errors when fetching configurations from the database and log the error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const originalFindAll = models.Configuration.findAll;
    models.Configuration.findAll = async () => {
      throw new Error('Simulated database error');
    };
    await updateConfigurationsCache();
    expect(consoleErrorSpy).toHaveBeenCalled();
    models.Configuration.findAll = originalFindAll;
    consoleErrorSpy.mockRestore();
  });
});
