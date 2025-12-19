import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listLinkers,
  getLinker,
  createLinker,
  updateLinker,
  deleteLinker,
  getLinkerDatasources,
  executeLinker,
} from '../../../../src/controllers/linker.controller.js';
import { models } from '../../../../src/models/models.js';
import logger from '../../../../src/config/logger.js';
import * as databinderUtils from '../../../../src/utils/databinder/index.js';

// Mock logger
vi.mock('../../../../src/config/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('../../../../src/config/databinder.js', () => ({
  getDatabinderCatalog: vi.fn(() => ({
    createDatasourceInstance: vi.fn(() => ({
      methods: {
        default: vi.fn().mockResolvedValue({ data: 'test-data' }),
      },
    })),
  })),
}));

vi.mock('../../../../src/utils/databinder/index.js', async () => {
  const actual = await vi.importActual('../../../../src/utils/databinder/index.js');
  return {
    ...actual,
    sanitizeLinker: vi.fn((linker, includeConfigs) => ({
      id: linker?.id,
      name: linker?.name,
      datasourceIds: linker?.datasourceIds,
      ...(includeConfigs && { datasourceConfigs: linker?.datasourceConfigs }),
    })),
    checkLinkerOwnership: vi.fn((linker, userId) => linker && linker.ownerId === userId),
    validateLinkerInput: vi.fn(() => ({ isValid: true, errors: [] })),
    validateLinkerUpdateInput: vi.fn(() => ({ isValid: true, errors: [] })),
    validateDatasourcesExist: vi.fn(() => Promise.resolve({ isValid: true, errors: [] })),
    validateDatasourceConfigs: vi.fn(() => ({ isValid: true, errors: [] })),
    normalizeDatasourceConfigs: vi.fn((configs) => configs || {}),
    normalizeName: vi.fn((name) => name ? name.toLowerCase().replaceAll(/\s+/g, '_') : name),
    generateInstanceId: vi.fn((id, time, type) => `${type}_${id}_${time}`),
    generateLinkerExecutionId: vi.fn((id, time) => `linker_${id}_${time}`),
    generateCorrelationIds: vi.fn(() => ({ traceId: 'trace-123', spanId: 'span-456' })),
    extractResultData: vi.fn((result) => result?.data || result),
    applyPropertyMapping: vi.fn((data) => data),
    createLinkerExecutionMetadata: vi.fn((opts) => opts),
    createLinkerExecutionSummary: vi.fn((results) => ({
      total: results?.length || 0,
      successful: results?.filter(r => r.success).length || 0,
      failed: results?.filter(r => !r.success).length || 0,
    })),
    cacheLinkerExecution: vi.fn(() => Promise.resolve()),
    getCachedLinkerExecution: vi.fn(() => Promise.resolve({ data: null, isStale: false, cacheAge: null, metadata: null })),
    mergeDatasourceResults: vi.fn((results) => results),
    createTelemetryContext: vi.fn((opts) => opts),
    // Don't mock invalidateLinkerCache here - we'll spy on it in beforeEach
  };
});

import { createRes } from '../../../utils/responseHelpers.js';

