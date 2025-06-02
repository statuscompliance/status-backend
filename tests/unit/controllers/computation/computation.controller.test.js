import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getComputations,
  getComputationsById,
  getComputationsByControlId,
  getComputationsByControlIdAndCreationDate,
  setComputeIntervalBytControlIdAndCreationDate,
  createComputation,
  bulkCreateComputations,
  deleteComputations,
  deleteComputationByControlId,
} from '../../../../src/controllers/computation.controller.js';
import { models } from '../../../../src/models/models.js';
import * as utils from '../../../../src/utils/checkRequiredProperties.js';
import * as complianceUtils from '../../../../src/utils/calculateCompliance.js';
import { Op } from 'sequelize';
import nodered from '../../../../src/config/nodered.js';
import { mockController } from '../../../utils/mockController.js';
import { createComputationExample } from '../../../utils/createComputationExample.js';
import redis from '../../../../src/config/redis.js';

// --- Helpers ---
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
}

describe('Computation Controller', () => {
  let res;

  let mockComputations;

  const invalidId = 'invalidId';
  const controlId = 'controlId';

  const mockComputation1 = createComputationExample({
    computationGroup: 'computationGroupId',
  });
  const mockComputation2 = createComputationExample({
    id: 'computationId2',
    computationGroup: 'computationGroupId2',
    controlId: controlId,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    res = createRes();
    mockComputations = [mockComputation1, mockComputation2];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // getComputations
  describe('getComputations', () => {
    it('should return 200 with an empty list', async () => {
      mockController(models.Computation, 'findAll', mockComputations);

      await getComputations(null, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockComputations);
    });
    it('should return 500 on error', async () => {
      const error = new Error('Database down');
      mockController(models.Computation, 'findAll', null, error);

      await getComputations(null, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: `Failed to get computations, error: ${error.message}`,
      });
    });
    
  });

  describe('getComputationsById', () => {
    it('should return 404 if control does not exist', async () => {
      mockController(models.Computation, 'findAll', []);
      await getComputationsById({ params: { id: invalidId } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Computations not found',
      });
    });
    it('should return 202 if ready not yet', async () => {
      mockController(models.Computation, 'findAll', mockComputations);

      vi.spyOn(redis, 'get').mockReturnValue('false');

      await getComputationsById(
        { params: mockComputation2.computationGroup },
        res
      );

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not ready yet' });
    });

    it('should return 200 and computations with compliance', async () => {
      mockController(models.Computation, 'findAll', [mockComputation1]);
      vi.spyOn(redis, 'get').mockResolvedValueOnce('true');

      vi.spyOn(complianceUtils, 'calculateCompliance').mockReturnValue([
        { ...mockComputation1, compliant: true },
      ]);

      await getComputationsById({ params: { id: 'someGroupId' } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        code: 200,
        message: 'OK',
        computations: [{ ...mockComputation1, compliant: true }],
      });
    });
    it('should return 500 on error', async () => {
      const error = new Error('Database down');
      mockController(models.Computation, 'findAll', null, error);

      await getComputationsById({ params: { id: 'groupId' } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: `Failed to get computation, error: ${error.message}`,
      });
    });
  });
  describe('getComputationsByControlId', () => {
    it('should return 200 and computations with compliance', async () => {
      mockController(models.Computation, 'findAll', [mockComputation2]);

      await getComputationsByControlId(
        { params: mockComputation2.controlId },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([mockComputation2]);
    });
    it('should return 500 if there is an error in the database call', async () => {
      const error = new Error('DB error');
      mockController(models.Computation, 'findAll', null, error);

      await getComputationsByControlId({ params: { controlId } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: `Failed to get computations, error: ${error.message}`,
      });
    });
  });
  describe('getComputationsByControlIdAndCreationDate', () => {
    it('should return 200 with computations filtered by controlId and createdAt', async () => {
      const createdAt = '2025-05-02';
      const req = { params: { controlId, createdAt } };

      const startOfDay = new Date(createdAt);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(createdAt);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const spy = mockController(models.Computation, 'findAll', mockComputation2);
      await getComputationsByControlIdAndCreationDate(req, res);

      expect(spy).toHaveBeenCalledWith({
        where: {
          controlId,
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockComputation2);
    });

    it('should return 200 with empty array if no computations found', async () => {
      const req = { params: mockComputation1 };
      mockController(models.Computation, 'findAll', []);

      await getComputationsByControlIdAndCreationDate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 if there is a database error', async () => {
      const req = { params: mockComputation1 };
      const error = new Error('DB Error');
      mockController(models.Computation, 'findAll', null, error);

      await getComputationsByControlIdAndCreationDate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: `Failed to get computations, error: ${error.message}`,
      });
    });
  });
  describe('setComputeIntervalBytControlIdAndCreationDate', () => {
    const from = '2025-05-01T00:00:00.000Z';
    const controlId = 'some-valid-id';
    const reqBase = {
      params: { controlId },
      body: {
        from: '2025-05-02T00:00:00.000Z',
        to: '2025-05-02T23:59:59.999Z',
      },
    };

    it('should return 400 if from or to is missing', async () => {
      const reqMissing = { ...reqBase, body: { from } }; // Not 'to' query param
      await setComputeIntervalBytControlIdAndCreationDate(reqMissing, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: '"from" and "to" are required in body',
      });
    });

    it('should return 404 if no computations are updated', async () => {
      mockController(models.Computation, 'update', [0]);
      await setComputeIntervalBytControlIdAndCreationDate(reqBase, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No computations found for the given controlId',
      });
    });

    it('should return 204 if computations are updated successfully', async () => {
      const updatedCount = 5
      mockController(models.Computation, 'update', [updatedCount]);
      await setComputeIntervalBytControlIdAndCreationDate(reqBase, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ message: `${updatedCount} computations updated.` });
    });

    it('should return 500 if update fails', async () => {

      const error = new Error('Update failed');
      vi.spyOn(models.Computation, 'update').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      mockController(models.Computation, 'update', mockComputation2, error);
      await setComputeIntervalBytControlIdAndCreationDate(reqBase, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: error.message,
      });
    });
  });
  describe('createComputation', () => {
    let req;
    beforeEach(async () => {
      req = {
        body: {
          metric: {
            endpoint: 'mock-endpoint',
            params: { key: 'value' },
            window: {
              start: '2024-01-01',
              end: '2024-01-02',
            },
            scope: 'user',
          },
          config: {
            backendUrl: 'http://localhost',
          },
        },
        cookies: {
          accessToken: 'mock-token',
        },
      };
    });
    it('should return 201 and computation url on success', async () => {
      const UUID_PATTERN = '[0-9a-fA-F-]{36}';
      const COMPUTATION_URL_REGEX = new RegExp(`^undefined/computations/${UUID_PATTERN}$`);

      vi.spyOn(nodered, 'post').mockResolvedValue({ status: 200 });

      await createComputation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        code: 201,
        message: 'OK',
        computation: expect.stringMatching(COMPUTATION_URL_REGEX),
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      const invalidReq = {
        ...req,
        body: {
          metric: { params: {} }, // missing endpoint
          config: {},
        },
      };
  
      await createComputation(invalidReq, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('endpoint'),
        })
      );
    });
    
    it('should return 400 if Node-RED responds with non-200 status', async () => {
      vi.spyOn(nodered, 'post').mockResolvedValue({ status: 500 });
  
      await createComputation(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong when calling Node-RED',
      });
    });
    it('should return 500 if an exception is thrown', async () => {
      vi.spyOn(nodered, 'post').mockRejectedValue(new Error('Connection failed'));
  
      await createComputation(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create computation, error: Connection failed',
      });
    });
  });
  // bulkCreateComputations
  describe('bulkCreateComputations', () => {
    it('should return 400 if computations is not an array or empty', async () => {
      const req = { body: { computations: null } };

      await bulkCreateComputations(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid computations',
      });
    });  
    it('should return 400 if required fields are missing', async () => {
      const req = { body: { computations: mockComputations } };
   
      vi.spyOn(utils, 'checkRequiredProperties').mockReturnValue({
        validation: false,
        textError: 'Missing computationGroup',
      });
  
      await bulkCreateComputations(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing computationGroup',
      });
    });

    it('should create computations and return 201', async () => {
      const req = { body: { computations: mockComputations } };
  
      vi.spyOn(utils, 'checkRequiredProperties').mockReturnValue({
        validation: true,
      });
      mockController(models.Computation, 'bulkCreate', mockComputations);
  
      await bulkCreateComputations(req, res);
  
      expect(models.Computation.bulkCreate).toHaveBeenCalledWith(mockComputations);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockComputations);
    });
    
    it('should set redis key if done is true', async () => {
      const req = {
        body: {
          computations: mockComputations,
          done: true,
        },
      };
  
      vi.spyOn(utils, 'checkRequiredProperties').mockReturnValue({
        validation: true,
      });
      mockController(models.Computation, 'bulkCreate', mockComputations);
      const redisSetSpy = vi.spyOn(redis, 'set').mockResolvedValue();
  
      await bulkCreateComputations(req, res);
  
      expect(redisSetSpy).toHaveBeenCalledWith('computationGroupId', true);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockComputations);
    });
 
    it('should return 500 if an error occurs', async () => {
      const req = { body: { computations: mockComputations } };
  
      vi.spyOn(utils, 'checkRequiredProperties').mockReturnValue({ validation: true });
      mockController(models.Computation, 'bulkCreate', mockComputations, new Error('DB error'));
  
      await bulkCreateComputations(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Failed to create computations'),
      });
    });
  });
  describe('deleteComputations', () => {
    it('should delete all computations and return 204', async () => {
      
      mockController(models.Computation, 'destroy', 1); // 1 row deleted

      const req = {};
      await deleteComputations(req, res);
  
      expect(models.Computation.destroy).toHaveBeenCalledWith({ where: {} });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
  
    it('should handle errors and return 500', async () => {

      mockController(models.Computation, 'destroy', 1, new Error('DB error'));

      const req = {};
      await deleteComputations(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Failed to delete computations'),
      });
    });
  });
  
  describe('deleteComputationByControlId', () => {
    it('should delete computations by controlId and return 204', async () => {
      const req = { params: { controlId: 'test-control-id' } };
  
      mockController(models.Computation, 'destroy', 1); // 1 row deleted
  
      await deleteComputationByControlId(req, res);
  
      expect(models.Computation.destroy).toHaveBeenCalledWith({
        where: { controlId: 'test-control-id' },
      });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
    it('should return 404 if no computations are found', async () => {
      const req = { params: { controlId: 'nonexistent-id' } };
      vi.spyOn(models.Computation, 'destroy').mockResolvedValue(0); // No rows deleted
  
      await deleteComputationByControlId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No computations found to delete',
      });
    });
    it('should handle errors and return 500', async () => {
      const req = { params: { controlId: 'test-control-id' } };
  
      mockController(models.Computation, 'destroy', 1, new Error('DB error'));
  
      await deleteComputationByControlId(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Failed to delete computation'),
      });
    });
  });
});
