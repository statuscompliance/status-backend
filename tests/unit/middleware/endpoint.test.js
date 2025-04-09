import { endpointAvailable, setConfigurationCache, assistantlimitReached, updateConfigurationsCache, configurationsCache } from '../../../src/middleware/endpoint.js';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { models } from '../../../src/models/models.js'

vi.mock('../models/models.js', () => ({
  Configuration: {
    findOne: vi.fn(),
    findAll: vi.fn(() => Promise.resolve([]))
  },
  Assistant: {
    findOne: vi.fn(),
    findAll: vi.fn()
  },
}));

describe('updateConfigurationsCache', () => {

  beforeEach(() => {
    setConfigurationCache(undefined);
    vi.resetAllMocks();
  });

  it('should successfully load configurations into the cache', async () => {
    const mockConfigurations = [{ id: 1, dataValues: { endpoint: '/api/users' } }, { id: 2, dataValues: { endpoint: '/api/products' } }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);

    await updateConfigurationsCache();

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(configurationsCache).toEqual(mockConfigurations);
  });

  it('should handle database error and log it without updating the cache', async () => {
    const errorMessage = 'Database connection error';
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error(errorMessage));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await updateConfigurationsCache();

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(configurationsCache).toBeUndefined();
    expect(console.error).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledWith(new Error(errorMessage));

  });

  it('should handle a null or undefined response from the database without erroring', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(null);

    await updateConfigurationsCache();

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(configurationsCache).toBeNull();
  });

  it('should handle an empty array response from the database gracefully', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);

    await updateConfigurationsCache();

    expect(models.Configuration.findAll).toHaveBeenCalledOnce();
    expect(configurationsCache).toEqual([]);
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
  });

  it('should always return 404 json if no match in cache', async () => {
    mockReq.url = '/api/some/endpoint';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should call next() if an available endpoint matches (includes)', async () => {
    setConfigurationCache([{ dataValues: { endpoint: '/api/users', available: true } }]);
    mockReq.url = '/api/users/123';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 404 json if no endpoint matches', async () => {
    setConfigurationCache([{ dataValues: { endpoint: '/api/items', available: true } }]);
    mockReq.url = '/api/orders';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 404 send if a matching endpoint is not available', async () => {
    setConfigurationCache([{ dataValues: { endpoint: '/api/data', available: false } }]);
    mockReq.url = '/api/data/123';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith('Endpoint not available');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should load configurations if cache is null and call next if endpoint is available', async () => {
    const mockConfigurations = [{ dataValues: { endpoint: '/api/test', available: true } }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);
    
    setConfigurationCache(mockConfigurations)
    
    mockReq.url = '/api/test';

    await endpointAvailable(mockReq, mockRes, mockNext);

    expect(configurationsCache).toEqual(mockConfigurations);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if loading configurations fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));
    setConfigurationCache(null);
    mockReq.url = '/api/test';

    await endpointAvailable(mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error loading configurations.');
    expect(mockNext).not.toHaveBeenCalled();
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
    setConfigurationCache(null);
  });

  it('should return 500 if updating configurations cache fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(new Error('Database error'));

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Internal server error.');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 404 if endpoint configuration is not found', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue(null);

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint configuration not found.' });
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 404 if endpoint configuration limit is undefined', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { endpoint: '/api/assistant' } });

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint configuration not found.' });
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 if fetching assistants fails', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 2 } });
    vi.spyOn(models.Assistant, 'findAll').mockRejectedValue(new Error('Database error'));

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error checking assistant limits.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next() if assistant limit is not reached', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 2 } });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 429 if assistant limit is reached', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 1 } });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([{ id: 1 }]);

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.send).toHaveBeenCalledWith('Assistant limit reached.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next() if assistant count is zero', async () => {
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue([]);
    vi.spyOn(models.Configuration, 'findOne').mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 2 } });
    vi.spyOn(models.Assistant, 'findAll').mockResolvedValue([]);

    await assistantlimitReached(mockReq, mockRes, mockNext, models);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});
