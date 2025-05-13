import {
  expect,
  describe,
  vi,
  it,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { sampleUser } from '../../utils/sampleUserData.js';
import { models } from '../../../src/models/models.js';
import { createComputationExample } from '../../utils/createComputationExample.js';
import { v4 as uuidv4 } from 'uuid';
import redis from '../../../src/config/redis.js';
import * as complianceUtil from '../../../src/utils/calculateCompliance.js';
import nodered from '../../../src/config/nodered.js';

const getResponse = (path, token) => {
  return request.get(path).set('Cookie', `accessToken=${token}`);
};

// Sample data
const nonExistingControlId = uuidv4();
const computation1 = createComputationExample();
const computation2 = createComputationExample();
const deleteComputation = createComputationExample();
const sampleComputation = [computation1, computation2, deleteComputation];

let getToken;

beforeAll(async () => {
  // Generate JWT for tests
  getToken = jwt.sign(
    {
      userId: sampleUser._id,
      username: sampleUser.username,
      authority: sampleUser.authority,
    },
    'test-secret-key'
  );
  // Seed database
  await models.Computation.bulkCreate(sampleComputation);
});
afterAll(async () => {
  // Clean up database
  await models.Computation.destroy({ where: {}, truncate: true });
});
// Global teardown after each mock
afterEach(() => vi.restoreAllMocks());

describe('Computation API Routes', () => {
  describe('GET /computations', () => {
    it('should return 200 and a list of all computations for an admin user', async () => {
      const response = await getResponse('/computations', getToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('value', true);
    });
  });
  describe('GET /computations/:id', () => {
    const path = (id) => `/computations/${id}`;
    it('should return 202 if computations aren’t ready', async () => {
      vi.spyOn(redis, 'get').mockResolvedValue('false');
      const response = await getResponse(
        path(computation1.computationGroup),
        getToken
      );
      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('message', 'Not ready yet');
    });
    it('should return 404 if no computations exist for the given id', async () => {
      const response = await getResponse(path(nonExistingControlId), getToken);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Computations not found');
    });
    it('should return 200 with computations by controlId', async () => {
      vi.spyOn(redis, 'get').mockResolvedValue('true');

      const complianceSpy = vi
        .spyOn(complianceUtil, 'calculateCompliance')
        .mockReturnValue(computation1);

      const response = await getResponse(
        path(computation1.computationGroup),
        getToken
      );
      expect(complianceSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            computationGroup: computation1.computationGroup,
          }),
        ])
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('computations', computation1);
    });
  });

  describe('POST /computations', () => {
    let noderedPostSpy;
    const basePayload = {
      metric: {
        endpoint: '/example',
        params: { param1: 'value1' },
        scope: 'global',
        window: { start: '2023-01-01', end: '2023-01-31' },
      },
      config: {
        backendUrl: 'http://localhost:3000',
      },
    };
    beforeEach(() => {
      // Mock Node-RED for POST tests
      noderedPostSpy = vi
        .spyOn(nodered, 'post')
        .mockResolvedValue({ status: 201, data: {} });
    });
    afterEach(() => {
      noderedPostSpy.mockRestore();
    });

    it('should return 201 after creating a computation', async () => {
      const response = await request
        .post('/computations')
        .set('Cookie', `accessToken=${getToken}`)
        .send(basePayload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('code', 201);
      expect(response.body).toHaveProperty('message', 'OK');
      expect(response.body).toHaveProperty('computation');
      // Check if the 'computation' property has the expected format:
      expect(response.body.computation).toMatch(
        /\/computations\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      ); // ending with '/computations/' followed by a UUID.
    });
    it('should return 400 if the metric object is missing in the payload', async () => {
      const payload = {
        config: {
          backendUrl: 'http://localhost:3000',
        },
      };

      const response = await request
        .post('/computations')
        .set('Cookie', `accessToken=${getToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Invalid object or missing required properties'
      );
    });

    it('should return 400 if the endpoint is missing in the metric object', async () => {
      const payload = {
        metric: {
          params: { param1: 'value1' },
        },
        config: {
          backendUrl: 'http://localhost:3000',
        },
      };

      const response = await request
        .post('/computations')
        .set('Cookie', `accessToken=${getToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Missing required properties: endpoint'
      );
    });
    it('should return 400 if the params is missing in the metric object', async () => {
      const payload = {
        metric: {
          endpoint: '/missing-params',
        },
        config: {
          backendUrl: 'http://localhost:3000',
        },
      };

      const response = await request
        .post('/computations')
        .set('Cookie', `accessToken=${getToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Missing required properties: params'
      );
    });
    it('should return 400 if Node-RED returns an error status', async () => {
      noderedPostSpy.mockResolvedValue({
        status: 400,
        data: { message: 'Node-RED error' },
      });
      const response = await request
        .post('/computations')
        .set('Cookie', `accessToken=${getToken}`)
        .send(basePayload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'message',
        'Something went wrong when calling Node-RED'
      );
    });
    it('should return 500 if there is an error during computation creation', async () => {
      
      noderedPostSpy.mockRejectedValue(new Error('Failed to get token'));
      
      const response = await request
        .post('/computations')
        .set('Cookie', `accessToken=${getToken}`)
        .send(basePayload);

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch(
        /^Failed to create computation, error: .*$/
      );
    });
  });

  describe('POST /computations/bulk', () => {
    it('should return 201 when bulk creating computations', async () => {
      const bulkPayload = {
        computations: [
          {
            ...createComputationExample(),
            computationGroup: uuidv4(),
          },
          {
            ...createComputationExample(),
            computationGroup: uuidv4(),
          },
        ],
        done: true,
      };

      const response = await request
        .post('/computations/bulk')
        .set('Cookie', `accessToken=${getToken}`)
        .send(bulkPayload);

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(bulkPayload.computations.length);
      response.body.forEach((computation, index) => {
        expect(computation).toHaveProperty(
          'computationGroup',
          bulkPayload.computations[index].computationGroup
        );
        expect(computation).toHaveProperty(
          'value',
          bulkPayload.computations[index].value
        );
        expect(computation).toHaveProperty(
          'scope',
          bulkPayload.computations[index].scope
        );
      });
    });
    it('should return 400 with invalid payload', async () => {
      const response = await request
        .post('/computations/bulk')
        .set('Cookie', `accessToken=${getToken}`)
        .send({ computations: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid computations');
    });
    it('should return 400 if computationGroup is missing in any computation', async () => {
      // Assuming checkRequiredProperties checks for 'computationGroup'
      const payload = {
        computations: [
          { value: true }, // Missing computationGroup
        ],
      };
      const response = await request
        .post('/computations/bulk')
        .set('Cookie', `accessToken=${getToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        'error',
        'Missing required properties: computationGroup'
      );
    });

    it('should return 500 if there is a database error during bulk creation', async () => {
      const payload = {
        computations: [
          {
            computationGroup: 'error-group',
            value: 1,
            metric: { endpoint: '/error-db' },
          },
        ],
      };

      const bulkCreateSpy = vi
        .spyOn(models.Computation, 'bulkCreate')
        .mockRejectedValue(new Error('Database error'));

      const response = await request
        .post('/computations/bulk')
        .set('Cookie', `accessToken=${getToken}`)
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to create computations, error: Database error'
      );

      bulkCreateSpy.mockRestore();
    });
  });
  describe('DELETE /computations', () => {
    it('should return 500 if there is a database error during deletion', async () => {
      const destroySpy = vi
        .spyOn(models.Computation, 'destroy')
        .mockRejectedValue(new Error('Database error during deletion'));

      const response = await request
        .delete('/computations')
        .set('Cookie', `accessToken=${getToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        'message',
        'Failed to delete computations, error: Database error during deletion'
      );

      destroySpy.mockRestore();
    });
    it('should return 204 and delete all computations', async () => {
      const initialCount = await models.Computation.count();
      expect(initialCount).toBeGreaterThan(0);

      const response = await request
        .delete('/computations')
        .set('Cookie', `accessToken=${getToken}`);
      expect(response.status).toBe(204);
      expect(response.body).toEqual({}); // 204 responses usually have an empty body

      const finalCount = await models.Computation.count();
      expect(finalCount).toBe(0);
    });
  });
});
