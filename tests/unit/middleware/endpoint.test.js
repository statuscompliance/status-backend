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

  const cacheLoadingTestCases = [
    {
      name: 'should successfully load configurations into the cache',
      mockFindAllValue: [{ endpoint: '/api/users', available: true }, { endpoint: '/api/products', available: false }],
      expectedCache: [{ endpoint: '/api/users', available: true }, { endpoint: '/api/products', available: false }],
      expectedErrorMessage: undefined,
    },
    {
      name: 'should handle database error during cache loading and throw an error',
      mockFindAllValue: new Error('Database connection error'),
      expectedErrorMessage: 'Failed to fetch configurations from database',
      expectedConsoleError: [['Error fetching configurations from DB:', expect.any(Error)]],
    },
    {
      name: 'should handle a null or undefined response from the database by throwing an error',
      mockFindAllValue: null,
      expectedErrorMessage: 'Configurations cache is still empty after fetching.',
      expectedConsoleError: [['fetchAllConfigurations returned null or undefined.']],
    },
    {
      name: 'should handle an empty array response from the database gracefully',
      mockFindAllValue: [],
      expectedCache: [],
      expectedErrorMessage: undefined,
    },
  ];

  it.each(cacheLoadingTestCases)('$name', async ({ mockFindAllValue, expectedCache, expectedErrorMessage, expectedConsoleError }) => {
    await expectCacheLoadingResult({ mockFindAllValue, expectedCache, expectedErrorMessage, expectedConsoleError });
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

  const expectJsonResponse = (status, expectedJson) => {
    expect(mockRes.status).toHaveBeenCalledWith(status);
    expect(mockRes.json).toHaveBeenCalledWith(expectedJson);
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  };

  const expectSendResponse = (status, expectedText) => {
    expect(mockRes.status).toHaveBeenCalledWith(status);
    expect(mockRes.send).toHaveBeenCalledWith(expectedText);
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  };

  const expectNextCalled = () => {
    expect(mockNext).toHaveBeenCalledOnce();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  };

  it.each([
    {
      name: 'should return 404 JSON for unmatched endpoint',
      cache: [{ endpoint: '/api/items', available: true }],
      url: '/api/some/endpoint',
      expectedStatus: 404,
      expectedJson: { message: 'Endpoint not found' },
    },
    {
      name: 'should return 404 JSON if no endpoint matches',
      cache: [{ endpoint: '/api/items', available: true }],
      url: '/api/orders',
      expectedStatus: 404,
      expectedJson: { message: 'Endpoint not found' },
    },
  ])('$name', async ({ cache, url, expectedStatus, expectedJson }) => {
    setConfigurationCache(cache);
    mockReq.url = url;
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectJsonResponse(expectedStatus, expectedJson);
  });

  it.each([
    {
      name: 'should call next() for an available matching endpoint',
      cache: [{ endpoint: '/api/users', available: true }],
      url: '/api/users',
    },
  ])('$name', async ({ cache, url }) => {
    setConfigurationCache(cache);
    mockReq.url = url;
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectNextCalled();
  });

  it('should return 404 text if a matching endpoint is not available', async () => {
    setConfigurationCache([{ endpoint: '/api/data', available: false }]);
    mockReq.url = '/api/data';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expectSendResponse(404, 'Endpoint not available');
  });

  it('should load configurations and call next if cache is null and endpoint is available', async () => {
    const mockConfigurations = [{ endpoint: '/api/test', available: true }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    setConfigurationCache(null);
    mockReq.url = '/api/test';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expect(console.log).toHaveBeenCalledWith('Configurations cache loaded successfully.');
    expectNextCalled();
  });

  it('should return 500 for configuration loading failure', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setConfigurationCache(null);
    mockReq.url = '/api/test';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expect(console.error).toHaveBeenCalledWith('Endpoint Availability Middleware Error:', expect.any(Error));
    expectSendResponse(500, 'Error loading configurations.');
  });

  it('should return 500 for unexpected empty cache after loading attempt', async () => {
    const unexpectedError = new Error('Some unexpected failure after cache load');
    vi.spyOn(ensureConfigurationsLoaded, 'call').mockRejectedValue(unexpectedError);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setConfigurationCache(unexpectedError);
    mockReq.url = '/api/test';
    await endpointAvailable(mockReq, mockRes, mockNext);
    expect(console.error).toHaveBeenCalledWith('Unhandled error in endpointAvailable middleware:', expect.any(Error));
    expectSendResponse(500, 'Internal server error.');
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(undefined);
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);
  });

  const expectResponse = ({
    status,
    jsonResponse,
    sendResponse,
    calledNext = false,
    expectedConsoleError = [],
    expectedConsoleWarn = [],
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
    expectedConsoleError.forEach((args) => {
      expect(console.error).toHaveBeenCalledWith(...args);
    });
    expectedConsoleWarn.forEach((args) => {
      expect(console.warn).toHaveBeenCalledWith(...args);
    });
  };

  it('should return 500 if loading configurations cache fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    setConfigurationCache(null);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({
      status: 500,
      sendResponse: 'Error loading configurations.',
      expectedConsoleError: [['Assistant Limit Middleware Error (Cache):', expect.any(Error)]],
    });
  });

  it.each([
    {
      name: 'should return 404 if endpoint configuration is not found',
      findOneMock: null,
      expectedStatus: 404,
      expectedJson: { message: 'Endpoint configuration for /api/assistant not found or limit not defined.' },
      expectedConsoleWarn: [['Configuration for /api/assistant not found or limit not defined.']],
    },
    {
      name: 'should return 404 if endpoint configuration limit is undefined',
      findOneMock: { endpoint: '/api/assistant' },
      expectedStatus: 404,
      expectedJson: { message: 'Endpoint configuration for /api/assistant not found or limit not defined.' },
      expectedConsoleWarn: [['Configuration for /api/assistant not found or limit not defined.']],
    },
  ])('$name', async ({ findOneMock, expectedStatus, expectedJson, expectedConsoleWarn }) => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(findOneMock);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({ status: expectedStatus, jsonResponse: expectedJson, expectedConsoleWarn });
  });

  it('should log non-ConfigurationNotFoundError in loadAssistantConfiguration and rethrow', async () => {
    const dbError = new Error('DB connection failed during findOne');
    vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(dbError);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({
      status: 500,
      sendResponse: 'Internal server error.',
      expectedConsoleError: [
        ['Error fetching assistant configuration for /api/assistant:', dbError],
        ['Unhandled error in assistantlimitReached middleware:', expect.any(Error)],
      ],
    });
  });

  it.each([
    {
      name: 'should return 500 if fetching assistants fails',
      findOneMock: { endpoint: '/api/assistant', limit: 2 },
      findAllAssistantsMock: new Error('Database error'),
      expectedStatus: 500,
      expectedSendResponse: 'Error checking assistant limits.',
      expectedConsoleError: [['Assistant Limit Middleware Error (Fetch):', expect.any(Error)]],
    },
    {
      name: 'should return 500 if models.Assistant.findAll returns a non-array value',
      findOneMock: { endpoint: '/api/assistant', limit: 2 },
      findAllAssistantsMock: null,
      expectedStatus: 500,
      expectedSendResponse: 'Error checking assistant limits.',
      expectedConsoleError: [
        ['models.Assistant.findAll did not return an array.'],
        ['Assistant Limit Middleware Error (Fetch):', expect.any(Error)],
      ],
    },
  ])('$name', async ({ findOneMock, findAllAssistantsMock, expectedStatus, expectedSendResponse, expectedConsoleError }) => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(findOneMock);
    vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(findAllAssistantsMock);
    if (findAllAssistantsMock !== null && !(findAllAssistantsMock instanceof Error)) {
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(findAllAssistantsMock);
    } else if (findAllAssistantsMock instanceof Error) {
      vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(findAllAssistantsMock);
    } else {
      vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(findAllAssistantsMock);
    }
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({ status: expectedStatus, sendResponse: expectedSendResponse, expectedConsoleError });
  });

  it.each([
    {
      name: 'should call next() if assistant limit is not reached',
      findOneMock: { endpoint: '/api/assistant', limit: 2 },
      findAllAssistantsMock: [{ id: 1 }],
      expectedCalledNext: true,
    },
    {
      name: 'should call next() if assistant count is zero',
      findOneMock: { endpoint: '/api/assistant', limit: 2 },
      findAllAssistantsMock: [],
      expectedCalledNext: true,
    },
  ])('$name', async ({ findOneMock, findAllAssistantsMock, expectedCalledNext }) => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(findOneMock);
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(findAllAssistantsMock);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({ calledNext: expectedCalledNext });
  });

  it('should return 429 if assistant limit is reached', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 1 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({ status: 429, sendResponse: 'Assistant limit reached.' });
  });

  it('should return 500 for unhandled errors in assistantlimitReached middleware', async () => {
    const unexpectedError = new Error('Some unhandled error during limit check');
    vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(unexpectedError);
    await assistantlimitReached(mockReq, mockRes, mockNext);
    expectResponse({
      status: 500,
      sendResponse: 'Internal server error.',
      expectedConsoleError: [
        ['Error fetching assistant configuration for /api/assistant:', unexpectedError],
        ['Unhandled error in assistantlimitReached middleware:', expect.any(Error)],
      ],
    });
  });
});
