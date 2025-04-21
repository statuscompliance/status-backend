import { endpointAvailable, setConfigurationCache, assistantlimitReached, ensureConfigurationsLoaded, getConfigurationsCache } from '../../../src/middleware/endpoint.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { models } from '../../../src/models/models.js'

describe('Cache Loading Logic', () => {

  beforeEach(() => {
    setConfigurationCache(null);
    vi.resetAllMocks();
  });

  const expectCacheLoadingResult = async ({
    mockFindAllValue,
    expectedCache,
    expectedErrorMessage,
    expectedConsoleError = []
  }) => {
    if (mockFindAllValue instanceof Error) {
      vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(mockFindAllValue);
    } else {
      vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockFindAllValue);
    }
    vi.spyOn(console, 'error').mockImplementation(() => { });
    if (expectedErrorMessage) {
      await expect(ensureConfigurationsLoaded()).rejects.toThrow(expectedErrorMessage);
      expect(getConfigurationsCache()).toBeNull();
    } else {
      await ensureConfigurationsLoaded();
      expect(getConfigurationsCache()).toEqual(expectedCache);
    }
    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expectedConsoleError.forEach(args => {
      expect(console.error).toHaveBeenCalledWith(...args);
    });
  };


  it('should successfully load configurations into the cache using ensureConfigurationsLoaded', async () => {
    const mockConfigurations = [{ endpoint: '/api/users', available: true }, { endpoint: '/api/products', available: false }];
    await expectCacheLoadingResult({
      mockFindAllValue: mockConfigurations,
      expectedCache: mockConfigurations
    });
  });

  it('should handle database error during cache loading and throw an error', async () => {
    const errorMessage = 'Database connection error';
    const dbError = new Error(errorMessage);
    await expectCacheLoadingResult({
      mockFindAllValue: dbError,
      expectedErrorMessage: 'Failed to fetch configurations from database',
      expectedConsoleError: [['Error fetching configurations from DB:', dbError]]
    });
  });

  it('should handle a null or undefined response from the database by throwing an error', async () => {
    await expectCacheLoadingResult({
      mockFindAllValue: null,
      expectedErrorMessage: 'Configurations cache is still empty after fetching.',
      expectedConsoleError: [['fetchAllConfigurations returned null or undefined.']]
    });
  });

  it('should handle an empty array response from the database gracefully using ensureConfigurationsLoaded', async () => {
    await expectCacheLoadingResult({
      mockFindAllValue: [],
      expectedCache: []
    });
  });
});

describe('endpointAvailable Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { url: '' };
    mockRes = { status: vi.fn(() => mockRes), json: vi.fn(), send: vi.fn() };
    mockNext = vi.fn();
    setConfigurationCache([]);
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
  });

  const expectEndpointAvailableResponse = ({
    status,
    jsonResponse,
    sendResponse,
    calledNext = false
  }) => {
    if (status !== undefined) {
      expect(mockRes.status).toHaveBeenCalledWith(status);
    }
    if (jsonResponse !== undefined) {
      expect(mockRes.json).toHaveBeenCalledWith(jsonResponse);
      expect(mockRes.send).not.toHaveBeenCalled();
    } else if (sendResponse !== undefined) {
      expect(mockRes.send).toHaveBeenCalledWith(sendResponse);
      expect(mockRes.json).not.toHaveBeenCalled();
    } else {
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    }
    if (calledNext) {
      expect(mockNext).toHaveBeenCalledOnce();
    } else {
      expect(mockNext).not.toHaveBeenCalled();
    }
  };

  it('should return 404 json if no match in cache (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/items', available: true }]);
    mockReq.url = '/api/some/endpoint';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectEndpointAvailableResponse({ status: 404, jsonResponse: { message: 'Endpoint not found' } });
  });

  it('should call next() if an available endpoint matches (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/users', available: true }]);
    mockReq.url = '/api/users';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectEndpointAvailableResponse({ status: undefined, calledNext: true });
  });

  it('should return 404 json if no endpoint matches (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/items', available: true }]);
    mockReq.url = '/api/orders';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectEndpointAvailableResponse({ status: 404, jsonResponse: { message: 'Endpoint not found' } });
  });

  it('should return 404 send if a matching endpoint is not available (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/data', available: false }]);
    mockReq.url = '/api/data';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectEndpointAvailableResponse({ status: 404, sendResponse: 'Endpoint not available' });
  });

  it('should load configurations if cache is null and call next if endpoint is available', async () => {
    const mockConfigurations = [{ endpoint: '/api/test', available: true }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);
    vi.spyOn(console, 'log').mockImplementation(() => { });
    setConfigurationCache(null);
    mockReq.url = '/api/test';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expect(console.log).toHaveBeenCalledWith('Configurations cache loaded successfully.');
    expectEndpointAvailableResponse({ status: undefined, calledNext: true });
  });

  it('should return 500 if loading configurations fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    vi.spyOn(console, 'error').mockImplementation(() => { });
    setConfigurationCache(null);
    mockReq.url = '/api/test';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expect(console.error).toHaveBeenCalledWith('Endpoint Availability Middleware Error:', expect.any(Error));
    expectEndpointAvailableResponse({ status: 500, sendResponse: 'Error loading configurations.' });
  });

  it('should return 500 for unexpected empty cache after loading attempt', async () => {
    const unexpectedError = new Error('Some unexpected failure after cache load');
    vi.spyOn(ensureConfigurationsLoaded, 'call').mockRejectedValue(unexpectedError);
    vi.spyOn(console, 'error').mockImplementation(() => { });
    setConfigurationCache(unexpectedError);
    mockReq.url = '/api/test';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expect(console.error).toHaveBeenCalledWith('Unhandled error in endpointAvailable middleware:', expect.any(Error));
    expectEndpointAvailableResponse({ status: 500, sendResponse: 'Internal server error.' });
  });
});

