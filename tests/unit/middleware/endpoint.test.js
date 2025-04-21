import { endpointAvailable, setConfigurationCache, assistantlimitReached, ensureConfigurationsLoaded, getConfigurationsCache } from '../../../src/middleware/endpoint.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { models } from '../../../src/models/models.js'

describe('Cache Loading Logic', () => {

  beforeEach(() => {
    setConfigurationCache(null);
    vi.resetAllMocks();
  });

  it('should successfully load configurations into the cache using ensureConfigurationsLoaded', async () => {
    const mockConfigurations = [{ endpoint: '/api/users', available: true }, { endpoint: '/api/products', available: false }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);

    await ensureConfigurationsLoaded();

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(getConfigurationsCache()).toEqual(mockConfigurations);
  });

  it('should handle database error during cache loading and throw an error', async () => {
    const errorMessage = 'Database connection error';
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error(errorMessage));
    vi.spyOn(console, 'error').mockImplementation(() => { });

    await expect(ensureConfigurationsLoaded()).rejects.toThrow('Failed to fetch configurations from database');

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(getConfigurationsCache()).toBeNull();

    expect(console.error).toHaveBeenCalledWith('Error fetching configurations from DB:', expect.any(Error));
  });

  it('should handle a null or undefined response from the database by throwing an error', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => { });

    await expect(ensureConfigurationsLoaded()).rejects.toThrow('Configurations cache is still empty after fetching.');

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(getConfigurationsCache()).toBeNull();
    expect(console.error).toHaveBeenCalledWith('fetchAllConfigurations returned null or undefined.');
  });

  it('should handle an empty array response from the database gracefully using ensureConfigurationsLoaded', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);

    await ensureConfigurationsLoaded();

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(getConfigurationsCache()).toEqual([]);
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

  it('should return 404 json if no match in cache (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/items', available: true }]);
    mockReq.url = '/api/some/endpoint';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should call next() if an available endpoint matches (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/users', available: true }]);
    mockReq.url = '/api/users';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 404 json if no endpoint matches (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/items', available: true }]);
    mockReq.url = '/api/orders';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 404 send if a matching endpoint is not available (exact match)', async () => {
    setConfigurationCache([{ endpoint: '/api/data', available: false }]);
    mockReq.url = '/api/data';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith('Endpoint not available');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should load configurations if cache is null and call next if endpoint is available', async () => {
    const mockConfigurations = [{ endpoint: '/api/test', available: true }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    setConfigurationCache(null);
    mockReq.url = '/api/test';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(getConfigurationsCache()).toEqual(mockConfigurations);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('Configurations cache loaded successfully.');
  });

  it('should return 500 if loading configurations fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    setConfigurationCache(null);
    mockReq.url = '/api/test';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error loading configurations.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Endpoint Availability Middleware Error:', expect.any(Error));
  });

  it('should return 500 for unexpected empty cache after loading attempt', async () => {   
    const unexpectedError = new Error('Some unexpected failure after cache load');
    vi.spyOn(ensureConfigurationsLoaded, 'call').mockRejectedValue(unexpectedError);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    setConfigurationCache(unexpectedError);
    mockReq.url = '/api/test';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Internal server error.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Unhandled error in endpointAvailable middleware:', expect.any(Error));
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
  });

  it('should return 500 if loading configurations cache fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    setConfigurationCache(null);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error loading configurations.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Assistant Limit Middleware Error (Cache):', expect.any(Error));
  });

  it('should return 404 if endpoint configuration is not found', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint configuration for /api/assistant not found or limit not defined.' });
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('Configuration for /api/assistant not found or limit not defined.');
  });

  it('should return 404 if endpoint configuration limit is undefined', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant' });

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint configuration for /api/assistant not found or limit not defined.' });
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('Configuration for /api/assistant not found or limit not defined.');
  });

  it('should log non-ConfigurationNotFoundError in loadAssistantConfiguration and rethrow', async () => {
    const dbError = new Error('DB connection failed during findOne');
    vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(dbError);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(console.error).toHaveBeenCalledWith('Error fetching assistant configuration for /api/assistant:', dbError);
    expect(console.error).toHaveBeenCalledWith('Unhandled error in assistantlimitReached middleware:', expect.any(Error));
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Internal server error.');
  });


  it('should return 500 if fetching assistants fails', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(new Error('Database error'));

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error checking assistant limits.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Assistant Limit Middleware Error (Fetch):', expect.any(Error));
  });


  it('should return 500 if models.Assistant.findAll returns a non-array value', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue(null);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error checking assistant limits.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('models.Assistant.findAll did not return an array.');
    expect(console.error).toHaveBeenCalledWith('Assistant Limit Middleware Error (Fetch):', expect.any(Error));
  });


  it('should call next() if assistant limit is not reached', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 429 if assistant limit is reached', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 1 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.send).toHaveBeenCalledWith('Assistant limit reached.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next() if assistant count is zero', async () => {
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ endpoint: '/api/assistant', limit: 2 });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 500 for unhandled errors in assistantlimitReached middleware', async () => {
    const unexpectedError = new Error('Some unhandled error during limit check');
    vi.spyOn(models.Configuration, 'findOne').mockRejectedValue(unexpectedError);

    await assistantlimitReached(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Internal server error.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Error fetching assistant configuration for /api/assistant:', unexpectedError);
    expect(console.error).toHaveBeenCalledWith('Unhandled error in assistantlimitReached middleware:', expect.any(Error));
  });
});
