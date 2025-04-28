import { expect, describe, it, beforeAll } from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { adminUser, sampleUser } from '../../utils/sampleUserData.js';
import { models } from '../../../src/models/models.js';

const API_PREFIX = process.env.API_PREFIX;

const getResponse = (path, token) => {
  return request
    .get(path)
    .set('Cookie', `accessToken=${token}`);
};

describe('Configuration API Routes', () => {
  let adminToken;
  let regularToken;
  let endpointExists;

  beforeAll(async () => {
    adminToken = jwt.sign(
      {
        userId: adminUser._id,
        username: adminUser.username,
        authority: adminUser.authority,
      },
      'test-secret-key'
    );
    regularToken = jwt.sign(
      {
        userId: sampleUser._id,
        username: sampleUser.username,
        authority: sampleUser.authority,
      },
      'test-secret-key'
    );
    const getAllEndpoints = await models.Configuration.findAll();
    endpointExists = getAllEndpoints[5].dataValues;
  });

  describe('Index GET /', () => {
    const getPath = '/config';
    it('should return 200 and all configurations for admin user', async () => {
      const response = await getResponse(getPath, adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
    it('should return 403 for regular user', async () => {
      const response = await getResponse(getPath, regularToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });
    it('should return 401 for Unauthorized user', async () => {
      const response = await getResponse(getPath);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });
  describe('POST /config', () => {
    const postResponse = (token, endpoint) => {
      return request
        .post('/config')
        .set('Cookie', `accessToken=${token}`)
        .send(endpoint);
    };
    it('should return 200 and the configuration for admin user', async () => {
      const response = await postResponse(adminToken, endpointExists);        

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('endpoint');
      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('limit');
    });

    it('should return 500 if configuration not found for admin user', async () => {
      const nonExistentEndpoint = 'non-existent-endpoint';
      const response = await postResponse(adminToken, nonExistentEndpoint);   

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        expect.stringMatching(/^Failed to get configuration/)
      );
    });

    it('should return 403 for regular user', async () => {
      const response = await postResponse(regularToken, endpointExists);   

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await postResponse(undefined, endpointExists);   
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return 500 for invalid request body', async () => {
      const response = await postResponse(adminToken, undefined); // Missing 'endpoint'
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        expect.stringMatching(/^Failed to get configuration/)
      );
    });
  });
  describe('PUT /config', () => {
    const putResponse = (token, endpoint) => {
      return request
        .put('/config')
        .set('Cookie', `accessToken=${token}`)
        .send(endpoint);
    };

    it('should return 200 and success message for admin user', async () => {
      const response = await putResponse(adminToken, endpointExists);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        'Configuration 1 updated successfully'
      );
    });

    it('should return 404 if configuration not found for admin user', async () => {
      const nonExistentEndpoint = 'non-existent-update-endpoint';
      const updatedAvailability = false;
      const response = await request
        .put('/config')
        .set('Cookie', `accessToken=${adminToken}`)
        .send({
          endpoint: nonExistentEndpoint,
          available: updatedAvailability,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Configuration with endpoint non-existent-update-endpoint not found'
      );
    });

    it('should return 403 for regular user', async () => {
      const response = await putResponse(regularToken, endpointExists);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for No token provided user', async () => {
      const response = await putResponse(undefined, endpointExists);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return 500 for invalid request body', async () => {
      const response = await putResponse(adminToken, undefined); // Missing 'available'

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        expect.stringMatching(/^Failed to update configuration/)
      );
    });
  });
  describe('GET /config/assistant/limit', () => {
    const getPath = '/config/assistant/limit';
    it('should return 200 and the assistant limit for admin user', async () => {
      await models.Configuration.create({
        endpoint: `${API_PREFIX}/assistant`,
        limit: 7,
      });
      const response = await getResponse(getPath, adminToken);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(7);

      await models.Configuration.destroy({
        where: { endpoint: `${API_PREFIX}/assistant` },
      });
    });

    it('should return 403 for regular user', async () => {
      const response = await getResponse(getPath, regularToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await getResponse(getPath, undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return 404 if configuration not found for admin user', async () => {
      const response = await getResponse(getPath, undefined);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('PUT /config/assistant/limit/:limit', () => {
    const putResponse = (limit, token) => {
      return request
        .put('/config/assistant/limit/'+limit)
        .set('Cookie', `accessToken=${token}`)
    };
    const newLimit = 5;

    it('should return 200 and success message for admin user', async () => {
      await models.Configuration.create({
        endpoint: `${API_PREFIX}/assistant`,
        limit: 7,
      });
      const response = await putResponse(newLimit, adminToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Limit updated successfully');
      await models.Configuration.destroy({
        where: { endpoint: `${API_PREFIX}/assistant` },
      });
    });

    it('should return 404 if configuration not found for admin user', async () => {
      const nonExistentLimit = 999;
      const response = await putResponse(nonExistentLimit, adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Configuration undefined not found');
    });

    it('should return 403 for regular user', async () => {
      const response = await putResponse(newLimit, regularToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for No token provided user', async () => {
      const response = await putResponse(newLimit, undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const invalidLimit = 'abc';
      const response = await putResponse(invalidLimit, adminToken);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid limit value');
    });
  });
});
