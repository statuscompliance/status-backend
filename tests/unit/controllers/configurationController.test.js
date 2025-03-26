import { describe, expect, it, vi } from 'vitest';
import * as configurationController from '../../../src/controllers/configuration.controller.js';
import models from '../../../src/models/models.js';
import { updateConfigurationsCache } from '../../../src/middleware/endpoint';

vi.mock('../../../src/middleware/endpoint', () => ({
  updateConfigurationsCache: vi.fn(),
}));

describe('getConfiguration', () => {
  let mockReq;
  let mockRes;
  let findAllSpy;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn(),
    };
    findAllSpy = vi.spyOn(models.Configuration, 'findAll');
  });

  afterEach(() => {
    findAllSpy.mockRestore();
  });

  it('should return all configurations with status 200', async () => {
    const mockConfigurations = [
      { endpoint: '/api/test1', available: true, limit: 1 },
      { endpoint: '/api/test2', available: false, limit: 5 },
    ];
    findAllSpy.mockResolvedValue(mockConfigurations);

    await configurationController.getConfiguration(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockConfigurations);
  });

  it('should return status 500 with error message if database query fails', async () => {
    const mockError = new Error('Database error');
    findAllSpy.mockRejectedValue(mockError);

    await configurationController.getConfiguration(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to get configuration, error: ${mockError.message}`,
    });
  });
});

describe('getConfigurationByEndpoint', () => {
  let mockReq;
  let mockRes;
  let findOneSpy;

  beforeEach(() => {
    mockReq = { body: { endpoint: '/api/test' } };
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn(),
    };
    findOneSpy = vi.spyOn(models.Configuration, 'findOne');
  });

  afterEach(() => {
    findOneSpy.mockRestore();
  });

  it('should return configuration for a given endpoint with status 200', async () => {
    const mockConfiguration = { endpoint: '/api/test', available: true, limit: 2 };
    findOneSpy.mockResolvedValue(mockConfiguration);

    await configurationController.getConfigurationByEndpoint(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockConfiguration);
  });

  it('should return status 404 if configuration for the endpoint is not found', async () => {
    findOneSpy.mockResolvedValue(null);
    mockReq.body.endpoint = '/nonexistent';

    await configurationController.getConfigurationByEndpoint(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration /nonexistent not found' });
  });

  it('should return status 500 with error message if database query fails', async () => {
    const mockError = new Error('Database error');
    findOneSpy.mockRejectedValue(mockError);

    await configurationController.getConfigurationByEndpoint(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to get configuration, error: ${mockError.message}`,
    });
  });
});

describe('updateConfiguration', () => {
  let mockReq;
  let mockRes;
  let findOneSpy;
  let updateSpy;

  beforeEach(() => {
    mockReq = { body: { endpoint: '/api/test', available: false } };
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn(),
    };
    findOneSpy = vi.spyOn(models.Configuration, 'findOne');
    updateSpy = vi.spyOn(models.Configuration, 'update');
  });

  afterEach(() => {
    findOneSpy.mockRestore();
    updateSpy.mockRestore();
  });

  it('should update configuration and return status 200', async () => {
    const mockConfigurationBeforeUpdate = { dataValues: { id: 1 }, endpoint: '/api/test', available: true, limit: 2 };
    findOneSpy.mockResolvedValue(mockConfigurationBeforeUpdate);
    updateSpy.mockResolvedValue([1]);

    await configurationController.updateConfiguration(mockReq, mockRes);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { endpoint: '/api/test' } });
    expect(updateSpy).toHaveBeenCalledWith(
      { endpoint: '/api/test', available: false },
      { where: { id: 1 } }
    );
    expect(updateConfigurationsCache).toHaveBeenCalledTimes(1);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration 1 updated successfully' });
  });

  it('should return status 404 if configuration to update is not found', async () => {
    findOneSpy.mockResolvedValue(null);
    mockReq.body.endpoint = '/nonexistent';

    await configurationController.updateConfiguration(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration undefined not found' });
  });

  it('should return status 500 with error message if findOne fails', async () => {
    const mockError = new Error('Database error');
    findOneSpy.mockRejectedValue(mockError);

    await configurationController.updateConfiguration(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to update configuration, error: ${mockError.message}`,
    });
  });

  it('should return status 500 with error message if update fails', async () => {
    const mockConfigurationBeforeUpdate = { dataValues: { id: 1 }, endpoint: '/api/test', available: true, limit: 2 };
    findOneSpy.mockResolvedValue(mockConfigurationBeforeUpdate);
    const mockError = new Error('Update failed');
    updateSpy.mockRejectedValue(mockError);

    await configurationController.updateConfiguration(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to update configuration, error: ${mockError.message}`,
    });
  });
});

