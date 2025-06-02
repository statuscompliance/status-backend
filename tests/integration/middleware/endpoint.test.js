import { request } from '../../setup/setup';
import { vi, expect, describe, it, beforeAll, afterAll } from 'vitest';
import { models } from '../../../src/models/models';
import { setConfigurationsCache, updateConfigurationsCache, getConfigurationsCache } from '../../../src/middleware/endpoint';
import { adminUser } from '../../utils/sampleUserData';
import jwt from 'jsonwebtoken';
import { sampleConfigurations } from '../../utils/sampleConfigurationData';
import { sampleAssistants } from '../../utils/sampleAssistantData';

const API_PREFIX = process.env.API_PREFIX || '';

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
  // Clear the cache before running tests
  await models.Configuration.destroy({ where: {}, truncate: true, cascade: true });
  await models.Assistant.destroy({ where: {}, truncate: true, cascade: true });

  adminToken = jwt.sign(
    {
      userId: adminUser._id,
      username: adminUser.username,
      authority: adminUser.authority,
    },
    'test-secret-key'
  );

  await models.Configuration.bulkCreate(sampleConfigurations);
  await models.Assistant.bulkCreate(sampleAssistants);
  await updateConfigurationsCache();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Clear the cache after all tests
  setConfigurationsCache(null);
  await models.Configuration.destroy({ where: {}, truncate: true, cascade: true });
  await models.Assistant.destroy({ where: {}, truncate: true, cascade: true });
});

describe('Endpoint Integration Tests', () => {

  it('should allow access to an available /users endpoint for admin user', async () => {
    const response = await getResponse(`${API_PREFIX}/users`, adminToken);
    expect(response.status).toBe(200);
  });

  it('should return 404 for a non-existent endpoint', async () => {
    const response = await getResponse('/nonexistent-endpoint');
    expect(response.status).toBe(404);
  });

  it('should return 404 for an unavailable /users endpoint', async () => {
    let testConfig = await models.Configuration.findOne({ where: { endpoint: `${API_PREFIX}/users` } });

    await models.Configuration.update({ available: false }, { where: { id: testConfig.id } });
    setConfigurationsCache(await models.Configuration.findAll());

    const response = await getResponse(`${API_PREFIX}/users`, adminToken);
    expect(response.status).toBe(404);
    expect(response.text).toBe('Endpoint not available');

    await models.Configuration.update({ available: true }, { where: { id: testConfig.id } });
    setConfigurationsCache(await models.Configuration.findAll());
  });

  it('should return 404 if no matching configuration is found', async () => {
    const response = await getResponse('/unknown-endpoint');
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Endpoint not found');
  });
});

describe('Assistant Limit Integration Tests', () => {

  it('should allow access to /api/assistant when limit is not reached for admin user', async () => {
    const response = await getResponse(`${API_PREFIX}/assistant`, adminToken);
    expect(response.status).toBe(200);
  });

  it('should return 404 if assistant endpoint configuration is not found', async () => {

    await models.Configuration.destroy({ where: { endpoint: `${API_PREFIX}/assistant` } });
    setConfigurationsCache(await models.Configuration.findAll());

    const response = await getResponse(`${API_PREFIX}/assistant`, adminToken);
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Endpoint not found');

    await models.Configuration.create({
      endpoint: `${API_PREFIX}/assistant`,
      available: true,
      limit: 1,
    });
    setConfigurationsCache(await models.Configuration.findAll());
  });

  it('should send 429 if the number of assistants is greater than or equal to the limit', async () => {
    setConfigurationsCache(await models.Configuration.findAll());

    const response = await postResponse(`${API_PREFIX}/assistant`, sampleAssistants[0], adminToken);

    expect(response.status).toBe(429);
    expect(response.text).toBe('Limit reached');
  });

});

//Tests for coverage improvements
describe('updateConfigurationsCache Tests', () => {

  it('should successfully update the configurations cache with data from the database', async () => {
    await updateConfigurationsCache();
    const cache = getConfigurationsCache();
    expect(cache).toEqual(
      expect.arrayContaining(sampleConfigurations.map(config => expect.objectContaining(config)))
    );
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


