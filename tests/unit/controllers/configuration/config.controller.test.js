import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as configurationController from '../../../../src/controllers/configuration.controller.js';
import * as endpointModule from '../../../../src/middleware/endpoint.js'; // Importa el módulo a mockear

describe('Configuration Controller', () => {
  let mockReq;
  let mockRes;
  let mockModels;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn(),
      send: vi.fn(),
    };
    mockModels = {
      Configuration: {
        findAll: vi.fn(),
        findOne: vi.fn(),
        update: vi.fn(),
      },
      Assistant: {
        findAll: vi.fn(),
      },
    };

    vi.resetAllMocks();
  });

  describe('getConfiguration', () => {

    it('should return 200 and all configurations on success', async () => {
      const mockConfigurations = [{ id: 1, endpoint: '/api/users' }, { id: 2, endpoint: '/api/products' }];
      mockModels.Configuration.findAll.mockResolvedValue(mockConfigurations);

      await configurationController.getConfiguration(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findAll).toHaveBeenCalledOnce();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockConfigurations);
    });

    it('should return 500 with an error message on failure', async () => {
      const errorMessage = 'Database error';
      mockModels.Configuration.findAll.mockRejectedValue(new Error(errorMessage));

      await configurationController.getConfiguration(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findAll).toHaveBeenCalledOnce();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: `Failed to get configuration, error: ${errorMessage}` });
    });
  });

  describe('getConfigurationByEndpoint', () => {

    it('should return 200 and the configuration if found', async () => {
      mockReq.body = { endpoint: '/api/test' };
      const mockConfiguration = { id: 3, endpoint: '/api/test', available: true };
      mockModels.Configuration.findOne.mockResolvedValue(mockConfiguration);

      await configurationController.getConfigurationByEndpoint(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/test' } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockConfiguration);
    });

    it('should return 404 if the configuration is not found', async () => {
      mockReq.body = { endpoint: '/non-existent' };
      mockModels.Configuration.findOne.mockResolvedValue(null);

      await configurationController.getConfigurationByEndpoint(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/non-existent' } });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration /non-existent not found' });
    });

    it('should return 500 with an error message on failure', async () => {
      mockReq.body = { endpoint: '/api/error' };
      const errorMessage = 'Database error';
      mockModels.Configuration.findOne.mockRejectedValue(new Error(errorMessage));

      await configurationController.getConfigurationByEndpoint(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/error' } });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: `Failed to get configuration, error: ${errorMessage}` });
    });
  });

  describe('updateConfiguration', () => {

    it('should return 200 and a success message if configuration is updated', async () => {
      mockReq.body = { endpoint: '/api/old', available: false };
      const mockConfiguration = { dataValues: { id: 4, endpoint: '/api/old', available: true } };
      mockModels.Configuration.findOne.mockResolvedValue(mockConfiguration);
      mockModels.Configuration.update.mockResolvedValue([1]);
      const mockUpdateConfigurationsCache = vi.fn().mockResolvedValue();
      vi.spyOn(endpointModule, 'updateConfigurationsCache').mockImplementation(mockUpdateConfigurationsCache);

      await configurationController.updateConfiguration(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/old' } });
      expect(mockModels.Configuration.update).toHaveBeenCalledWith(
        { endpoint: '/api/old', available: false },
        { where: { id: 4 } }
      );
      expect(mockUpdateConfigurationsCache).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration 4 updated successfully' });
    });

    it('should return 404 if the configuration to update is not found', async () => {
      mockReq.body = { endpoint: '/non-existent', available: true };
      mockModels.Configuration.findOne.mockResolvedValue(null);

      await configurationController.updateConfiguration(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/non-existent' } });
      expect(mockModels.Configuration.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration with endpoint /non-existent not found' });
    });

    it('should return 500 with an error message on failure', async () => {
      mockReq.body = { endpoint: '/api/error', available: true };
      mockModels.Configuration.findOne.mockRejectedValue(new Error('Database error'));

      await configurationController.updateConfiguration(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/error' } });
      expect(mockModels.Configuration.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to update configuration, error: Database error' });
    });
  });

  describe('getAssistantLimit', () => {

    it('should return 200 and the limit if configuration is found', async () => {
      const mockConfiguration = { dataValues: { limit: 5 } };
      mockModels.Configuration.findOne.mockResolvedValue(mockConfiguration);

      await configurationController.getAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ limit: 5 });
    });

    it('should return 404 if the configuration for /api/assistant is not found', async () => {
      mockModels.Configuration.findOne.mockResolvedValue(null);

      await configurationController.getAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration /api/assistant not found' });
    });

    it('should return 500 with an error message on failure', async () => {
      const errorMessage = 'Database error';
      mockModels.Configuration.findOne.mockRejectedValue(new Error(errorMessage));

      await configurationController.getAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: `Failed to get configuration, error: ${errorMessage}` });
    });
  });

  describe('updateAssistantLimit', () => {

    it('should return 200 and a success message if limit is updated', async () => {
      mockReq.params = { limit: '3' };
      mockModels.Assistant.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const mockConfiguration = { dataValues: { id: 5, limit: 2 } };
      mockModels.Configuration.findOne.mockResolvedValue(mockConfiguration);
      mockModels.Configuration.update.mockResolvedValue([1]);

      await configurationController.updateAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockModels.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockModels.Configuration.update).toHaveBeenCalledWith(
        { endpoint: '/api/assistant', limit: '3' },
        { where: { id: 5 } }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Limit updated successfully' });
    });

    it('should return 404 if the configuration for /api/assistant is not found', async () => {
      mockReq.params = { limit: '3' };
      mockModels.Configuration.findOne.mockResolvedValue(null);

      await configurationController.updateAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockModels.Assistant.findAll).not.toHaveBeenCalled();
      expect(mockModels.Configuration.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration undefined not found' });
    });

    it('should return 400 if the new limit is less than the current number of assistants', async () => {
      mockReq.params = { limit: '1' };
      mockModels.Assistant.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { id: 6 } });

      await configurationController.updateAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Limit cannot be less than the number of assistants' });
      expect(mockModels.Configuration.update).not.toHaveBeenCalled();
    });

    it('should return 400 if the new limit is less than 1', async () => {
      mockReq.params = { limit: '0' };
      mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { id: 7 } });
      mockModels.Assistant.findAll.mockResolvedValue([]);

      await configurationController.updateAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Limit cannot be less than 1' });
      expect(mockModels.Configuration.update).not.toHaveBeenCalled();
    });

    it('should return 500 with an error message on failure', async () => {
      mockReq.params = { limit: '3' };
      mockModels.Configuration.findOne.mockRejectedValue(new Error('Database error'));

      await configurationController.updateAssistantLimit(mockReq, mockRes, mockModels);

      expect(mockModels.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockModels.Assistant.findAll).not.toHaveBeenCalled();
      expect(mockModels.Configuration.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to update configuration, error: Database error' });
    });
  });
});