describe('getAssistantLimit', () => {
  let mockReq;
  let mockRes;
  let findOneSpy;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn(),
    };
    findOneSpy = vi.spyOn(models.Configuration, 'findOne');
  });

  afterEach(() => {
    findOneSpy.mockRestore();
  });

  it('should return assistant limit with status 200', async () => {
    const mockConfiguration = { dataValues: { limit: 5 } };
    findOneSpy.mockResolvedValue(mockConfiguration);

    await configurationController.getAssistantLimit(mockReq, mockRes);

    expect(findOneSpy).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ limit: 5 });
  });

  it('should return status 404 if /api/assistant configuration is not found', async () => {
    findOneSpy.mockResolvedValue(null);

    await configurationController.getAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration /api/assistant not found' });
  });

  it('should return status 500 with error message if database query fails', async () => {
    const mockError = new Error('Database error');
    findOneSpy.mockRejectedValue(mockError);

    await configurationController.getAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to get configuration, error: ${mockError.message}`,
    });
  });
});

describe('updateAssistantLimit', () => {
  let mockReq;
  let mockRes;
  let findOneSpy;
  let updateSpy;
  let findAllAssistantsSpy;

  beforeEach(() => {
    mockReq = { params: { limit: '3' } };
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn(),
    };
    findOneSpy = vi.spyOn(models.Configuration, 'findOne');
    updateSpy = vi.spyOn(models.Configuration, 'update');
    findAllAssistantsSpy = vi.spyOn(models.Assistant, 'findAll');
  });

  afterEach(() => {
    findOneSpy.mockRestore();
    updateSpy.mockRestore();
    findAllAssistantsSpy.mockRestore();
  });

  it('should update assistant limit and return status 200', async () => {
    
    const mockConfigurationBeforeUpdate = { dataValues: { id: 1 } };
    findOneSpy.mockResolvedValue(mockConfigurationBeforeUpdate);
    updateSpy.mockResolvedValue([1]);
    findAllAssistantsSpy.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    await configurationController.updateAssistantLimit(mockReq, mockRes);

    expect(findAllAssistantsSpy).toHaveBeenCalledTimes(1);
    expect(findOneSpy).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
    expect(updateSpy).toHaveBeenCalledWith(
      { endpoint: '/api/assistant', limit: '3' },
      { where: { id: 1 } }
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Limit updated successfully' });
  });

  it('should return status 400 if new limit is less than the number of assistants', async () => {
    
    findAllAssistantsSpy.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockReq.params.limit = '1';
    findOneSpy.mockResolvedValue({ dataValues: { id: 1 } });

    await configurationController.updateAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Limit cannot be less than the number of assistants',
    });
  });

  it('should return status 400 if new limit is less than 1', async () => {

    mockReq.params.limit = '0';

    findOneSpy.mockResolvedValue({ dataValues: { id: 1 } });

    findAllAssistantsSpy.mockResolvedValue([]);

    await configurationController.updateAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Limit cannot be less than 1' });
  });

  it('should return status 404 if /api/assistant configuration is not found', async () => {
    
    findOneSpy.mockResolvedValue(null);
    findAllAssistantsSpy.mockResolvedValue([]);

    await configurationController.updateAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Configuration undefined not found' });
  });

  it('should return status 500 with error message if findOne fails', async () => {
    
    const mockError = new Error('Database error');
    findOneSpy.mockRejectedValue(mockError);
    findAllAssistantsSpy.mockResolvedValue([]);

    await configurationController.updateAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to update configuration, error: ${mockError.message}`,
    });
  });

  it('should return status 500 with error message if update fails', async () => {
    
    const mockConfigurationBeforeUpdate = { dataValues: { id: 1 } };
    findOneSpy.mockResolvedValue(mockConfigurationBeforeUpdate);
    const mockError = new Error('Update failed');
    updateSpy.mockRejectedValue(mockError);
    findAllAssistantsSpy.mockResolvedValue([]);

    await configurationController.updateAssistantLimit(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: `Failed to update configuration, error: ${mockError.message}`,
    });
  });
});