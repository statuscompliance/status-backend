import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  endpointAvailable,
  setConfigurationCache,
  assistantlimitReached,
  ensureConfigurationsLoaded,
  getConfigurationsCache,
  CacheLoadError,
  ConfigurationNotFoundError,
  AssistantFetchError,
  updateConfigurationsCache
} from '../../../src/middleware/endpoint.js';
import { models } from '../../../src/models/models.js';


describe('endpoint.js Middleware', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    setConfigurationCache(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache Utilities', () => {

    it('setConfigurationCache should set the cache', () => {
      const testCache = [{ endpoint: '/test', available: true }];
      setConfigurationCache(testCache);

      expect(getConfigurationsCache()).toBe(testCache);
    });

    it('getConfigurationsCache should return the current cache', () => {
      expect(getConfigurationsCache()).toBeNull();
      const testCache = [{ endpoint: '/test', available: true }];
      setConfigurationCache(testCache);

      expect(getConfigurationsCache()).toBe(testCache);
    });

    it('updateConfigurationsCache should fetch configurations and update the cache', async () => {
      const fetchedConfigs = [{ endpoint: '/fetched', available: false }];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(fetchedConfigs);

      await updateConfigurationsCache();

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(getConfigurationsCache()).toBe(fetchedConfigs);
    });

    it('ensureConfigurationsLoaded should fetch configurations if cache is null', async () => {
      const fetchedConfigs = [{ endpoint: '/cached', available: true }];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(fetchedConfigs);

      await ensureConfigurationsLoaded();

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(getConfigurationsCache()).toBe(fetchedConfigs);
    });

    it('ensureConfigurationsLoaded should not fetch configurations if cache is already populated', async () => {
      const initialCache = [{ endpoint: '/initial', available: true }];
      setConfigurationCache(initialCache);
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(initialCache);

      await ensureConfigurationsLoaded();

      expect(models.Configuration.findAll).not.toHaveBeenCalled();
      expect(getConfigurationsCache()).toBe(initialCache);
    });

    it('ensureConfigurationsLoaded should throw CacheLoadError if fetching fails', async () => {
      const fetchError = new Error('DB connection failed');
      vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(fetchError);

      await expect(ensureConfigurationsLoaded()).rejects.toThrow(CacheLoadError);
      await expect(ensureConfigurationsLoaded()).rejects.toThrow('Failed to fetch configurations from database');
    });

    it('should throw CacheLoadError if models.Configuration.findAll resolves to null', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(null);
      await expect(ensureConfigurationsLoaded()).rejects.toThrow(CacheLoadError);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(getConfigurationsCache()).toBeNull();
    });

    it('should NOT throw and cache an empty array if models.Configuration.findAll resolves to an empty array', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
      await ensureConfigurationsLoaded();

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(getConfigurationsCache()).toEqual([]);
    });

  });

  describe('endpointAvailable Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = { url: '/test-endpoint' };
      mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn(),
        send: vi.fn(),
      };
      mockNext = vi.fn();
    });

    it('should call next() if endpoint is available', async () => {
      const availableConfigs = [
        { endpoint: '/other', available: false },
        { endpoint: '/test-endpoint', available: true },
      ];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(availableConfigs);

      await endpointAvailable(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(getConfigurationsCache()).toBe(availableConfigs);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 404 and message if endpoint is not found', async () => {
      const availableConfigs = [
        { endpoint: '/other', available: true },
      ];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(availableConfigs);

      await endpointAvailable(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
      expect(mockRes.send).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 and message if endpoint is found but available is false', async () => {
      const availableConfigs = [
        { endpoint: '/test-endpoint', available: false },
      ];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(availableConfigs);

      await endpointAvailable(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith('Endpoint not available');
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle CacheLoadError during ensureConfigurationsLoaded', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('DB error'));

      await endpointAvailable(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(CacheLoadError);
      expect(errorPassedToNext.message).toBe('Failed to fetch configurations from database');
    });

    it('should use the existing cache if already loaded', async () => {
      const initialCache = [{ endpoint: '/test-endpoint', available: true }];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(initialCache);

      setConfigurationCache(initialCache);

      await endpointAvailable(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).not.toHaveBeenCalled();
      expect(getConfigurationsCache()).toBe(initialCache);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('loadAssistantConfiguration', () => {

    it('should throw ConfigurationNotFoundError if config is not found', async () => {
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([{ endpoint: '/api/assistant', available: true }]);
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

      let mockReq = {};
      let mockRes = { status: vi.fn(() => mockRes), json: vi.fn(), send: vi.fn() };
      let mockNext = vi.fn();

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(ConfigurationNotFoundError);
      expect(errorPassedToNext.message).toContain('Endpoint configuration for /api/assistant not found');
    });

    it('should throw ConfigurationNotFoundError if config found but limit is undefined', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([{ endpoint: '/api/assistant', available: true }]);
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', available: true });

      let mockReq = {};
      let mockRes = { status: vi.fn(() => mockRes), json: vi.fn(), send: vi.fn() };
      let mockNext = vi.fn();

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(ConfigurationNotFoundError);
      expect(errorPassedToNext.message).toContain('limit not defined');
    });
  });

  describe('getAssistantCount', () => {

    it('should throw AssistantFetchError if fetching fails', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([{ endpoint: '/api/assistant', available: true, limit: 10 }]);
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue({ endpoint: '/api/assistant', available: true, limit: 10 });
      const fetchError = new Error('DB error fetching assistants');
      vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(fetchError);

      let mockReq = {};
      let mockRes = { status: vi.fn(() => mockRes), json: vi.fn(), send: vi.fn() };
      let mockNext = vi.fn();

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(AssistantFetchError);
      expect(errorPassedToNext.message).toBe('Failed to fetch assistants from database');
      expect(errorPassedToNext.originalError).toBe(fetchError);
    });

    it('should throw AssistantFetchError if unexpected response from findAllAssistants', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([{ endpoint: '/api/assistant', available: true, limit: 10 }]); // Cache needed
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', available: true, limit: 10 }); // Config needed
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue({ notAn: 'array' }); // Simulate unexpected response

      let mockReq = {};
      let mockRes = { status: vi.fn(() => mockRes), json: vi.fn(), send: vi.fn() };
      let mockNext = vi.fn();

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(AssistantFetchError);
      expect(errorPassedToNext.message).toBe('Failed to fetch assistants from database');
    });
  });

  describe('assistantlimitReached Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: vi.fn(() => mockRes),
        json: vi.fn(),
        send: vi.fn(),
      };
      mockNext = vi.fn();

      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', available: true, limit: 5 });
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }, { id: 2 }]);
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([{ endpoint: '/api/assistant', available: true, limit: 5 }]);
    });

    it('should call next() if assistant limit is NOT reached', async () => {
      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should return 429 if assistant limit IS reached (count == limit)', async () => {
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]); // Count is 5

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1); // Cache loaded
      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Assistant limit reached.', current: 5, limit: 5, });
    });

    it('should return 429 if assistant limit IS reached (count > limit)', async () => {
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]); // Count is 6

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1); // Cache loaded
      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Assistant limit reached.',
        current: 6,
        limit: 5,
      });
    });

    it('should handle CacheLoadError during ensureConfigurationsLoaded', async () => {
      vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('DB error'));

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(CacheLoadError);
      expect(errorPassedToNext.message).toBe('Failed to fetch configurations from database');
    });

    it('should handle ConfigurationNotFoundError from loadAssistantConfiguration', async () => {
      vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(ConfigurationNotFoundError);
      expect(errorPassedToNext.message).toContain('Endpoint configuration for /api/assistant not found');
    });

    it('should handle AssistantFetchError from getAssistantCount', async () => {
      const fetchError = new Error('DB error fetching assistants');
      vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(fetchError);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
      expect(models.Configuration.findOne).toHaveBeenCalledWith({ where: { endpoint: '/api/assistant' } });
      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      const errorPassedToNext = mockNext.mock.calls[0][0];
      expect(errorPassedToNext).toBeInstanceOf(AssistantFetchError);
      expect(errorPassedToNext.message).toBe('Failed to fetch assistants from database');
      expect(errorPassedToNext.originalError).toBe(fetchError);
    });

    it('should use the existing cache if already loaded', async () => {
      const initialCache = [{ endpoint: '/api/assistant', available: true, limit: 5 }];
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(initialCache);
      setConfigurationCache(initialCache);

      await assistantlimitReached(mockReq, mockRes, mockNext);

      expect(models.Configuration.findAll).not.toHaveBeenCalled();
      expect(getConfigurationsCache()).toBe(initialCache);
      expect(models.Configuration.findOne).toHaveBeenCalledTimes(1);
      expect(models.Assistant.findAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('Custom Errors', () => {

    it('CacheLoadError should be an instance of Error', () => {
      const error = new CacheLoadError('Test message', new Error('Original'));
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('CacheLoadError');
      expect(error.message).toBe('Test message');
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(500);
    });

    it('ConfigurationNotFoundError should be an instance of Error', () => {
      const error = new ConfigurationNotFoundError('Test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConfigurationNotFoundError');
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(404);
      expect(error.originalError).toBeUndefined();
    });

    it('AssistantFetchError should be an instance of Error', () => {
      const error = new AssistantFetchError('Test message', new Error('Original'));
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AssistantFetchError');
      expect(error.message).toBe('Test message');
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(500);
    });
  });

});
