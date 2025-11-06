import { describe, it, vi, beforeEach, expect } from 'vitest';
import { createQuery, parseQuery } from '../../../../src/controllers/query.controller.js';
import * as sqlBuilder from '../../../../src/utils/sqlQueryBuilder.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';

const req = {};
const res = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
};

const supportedModels = [
  'Assistant',
  'Catalog',
  'Computation',
  'Configuration',
  'Control',
  'Datasource',
  'Linker',
  'Message',
  'Panel',
  'Point',
  'Scope',
  'Secret',
  'Thread',
  'User',
]

const fakeSQL = 'SELECT * FROM User;';

describe('Query Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuery', () => {
    it('should return 200 and SQL query when model is supported', async () => {
      req.body = {
        model: supportedModels[10],
        operation: 'findAll',
        options: {},
      };

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue(fakeSQL);

      await createQuery(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'SQL query created successfully',
        query: fakeSQL,
      });
    });
    it('should return 400 if model is not supported', async () => {
      req.body = {
        model: 'invalidModel',
        operation: 'findAll',
        options: {},
      };

      await createQuery(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Model not supported: invalidModel',
        supportedModels: supportedModels,
      });
    });

    it('should handle errors during SQL generation', async () => {
      req.body = {
        model: 'User',
        operation: 'findAll',
        options: {},
      };
      const error = new Error('SQL error');
      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockRejectedValue(error);
      const spy = vi.spyOn(errorHandler, 'handleControllerError');

      await createQuery(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to create SQL query');
    });
  });
  describe('parseQuery', () => {
    it('should return 200 and parsed SQL structure', async () => {
      req.body = { rawSql: fakeSQL};

      vi.spyOn(sqlBuilder, 'getSQLFromSequelize').mockResolvedValue(fakeSQL);

      await parseQuery(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'SQL query parsed successfully',
        sql: expect.objectContaining({
          table: 'User',
        }),
      });
    });

    it('should handle errors during SQL parsing', async () => {
      const error = new Error('Parse error');
      vi.spyOn(sqlBuilder, 'parseSQLQuery').mockImplementation(() => {
        throw error;
      });
      const spy = vi.spyOn(errorHandler, 'handleControllerError');

      req.body = { rawSql: 'INVALID SQL' };
      await parseQuery(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to parse SQL query');
    });
  });
});
