import { describe, it, expect, vi, beforeEach } from 'vitest';
import { models } from '../../../../src/models/models.js';
import * as configurationController from '../../../../src/controllers/configuration.controller.js';
import * as endpointModule from '../../../../src/middleware/endpoint.js';

vi.mock('../../../../src/middleware/endpoint.js');

const createRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn();
  return res;
};

const expectStatusAndJson = (res, status, json) => {
  expect(res.status).toHaveBeenCalledWith(status);
  expect(res.json).toHaveBeenCalledWith(json);
};

describe('Configuration Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = createRes();
    vi.clearAllMocks();
    vi.spyOn(endpointModule, 'updateConfigurationsCache').mockResolvedValue();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getConfiguration', () => {

    it('should return 200 and all configurations on success', async () => {
      const mockConfigurations = [{ id: 1, endpoint: '/api/users' }, { id: 2, endpoint: '/api/products' }];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);

      await configurationController.getConfiguration(mockReq, mockRes);

      expect(models.Configuration.findAll).toHaveBeenCalledOnce();
      expectStatusAndJson(mockRes, 200, mockConfigurations)
    });

    it('should return 200 and an empty array if no configurations exist', async () => {
      const mockConfigurations = [];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);

      await configurationController.getConfiguration(mockReq, mockRes);
      expect(models.Configuration.findAll).toHaveBeenCalledOnce();
      expectStatusAndJson(mockRes, 200, []);
    });

    it('should return 500 with an error message on failure', async () => {
      const errorMessage = 'Database error';
      vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error(errorMessage));

      await configurationController.getConfiguration(mockReq, mockRes); expect(models.Configuration.findAll).toHaveBeenCalledOnce();
      expectStatusAndJson(mockRes, 500, { message: `Failed to get configuration, error: ${errorMessage}` })
    });
  });

  describe('getConfigurationByEndpoint', () => {

    it('should return 200 and the configuration if found', async () => {
      mockReq.body = { endpoint: '/api/test' };
      const mockConfiguration = { id: 3, endpoint: '/api/test', available: true };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockConfiguration);

      await configurationController.getConfigurationByEndpoint(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/test' } });
      expectStatusAndJson(mockRes, 200, mockConfiguration);
    });

    it('should return 404 if the configuration is not found', async () => {
      mockReq.body = { endpoint: '/non-existent' };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

      await configurationController.getConfigurationByEndpoint(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/non-existent' } });
      expectStatusAndJson(mockRes, 404, { message: 'Configuration /non-existent not found' });
    });

    it('should return 500 with an error message on failure', async () => {
      mockReq.body = { endpoint: '/api/error' };
      const errorMessage = 'Database error';
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error(errorMessage));

      await configurationController.getConfigurationByEndpoint(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/error' } });
      expectStatusAndJson(mockRes, 500, { message: `Failed to get configuration, error: ${errorMessage}` });
    });
  });

  describe('updateConfiguration', () => {

    it('should return 404 if the configuration to update is not found', async () => {
      mockReq.body = { endpoint: '/non-existent', available: true };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

      await configurationController.updateConfiguration(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/non-existent' } });
      expectStatusAndJson(mockRes, 404, { message: 'Configuration with endpoint /non-existent not found' });
    });

    it('should return 400 if the request body is missing the endpoint', async () => {
      mockReq.body = { available: true };
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error('Database error'));

      await configurationController.updateConfiguration(mockReq, mockRes);
      expect(models.Configuration.findOne).not.toHaveBeenCalled();
      expect(endpointModule.updateConfigurationsCache).not.toHaveBeenCalled();
      expectStatusAndJson(mockRes, 400, { message: 'Endpoint is required' });
    });

    it('should return 400 if the request body is empty', async () => {
      mockReq.body = {};
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error('Database error'));

      await configurationController.updateConfiguration(mockReq, mockRes);
      expect(models.Configuration.findOne).not.toHaveBeenCalled();
      expect(endpointModule.updateConfigurationsCache).not.toHaveBeenCalled();
      expectStatusAndJson(mockRes, 400, { message: 'Endpoint is required' });
    });

    it('should return 500 with an error message on database findOne failure', async () => {
      mockReq.body = { endpoint: '/api/error', available: true };
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error('Database error'));


      await configurationController.updateConfiguration(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/error' } });
      expectStatusAndJson(mockRes, 500, { message: 'Failed to update configuration, error: Database error' });
      expect(endpointModule.updateConfigurationsCache).not.toHaveBeenCalled();
    });

    it('should return 500 with an error message on database update failure', async () => {
      mockReq.body = { endpoint: '/api/old', available: false };
      const mockConfiguration = { dataValues: { id: 4, endpoint: '/api/old', available: true } };

      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockConfiguration)
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error('Database update error'));

      await configurationController.updateConfiguration(mockReq, mockRes);
      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/old' } });
      expect(endpointModule.updateConfigurationsCache).not.toHaveBeenCalled();
      expectStatusAndJson(mockRes, 500, { message: 'Failed to update configuration, error: Database update error' });
    });

    it('should return 200 even if update affects zero rows', async () => {
      mockReq.body = { endpoint: '/api/old', available: false };
      const mockConfiguration = { dataValues: { id: 4, endpoint: '/api/old', available: true } };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockConfiguration)
      vi.spyOn(models.Configuration, 'update').mockResolvedValue([0]);

      await configurationController.updateConfiguration(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/old' } });
      expect(models.Configuration.update).toHaveBeenCalledWith(
        { available: false },
        { where: { id: 4 } }
      );
      expectStatusAndJson(mockRes, 200, { message: 'No changes were applied to the configuration' });
    });

  });

  describe('getAssistantLimit', () => {

    it('should return 200 and the limit if configuration is found', async () => {
      const mockConfiguration = { dataValues: { limit: 5 } };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockConfiguration);

      await configurationController.getAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expectStatusAndJson(mockRes, 200, { limit: 5 });
    });

    it('should return 404 if the configuration for /api/assistant is not found', async () => {
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

      await configurationController.getAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expectStatusAndJson(mockRes, 404, { message: 'Configuration /api/assistant not found' });
    });

    it('should return 500 with an error message on failure', async () => {
      const errorMessage = 'Database error';
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error(errorMessage));

      await configurationController.getAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expectStatusAndJson(mockRes, 500, { message: `Failed to get configuration, error: ${errorMessage}` } );
    });

    it('should return 400 with "Assistant limit is not set" if limit is null', async () => {
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { limit: null } });

      await configurationController.getAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expectStatusAndJson(mockRes, 400, { message: 'Assistant limit is not set' });
    });

    it('should return 400 with "Assistant limit is not set" if limit is undefined', async () => {
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { limit: undefined } });

      await configurationController.getAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expectStatusAndJson(mockRes, 400, { message: 'Assistant limit is not set' });
    });
  });

  describe('updateAssistantLimit', () => {

    it('should return 200 and a success message if limit is updated', async () => {
      mockReq.params = { limit: '3' };
      const mockConfiguration = { dataValues: { id: 5, limit: 2 } };

      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }, { id: 2 }]);
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockConfiguration);
      vi.spyOn(models.Configuration, 'update').mockResolvedValue([1]);

      await configurationController.updateAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(models.Configuration.update).toHaveBeenCalledWith(
        { 'endpoint': '/api/assistant', 'limit': 3 },
        { 'where': { 'id': 5 }, }
      );
      expectStatusAndJson(mockRes, 200, { message: 'Limit updated successfully' });
    });

    it('should return 404 if the configuration for /api/assistant is not found', async () => {
      mockReq.params = { limit: '3' };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

      await configurationController.updateAssistantLimit(mockReq, mockRes);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).not.toHaveBeenCalled();
      expect(models.Configuration.update).not.toHaveBeenCalled();
      expectStatusAndJson(mockRes, 404, { message: 'Configuration undefined not found' });
    });

    it('should return 400 if the new limit is less than the current number of assistants', async () => {
      mockReq.params = { limit: '1' };
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }, { id: 2 }]);
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { id: 6 } });

      await configurationController.updateAssistantLimit(mockReq, mockRes);

      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(models.Configuration.update).not.toHaveBeenCalled();
      expectStatusAndJson(mockRes, 400, { message: 'Limit cannot be less than the number of assistants' });
    });

    it.each([
      ['abc', 'Invalid limit value'],
      ['0', 'Invalid limit value'],
      ['-5', 'Invalid limit value'],
      ['2.5', 'Invalid limit value'],
      [`${Number.MAX_SAFE_INTEGER + 1}`, 'Invalid limit value'],
      [null, 'Invalid limit value'],
      [undefined, 'Invalid limit value']])('should return 400 for invalid limit value: %s', async (invalidLimit, expectedMessage) => {
      mockReq.params.limit = invalidLimit;
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { id: 7 } });
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);

      await configurationController.updateAssistantLimit(mockReq, mockRes, models);
      expect(models.Assistant.findAll).not.toHaveBeenCalled();
      expect(models.Configuration.update).not.toHaveBeenCalled();
      expectStatusAndJson(mockRes, 400,{ message: expectedMessage });
    });

    it('should return 200 and the success message with the configuration ID when updated', async () => {
      mockReq.body = { endpoint: '/api/existing', available: true };
      const mockExistingConfiguration = { dataValues: { id: 10, endpoint: '/api/existing', available: false } };
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockExistingConfiguration);
      vi.spyOn(models.Configuration, 'update').mockResolvedValue([1]);

      await configurationController.updateConfiguration(mockReq, mockRes, models);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/existing' } });
      expect(models.Configuration.update).toHaveBeenCalledWith(
        { available: true },
        { where: { id: 10 } }
      );
      expectStatusAndJson(mockRes, 200, { message: 'Configuration 10 updated successfully' });
    });

    it('should return 200 even if update affects zero rows', async () => {
      mockReq.params = { limit: '3' };
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { id: 8, limit: 3 } });
      vi.spyOn(models.Configuration, 'update').mockResolvedValue([0]);

      await configurationController.updateAssistantLimit(mockReq, mockRes, models);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 with an error message on database failure', async () => {
      mockReq.params = { limit: '3' };
      vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(new Error('Database error'));

      await configurationController.updateAssistantLimit(mockReq, mockRes, models);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
