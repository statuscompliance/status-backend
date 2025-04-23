import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { models } from '../../../src/models/models.js'
import { updateConfigurationsCache, endpointAvailable, assistantlimitReached } from '../../../src/middleware/endpoint.js';

const mockReq = {
  url: '',
};
const mockRes = {
  status: vi.fn(() => mockRes),
  json: vi.fn(),
  send: vi.fn(),
};
const mockNext = vi.fn();

const expectNextCalled = () => {
  expect(mockNext).toHaveBeenCalledOnce();
  expect(mockRes.status).not.toHaveBeenCalled();
  expect(mockRes.json).not.toHaveBeenCalled();
  expect(mockRes.send).not.toHaveBeenCalled();
};

const expectResponseSent = (status, body = undefined) => {
  expect(mockNext).not.toHaveBeenCalled();
  expect(mockRes.status).toHaveBeenCalledWith(status);

  if (body !== undefined) {
    if (typeof body === 'object') {
      expect(mockRes.json).toHaveBeenCalledWith(body);
      expect(mockRes.send).not.toHaveBeenCalled();
    } else {
      expect(mockRes.send).toHaveBeenCalledWith(body);
      expect(mockRes.json).not.toHaveBeenCalled();
    }
  } else {
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  }
};

describe('Endpoint middleware tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateConfigurationsCache', () => {

    it('should call models.Configuration.findAll and update the cache', async () => {
      const mockConfigs = [
        { dataValues: { id: 1, endpoint: '/api/test1', available: true } },
        { dataValues: { id: 2, endpoint: '/api/test2', available: false } },
      ];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigs);

      await updateConfigurationsCache();

      expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    });

    it('should log an error if models.Configuration.findAll fails', async () => {
      const mockError = new Error('Database connection failed');
      vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(mockError);
      vi.spyOn(console, 'error').mockImplementation(() => { });

      await updateConfigurationsCache();

      expect(models.Configuration.findAll).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenCalledWith(mockError);
    });
  });

  describe('endpointAvailable middleware', () => {
    let mockConfigs;

    beforeEach(() => {
      vi.clearAllMocks();

      mockConfigs = [
        { dataValues: { id: 1, endpoint: '/api/public', available: true } },
        { dataValues: { id: 2, endpoint: '/api/private', available: false } },
        { dataValues: { id: 3, endpoint: '/api/partial', available: true } },
        { dataValues: { id: 4, endpoint: 'nested/path', available: true } },
      ];

      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigs);

      mockReq.url = '';
      mockRes.status.mockClear();
      mockRes.json.mockClear();
      mockRes.send.mockClear();
      mockNext.mockClear();
    });

    it('should call updateConfigurationsCache if configurationsCache is empty', async () => {
      mockReq.url = '/api/public';
      await endpointAvailable(mockReq, mockRes, mockNext);
      expect(models.Configuration.findAll).toHaveBeenCalledOnce();
      expectNextCalled();
    });

    it('should call next() if the endpoint matches an available configuration', async () => {
      mockReq.url = '/api/public';
      await endpointAvailable(mockReq, mockRes, mockNext);
      expectNextCalled();
    });

    it('should call next() if the endpoint includes a configured endpoint', async () => {
      mockReq.url = '/api/partial/resource/123';

      await endpointAvailable(mockReq, mockRes, mockNext);
      expectNextCalled();
    });

    it('should return 404 if a configured endpoint (like "nested/path") does not include the requested endpoint (like "/nested")', async () => {
      mockReq.url = '/nested'
      await endpointAvailable(mockReq, mockRes, mockNext)
      expectResponseSent(404, { message: 'Endpoint not found' });
    });

    it('should call next() if a configured endpoint includes the requested endpoint (successful case)', async () => {
      mockReq.url = '/nested/path/some/resource'
      await endpointAvailable(mockReq, mockRes, mockNext)
      expectNextCalled();
    });

    it('should return 404 and "Endpoint not available" if the endpoint matches an unavailable configuration', async () => {
      mockReq.url = '/api/private';
      await endpointAvailable(mockReq, mockRes, mockNext);
      expectResponseSent(404, 'Endpoint not available');
    });

    it('should return 404 and "Endpoint not found" if the endpoint does not match any configuration', async () => {
      mockReq.url = '/api/nonexistent';
      await endpointAvailable(mockReq, mockRes, mockNext);
      expectResponseSent(404, { message: 'Endpoint not found' });
    });

  });

  describe('assistantlimitReached middleware', () => {
    let mockAssistantConfig;
    mockAssistantConfig = { dataValues: { id: 10, endpoint: '/api/assistant', limit: 5 } };

    beforeEach(() => {
      vi.clearAllMocks();

      mockAssistantConfig = { dataValues: { id: 10, endpoint: '/api/assistant', limit: 5 } };

      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(mockAssistantConfig);
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);

      mockReq.url = '/api/assistant';
      mockRes.status.mockClear();
      mockRes.json.mockClear();
      mockRes.send.mockClear();
    });

    it('should call updateConfigurationsCache if configurationsCache is empty (first run)', async () => {
      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
    });

    it('should return 404 "Endpoint not found" if the /api/assistant configuration is not found', async () => {
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(undefined)

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
      expectResponseSent(404, { message: 'Endpoint not found' });
    });

    it('should return 429 "Limit reached" if the assistant count is greater than the limit', async () => {
      const assistantCount = mockAssistantConfig.dataValues.limit + 1;
      const mockAssistants = Array(assistantCount).fill({});
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(mockAssistants);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
      expectResponseSent(429, 'Limit reached');
    });

    it('should return 429 "Limit reached" if the assistant count is exactly the limit', async () => {
      const assistantCount = mockAssistantConfig.dataValues.limit
      const mockAssistants = Array(assistantCount).fill({});
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(mockAssistants);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
      expectResponseSent(429, 'Limit reached');
    });

    it('should call next() if the assistant count is less than the limit', async () => {
      const assistantCount = mockAssistantConfig.dataValues.limit - 1;
      const mockAssistants = Array(assistantCount).fill({});
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(mockAssistants);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
      expectNextCalled();
    });

    it('should call next() if Assistant.findAll returns an empty array', async () => {
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
      expectNextCalled();
    });

    it('should call next() if Assistant.findAll returns null or undefined', async () => {
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(null);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledOnce();
      expectNextCalled();
    });
  });

});