describe('assistantlimitReached Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {};
    mockRes = { status: vi.fn(() => mockRes), send: vi.fn(), json: vi.fn() };
    mockNext = vi.fn();
    setConfigurationCache([]);
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
  });

  const expectAssistantLimitResponse = ({
    status,
    jsonResponse,
    sendResponse,
    calledNext = false,
    expectedConsoleError = [],
    expectedConsoleWarn = []
  }) => {
    if (status !== undefined) {
      expect(mockRes.status).toHaveBeenCalledWith(status);
    }
    if (jsonResponse !== undefined) {
      expect(mockRes.json).toHaveBeenCalledWith(jsonResponse);
      expect(mockRes.send).not.toHaveBeenCalled();
    } else if (sendResponse !== undefined) {
      expect(mockRes.send).toHaveBeenCalledWith(sendResponse);
      expect(mockRes.json).not.toHaveBeenCalled();
    } else {
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    }
    if (calledNext) {
      expect(mockNext).toHaveBeenCalledOnce();
    } else {
      expect(mockNext).not.toHaveBeenCalled();
    }
    expectedConsoleError.forEach(args => {
      expect(console.error).toHaveBeenCalledWith(...args);
    });
    expectedConsoleWarn.forEach(args => {
      expect(console.warn).toHaveBeenCalledWith(...args);
    });
  };

  it('should return 500 if loading configurations cache fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    setConfigurationCache(null);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({
      status: 500, sendResponse: 'Error loading configurations.', expectedConsoleError: [['Assistant Limit Middleware Error (Cache):', expect.any(Error)]]
    });
  });

  it('should return 404 if endpoint configuration is not found', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expectAssistantLimitResponse({
      status: 404, jsonResponse: { message: 'Endpoint configuration for /api/assistant not found or limit not defined.' }, expectedConsoleWarn: [['Configuration for /api/assistant not found or limit not defined.']]
    });
  });

  it('should return 404 if endpoint configuration limit is undefined', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant' });
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({
      status: 404, jsonResponse: { message: 'Endpoint configuration for /api/assistant not found or limit not defined.' }, expectedConsoleWarn: [['Configuration for /api/assistant not found or limit not defined.']]
    });
  });

  it('should log non-ConfigurationNotFoundError in loadAssistantConfiguration and rethrow', async () => {
    const dbError = new Error('DB connection failed during findOne');
    vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(dbError);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({
      status: 500, sendResponse: 'Internal server error.', expectedConsoleError: [['Error fetching assistant configuration for /api/assistant:', dbError], ['Unhandled error in assistantlimitReached middleware:', expect.any(Error)]]
    });
  });

  it('should return 500 if fetching assistants fails', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(new Error('Database error'));
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({
      status: 500, sendResponse: 'Error checking assistant limits.', expectedConsoleError: [['Assistant Limit Middleware Error (Fetch):', expect.any(Error)]]
    });
  });

  it('should return 500 if models.Assistant.findAll returns a non-array value', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(null);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({
      status: 500, sendResponse: 'Error checking assistant limits.', expectedConsoleError: [['models.Assistant.findAll did not return an array.'], ['Assistant Limit Middleware Error (Fetch):', expect.any(Error)]]
    });
  });

  it('should call next() if assistant limit is not reached', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({ calledNext: true });
  });

  it('should return 429 if assistant limit is reached', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 1 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({ status: 429, sendResponse: 'Assistant limit reached.' });
  });

  it('should call next() if assistant count is zero', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({ calledNext: true });
  });

  it('should return 500 for unhandled errors in assistantlimitReached middleware', async () => {
    const unexpectedError = new Error('Some unhandled error during limit check');
    vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(unexpectedError);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectAssistantLimitResponse({
      status: 500, sendResponse: 'Internal server error.', expectedConsoleError: [['Error fetching assistant configuration for /api/assistant:', unexpectedError], ['Unhandled error in assistantlimitReached middleware:', expect.any(Error)]]
    });
  });
});