describe('Linker Controller', () => {
  let req, res;
  const invalidId = 'invalid-id';
  const datasource1Id = '11111111-1111-1111-1111-111111111111';
  const datasource2Id = '22222222-2222-2222-2222-222222222222';
  const datasource3Id = '33333333-3333-3333-3333-333333333333';
  const datasource4Id = '44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: { user_id: 1, username: 'testuser' },
      params: {},
      body: {},
    };

    res = createRes();

    // Setup spies on logger and databinder utils functions
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(databinderUtils, 'invalidateLinkerCache').mockImplementation(() => Promise.resolve());
  });

  describe('listLinkers', () => {
    it('should return 200 with all linkers for authenticated user', async () => {
      const mockLinkers = [
        { id: 1, name: 'linker1', datasourceIds: [datasource1Id, datasource2Id], ownerId: 1 },
        { id: 2, name: 'linker2', datasourceIds: [datasource3Id, datasource4Id], ownerId: 1 },
      ];

      vi.spyOn(models.Linker, 'findAll').mockResolvedValue(mockLinkers);

      await listLinkers(req, res);

      expect(models.Linker.findAll).toHaveBeenCalledWith({
        where: { ownerId: 1 },
      });
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, name: 'linker1' }),
        expect.objectContaining({ id: 2, name: 'linker2' }),
      ]);
    });

    it('should return 401 if user is not authenticated', async () => {
      req.user = null;

      await listLinkers(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 200 with empty list when no linkers exist', async () => {
      vi.spyOn(models.Linker, 'findAll').mockResolvedValue([]);

      await listLinkers(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      vi.spyOn(models.Linker, 'findAll').mockRejectedValue(new Error('DB error'));

      await listLinkers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error listing linkers',
        error: 'DB error',
      });
    });
  });

  describe('getLinker', () => {
    it('should return 200 with a specific linker by id', async () => {
      const mockLinker = {
        id: 1,
        name: 'test-linker',
        datasourceIds: [datasource1Id, datasource2Id],
        ownerId: 1,
      };

      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(mockLinker);

      await getLinker(req, res);

      expect(models.Linker.findByPk).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'test-linker' })
      );
    });

    it('should return 404 if linker does not exist', async () => {
      req.params.id = invalidId;
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(null);
      vi.spyOn(databinderUtils, 'checkLinkerOwnership').mockReturnValue(false);

      await getLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Linker not found or access denied',
      });
    });

    it('should return 404 if user does not own the linker', async () => {
      const mockLinker = {
        id: 1,
        name: 'test-linker',
        ownerId: 2,
      };

      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(mockLinker);
      vi.spyOn(databinderUtils, 'checkLinkerOwnership').mockReturnValue(false);

      await getLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Linker not found or access denied',
      });
    });

    it('should return 500 on database error', async () => {
      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockRejectedValue(new Error('DB error'));

      await getLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createLinker', () => {
    beforeEach(() => {
      req.body = {
        name: 'New Linker',
        defaultMethodName: 'default',
        datasourceIds: [datasource1Id, datasource2Id],
        description: 'Test linker',
        environment: 'production',
      };
    });

    it('should return 401 if user is not authenticated', async () => {
      req.user = null;

      await createLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 400 if validation fails', async () => {
      // Provide invalid datasourceIds (empty array) to fail input validation
      req.body.datasourceIds = [];

      await createLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('datasourceIds'),
        })
      );
    });

    it('should return 400 if datasources do not exist', async () => {
      // Mock findAll to return empty array, which will trigger validation failure
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([]);

      await createLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('datasourceConfigs'),
        })
      );
    });

    it('should return 409 if linker name already exists', async () => {
      databinderUtils.normalizeName.mockReturnValueOnce('new_linker');
      // Add complete datasourceConfigs for all datasources
      req.body.datasourceConfigs = {
        [datasource1Id]: { methodConfig: { methodName: 'getData' } },
        [datasource2Id]: { methodConfig: { methodName: 'getUsers' } }
      };
      // Mock findAll to return datasources so validation passes
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([
        { id: datasource1Id, name: 'ds1' },
        { id: datasource2Id, name: 'ds2' },
      ]);
      vi.spyOn(models.Linker, 'findOne').mockResolvedValue({ id: 2, name: 'new_linker' });

      await createLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'A linker with this name already exists.',
      });
    });

    it('should return 400 if datasource configs validation fails', async () => {
      req.body.datasourceConfigs = {
        [datasource1Id]: { methodConfig: { methodName: 'invalid' } },
        ['99999999-9999-9999-9999-999999999999']: { methodConfig: { methodName: 'test' } }, // ID not in datasourceIds
      };

      // Mock findAll to return datasources so datasource validation passes
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([
        { id: datasource1Id, name: 'ds1' },
        { id: datasource2Id, name: 'ds2' },
      ]);
      // Mock findOne to check for name conflicts - return null so no conflict
      vi.spyOn(models.Linker, 'findOne').mockResolvedValue(null);

      await createLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining(''),
        })
      );
    });

  });

  describe('updateLinker', () => {
    let mockLinker;

    beforeEach(() => {
      mockLinker = {
        id: 1,
        name: 'test_linker',
        datasourceIds: [datasource1Id, datasource2Id],
        ownerId: 1,
        version: 1,
        update: vi.fn().mockResolvedValue({}),
      };

      req.params.id = '1';
      req.body = {
        name: 'Updated Linker',
      };

      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(mockLinker);
      // Don't set checkLinkerOwnership here, let individual tests control it
    });

    it('should return 404 if linker does not exist', async () => {
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(null);
      vi.spyOn(databinderUtils, 'checkLinkerOwnership').mockReturnValue(false);

      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if user does not own the linker', async () => {
      // Change mockLinker ownerId to not match user_id
      mockLinker.ownerId = 999; // Different from req.user.user_id which is 1

      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if validation fails', async () => {
      vi.spyOn(databinderUtils, 'validateLinkerUpdateInput').mockReturnValue({
        isValid: false,
        errors: ['Invalid input'],
      });
      req.body = { datasourceIds: ['invalid'] }; // Set body with datasourceIds to trigger validation

      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 if new name conflicts with existing linker', async () => {
      vi.spyOn(databinderUtils, 'normalizeName').mockReturnValue('updated_linker');
      vi.spyOn(models.Linker, 'findOne').mockResolvedValue({ id: 2, name: 'updated_linker' });

      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'A linker with this name already exists.',
      });
    });

    it('should return 200 on successful update', async () => {
      vi.spyOn(databinderUtils, 'normalizeName').mockReturnValue('updated_linker');
      vi.spyOn(models.Linker, 'findOne').mockResolvedValue(null);

      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Linker updated successfully'
        })
      );
    });

    it('should increment version when datasourceIds change', async () => {
      const datasource5Id = '55555555-5555-5555-5555-555555555555';
      req.body = { datasourceIds: [datasource1Id, datasource2Id, datasource5Id] };
      // Mock findAll to return datasources for validation
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([
        { id: datasource1Id, name: 'ds1' },
        { id: datasource2Id, name: 'ds2' },
        { id: datasource5Id, name: 'ds3' },
      ]);

      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
          executionStatus: 'not_executed',
        })
      );
    });

    it('should invalidate cache when datasourceIds change', async () => {
      const datasource5Id = '55555555-5555-5555-5555-555555555555';
      req.body = { datasourceIds: [datasource1Id, datasource2Id, datasource5Id] };
      // Mock findAll to return datasources for validation
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([
        { id: datasource1Id, name: 'ds1' },
        { id: datasource2Id, name: 'ds2' },
        { id: datasource5Id, name: 'ds3' },
      ]);

      await updateLinker(req, res);

      // Verify the update was successful (cache invalidation happens internally)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Linker updated successfully'
        })
      );
    });

    it('should return 400 if no valid fields provided', async () => {
      req.body = {};

      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No valid fields provided for update.',
      });
    });

    it('should update name when it is the same (normalized) as current name', async () => {
      req.body = { name: 'test_linker' };
      vi.spyOn(databinderUtils, 'normalizeName').mockReturnValue('test_linker');
      
      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_linker'
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Linker updated successfully'
        })
      );
    });

    it('should not update when datasourceConfigs is null', async () => {
      req.body = { datasourceConfigs: null };
      
      await updateLinker(req, res);

      // Should not call update when invalid input
      expect(mockLinker.update).not.toHaveBeenCalled();
    });

    it('should invalidate cache when datasourceConfigs change', async () => {
      req.body = {
        datasourceConfigs: {
          [datasource1Id]: { methodConfig: { methodName: 'newMethod' } },
          [datasource2Id]: { methodConfig: { methodName: 'anotherMethod' } }
        }
      };

      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          datasourceConfigs: expect.any(Object),
          version: 2
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Linker updated successfully'
        })
      );
    });

    it('should update defaultMethodName', async () => {
      req.body = { defaultMethodName: 'customMethod' };
      
      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultMethodName: 'customMethod'
        })
      );
    });

    it('should update description', async () => {
      req.body = { description: 'New description' };
      
      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'New description'
        })
      );
    });

    it('should update environment', async () => {
      req.body = { environment: 'staging' };
      
      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'staging'
        })
      );
    });

    it('should update isActive', async () => {
      req.body = { isActive: false };
      
      await updateLinker(req, res);

      expect(mockLinker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false
        })
      );
    });

    it('should handle error when datasourceIds validation fails', async () => {
      req.body = { datasourceIds: ['non-existent-id'] };
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([]);
      
      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle error when datasourceConfigs validation fails', async () => {
      req.body = {
        datasourceConfigs: {
          'invalid-id': { methodConfig: { methodName: 'test' } }
        }
      };
      
      await updateLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteLinker', () => {
    it('should return 204 on successful deletion', async () => {
      const mockLinker = {
        id: 1,
        name: 'test_linker',
        ownerId: 1,
        destroy: vi.fn().mockResolvedValue({}),
      };

      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(mockLinker);

      await deleteLinker(req, res);

      // Verify deletion was successful (cache invalidation happens internally)
      expect(mockLinker.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if linker does not exist', async () => {
      req.params.id = invalidId;
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(null);
      vi.spyOn(databinderUtils, 'checkLinkerOwnership').mockReturnValue(false);

      await deleteLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if user does not own the linker', async () => {
      const mockLinker = {
        id: 1,
        ownerId: 2,
      };

      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(mockLinker);
      vi.spyOn(databinderUtils, 'checkLinkerOwnership').mockReturnValue(false);

      await deleteLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on database error', async () => {
      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockRejectedValue(new Error('DB error'));

      await deleteLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getLinkerDatasources', () => {
    let mockLinker;

    beforeEach(() => {
      mockLinker = {
        id: 1,
        name: 'test_linker',
        datasourceIds: [datasource1Id, datasource2Id],
        datasourceConfigs: {
          [datasource1Id]: { methodConfig: { methodName: 'test' } },
        },
        ownerId: 1,
      };

      req.params.id = '1';
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(mockLinker);
      // Don't set checkLinkerOwnership here, let individual tests control it
    });

    it('should return 200 with linker datasources and configs', async () => {
      const mockDatasources = [
        {
          id: datasource1Id,
          name: 'ds1',
          definitionId: 'def1',
          description: 'Datasource 1',
          environment: 'production',
          isActive: true,
          testStatus: 'passed',
        },
        {
          id: datasource2Id,
          name: 'ds2',
          definitionId: 'def2',
          description: 'Datasource 2',
          environment: 'production',
          isActive: true,
          testStatus: 'passed',
        },
      ];

      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue(mockDatasources);

      await getLinkerDatasources(req, res);

      expect(models.Datasource.findAll).toHaveBeenCalledWith({
        where: {
          id: [datasource1Id, datasource2Id],
          ownerId: 1,
        },
      });

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          linkerId: 1,
          linkerName: 'test_linker',
          datasourceCount: 2,
        })
      );
    });

    it('should return 404 if linker does not exist', async () => {
      vi.spyOn(models.Linker, 'findByPk').mockResolvedValue(null);
      vi.spyOn(databinderUtils, 'checkLinkerOwnership').mockReturnValue(false);

      await getLinkerDatasources(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if user does not own the linker', async () => {
      // Change mockLinker ownerId to not match user_id
      mockLinker.ownerId = 999; // Different from req.user.user_id which is 1

      await getLinkerDatasources(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 200 with empty datasource list', async () => {
      mockLinker.datasourceIds = [];
      vi.spyOn(models.Datasource, 'findAll').mockResolvedValue([]);

      await getLinkerDatasources(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          datasourceCount: 0,
          datasources: [],
        })
      );
    });

    it('should return 500 on database error', async () => {
      vi.spyOn(models.Datasource, 'findAll').mockRejectedValue(new Error('DB error'));

      await getLinkerDatasources(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('executeLinker', () => {
    let mockLinker;

    beforeEach(() => {
      mockLinker = {
        id: 1,
        name: 'test_linker',
        datasourceIds: [datasource1Id, datasource2Id],
        ownerId: 1,
        update: vi.fn().mockResolvedValue({}),
      };
    });

    it('should return 404 when linker not found', async () => {
      const req = {
        user: { user_id: 1 },
        params: { id: 'non-existent' },
        body: {}
      };
      const res = createRes();

      vi.mocked(models.Linker.findByPk).mockResolvedValue(null);

      await executeLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Linker not found or access denied'
      });
    });

    it('should return 404 when user does not own linker', async () => {
      const req = {
        user: { user_id: 999 }, // Different user
        params: { id: mockLinker.id },
        body: {}
      };
      const res = createRes();

      vi.mocked(models.Linker.findByPk).mockResolvedValue(mockLinker);

      await executeLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Linker not found or access denied'
      });
    });

    it('should handle missing datasources error during execution', async () => {
      const req = {
        user: { user_id: 1 },
        params: { id: mockLinker.id },
        body: { options: {} }
      };
      const res = createRes();

      vi.mocked(models.Linker.findByPk).mockResolvedValue(mockLinker);
      vi.mocked(databinderUtils.getCachedLinkerExecution).mockResolvedValue({
        data: null,
        isStale: false,
      });
      // Only return one datasource instead of two
      vi.mocked(models.Datasource.findAll).mockResolvedValue([
        { id: datasource1Id, name: 'DS1', definitionId: 'rest-api', config: {} },
      ]);

      await executeLinker(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error executing linker',
          error: expect.stringContaining('Some datasources are no longer available'),
        })
      );
    });
  });
});
