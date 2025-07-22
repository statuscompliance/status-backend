import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDatasources,
  addDatasource
} from '../../../../src/controllers/datasource.controller.js';
import { mockController } from '../../../utils/mockController.js';
import { methods } from '../../../../src/config/grafana.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import crypto from 'crypto';

describe('Grafana: Datasource Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: { uid: '' },
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });


  describe('getDatasources', () => {
    it('should return 200 and the list of datasources', async () => {
      const mockData = [{ id: 1, name: 'Prometheus' }];

      mockController(methods.datasource, 'getDataSources', { data: mockData });

      await getDatasources(req, res);

      expect(methods.datasource.getDataSources).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should return 500 if Grafana API fails', async () => {
      const error = new Error('Grafana error');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.datasource, 'getDataSources', null, error);

      await getDatasources(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to retrieve datasources in Grafana');
    });
  });

  describe('addDatasource', () => {

    it('should return 201 when a datasource is successfully created', async () => {
      const fakeUID = 'mock-uid-123';
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(fakeUID);

      req.body = {
        access: 'proxy',
        basicAuth: false,
        database: 'metrics',
        isDefault: true,
        jsonData: { httpMethod: 'GET' },
        datasourceName: 'MySQL',
        type: 'mysql',
        url: 'http://localhost:3306',
        user: 'grafana',
      };

      const mockResponse = { data: { id: 10, name: 'MySQL' } };

      mockController(methods.datasource, 'addDataSource', { data: mockResponse });

      await addDatasource(req, res);

      expect(methods.datasource.addDataSource).toHaveBeenCalledWith(expect.objectContaining({
        name: 'MySQL',
        type: 'mysql',
        uid: fakeUID,
        user: 'grafana',
        withCredentials: true,
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should return 500 if Grafana fails to create the datasource', async () => {
      const error = new Error('Create failed');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.datasource, 'addDataSource', null, error);
      req.body = {
        datasourceName: 'FailingDS',
        type: 'postgres',
        url: 'https://broken',
      };

      await addDatasource(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to create datasource in Grafana');
    });
  });
});
