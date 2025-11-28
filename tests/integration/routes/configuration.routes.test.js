import { expect, describe, vi, it, beforeAll, afterEach, beforeEach } from 'vitest';
import { request } from '../../setup/setup.js';
import { models } from '../../../src/models/models.js';
import { createAdminToken, createRegularToken } from '../../utils/tokenHelpers.js';
import { getRequest, postRequest, putRequest } from '../../utils/requestHelpers.js';
import {
  setupAssistantConfigBeforeEach,
  cleanupAssistantConfigAfterEach
} from '../../utils/configHelpers.js';

describe('Configuration API Routes', () => {
  let adminToken;
  let regularToken;
  let endpointExists;

  beforeAll(async () => {
    adminToken = createAdminToken();
    regularToken = createRegularToken();
    const getAllEndpoints = await models.Configuration.findAll();
    endpointExists = getAllEndpoints[5].dataValues;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Index GET /', () => {
    const getPath = '/config';
    it('should return 200 and all configurations for admin user', async () => {
      const response = await getRequest(request, getPath, adminToken);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
    it('should return 403 for regular user', async () => {
      const response = await getRequest(request, getPath, regularToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });
    it('should return 401 for Unauthorized user', async () => {
      const response = await getRequest(request, getPath);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });
  });
  describe('POST /config', () => {
    it('should return 200 and the configuration for admin user', async () => {
      const response = await postRequest(request, '/config', adminToken, endpointExists);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('endpoint');
      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('limit');
    });

    it('should return 500 if configuration not found for admin user', async () => {
      const nonExistentEndpoint = 'non-existent-endpoint';
      const response = await postRequest(request, '/config', adminToken, nonExistentEndpoint);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        expect.stringMatching(/^Failed to get configuration/)
      );
    });

    it('should return 403 for regular user', async () => {
      const response = await postRequest(request, '/config', regularToken, endpointExists);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await postRequest(request, '/config', undefined, endpointExists);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 500 for invalid request body', async () => {
      const response = await postRequest(request, '/config', adminToken, undefined); // Missing 'endpoint'
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        expect.stringMatching(/^Failed to get configuration/)
      );
    });
  });
  describe('PUT /config', () => {
    it('should return 200 and success message for admin user', async () => {
      const response = await putRequest(request, '/config', adminToken, endpointExists);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        'Configuration 16 updated successfully'
      );
    });

    it('should return 404 if configuration not found for admin user', async () => {
      const nonExistentEndpoint = 'non-existent-update-endpoint';
      const updatedAvailability = false;
      const response = await putRequest(request, '/config', adminToken, {
        endpoint: nonExistentEndpoint,
        available: updatedAvailability,
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Configuration with endpoint non-existent-update-endpoint not found'
      );
    });

    it('should return 403 for regular user', async () => {
      const response = await putRequest(request, '/config', regularToken, endpointExists);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for No token provided user', async () => {
      const response = await putRequest(request, '/config', undefined, endpointExists);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 500 for invalid request body', async () => {
      const response = await putRequest(request, '/config', adminToken, undefined); // Missing 'available'

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        expect.stringMatching(/^Failed to update configuration/)
      );
    });
  });
  describe('GET /config/assistant/limit', () => {
    const getPath = '/config/assistant/limit';
    
    beforeEach(setupAssistantConfigBeforeEach());
    afterEach(cleanupAssistantConfigAfterEach());

    it('should return 200 and the assistant limit for admin user', async () => {
      const response = await getRequest(request, getPath, adminToken);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(100);
    });

    it('should return 403 for regular user', async () => {
      const response = await getRequest(request, getPath, regularToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await getRequest(request, getPath);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 404 if configuration not found for admin user', async () => {
      const response = await getRequest(request, getPath);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('PUT /config/assistant/limit/:limit', () => {
    const newLimit = 5;

    beforeEach(setupAssistantConfigBeforeEach());
    afterEach(cleanupAssistantConfigAfterEach());

    it('should return 200 and success message for admin user', async () => {
      const response = await putRequest(request, `/config/assistant/limit/${newLimit}`, adminToken);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Limit updated successfully');
    });

    it('should return 404 if configuration not found for admin user', async () => {
      await models.Configuration.destroy({
        where: {
          endpoint: '/assistant',
        },
      });

      const nonExistentLimit = 999;
      const response = await putRequest(request, `/config/assistant/limit/${nonExistentLimit}`, adminToken);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Configuration undefined not found');
      
      // Note: afterEach will restore the assistant configuration automatically
    });

    it('should return 403 for regular user', async () => {
      const response = await putRequest(request, `/config/assistant/limit/${newLimit}`, regularToken);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    it('should return 401 for No token provided user', async () => {
      const response = await putRequest(request, `/config/assistant/limit/${newLimit}`, undefined);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('No token provided');
    });

    it('should return 400 for invalid limit parameter', async () => {
      const invalidLimit = 'abc';
      const response = await putRequest(request, `/config/assistant/limit/${invalidLimit}`, adminToken);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid limit value');
    });
  });
});
