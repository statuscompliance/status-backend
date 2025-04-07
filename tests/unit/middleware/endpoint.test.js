import { endpointAvailable, setConfigurationCache, assistantlimitReached, updateConfigurationsCache, configurationsCache } from '../../../src/middleware/endpoint';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockModels = {
  Configuration: {
    findOne: vi.fn(),
    findAll: vi.fn(() => Promise.resolve([]))
  },
  Assistant: {
    findOne: vi.fn(),
    findAll: vi.fn()
  },
};

describe('updateConfigurationsCache', () => {
  
  beforeEach(() => {
    setConfigurationCache(undefined)
  });

  it('should successfully load configurations into the cache', async () => {
    const mockConfigurations = [{ id: 1, dataValues: { endpoint: '/api/users' } }, { id: 2, dataValues: { endpoint: '/api/products' } }];
    mockModels.Configuration.findAll.mockResolvedValue(mockConfigurations);

    await updateConfigurationsCache(mockModels);

    expect(mockModels.Configuration.findAll).toHaveBeenCalledOnce();
    expect(configurationsCache).toEqual(mockConfigurations);
  });

  it('should handle database error and log it without updating the cache', async () => {
    const errorMessage = 'Database connection error';
    mockModels.Configuration.findAll.mockRejectedValue(new Error(errorMessage));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await updateConfigurationsCache(mockModels);

    expect(mockModels.Configuration.findAll).toHaveBeenCalledOnce();
    expect(global.configurationsCache).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(new Error(errorMessage));
    consoleErrorSpy.mockRestore();
  });

  it('should handle a null or undefined response from the database without erroring', async () => {
    mockModels.Configuration.findAll.mockResolvedValue(null);

    await updateConfigurationsCache(mockModels);

    expect(mockModels.Configuration.findAll).toHaveBeenCalledOnce();
    expect(global.configurationsCache).toBeNull();
  });

  it('should handle an empty array response from the database gracefully', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]);

    await updateConfigurationsCache(mockModels);

    expect(mockModels.Configuration.findAll).toHaveBeenCalledOnce();
    expect(global.configurationsCache).toEqual([]);
  });
});

describe('endpointAvailable Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let configurationsCache;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { url: '' };
    mockRes = { status: vi.fn(() => mockRes), json: vi.fn(), send: vi.fn() };
    mockNext = vi.fn();
    setConfigurationCache([]);
    global.updateConfigurationsCache = vi.fn(() => Promise.resolve());
  });

  it('should always return 404 json', async () => {
    mockReq.url = '/api/some/endpoint';
    await endpointAvailable(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should call next() if an available endpoint matches (includes)', async () => {
    configurationsCache = [{ dataValues: { endpoint: '/api/users', available: true } }];
    setConfigurationCache(configurationsCache);
    mockReq.url = '/api/users/123';
    await endpointAvailable(mockReq, mockRes, mockNext, mockModels);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 404 json if no endpoint matches', async () => {
    configurationsCache = [{ dataValues: { endpoint: '/api/items', available: true } }];
    setConfigurationCache(configurationsCache);
    mockReq.url = '/api/orders';
    await endpointAvailable(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint not found' });
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 404 send if a matching endpoint is not available', async () => {
    configurationsCache = [{ dataValues: { endpoint: '/api/data', available: false } }];
    setConfigurationCache(configurationsCache);
    mockReq.url = '/api/data/123';
    await endpointAvailable(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith('Endpoint not available');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
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
    mockModels.Configuration.findOne.mockReset();
    mockModels.Assistant.findAll.mockReset();
    mockModels.Configuration.findAll.mockReset();
  });

  it('should return 500', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]);
    const errorMessage = 'Database error during assistant config fetch';
    mockModels.Configuration.findOne.mockRejectedValue(new Error(errorMessage));
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Internal server error.');
    expect(mockModels.Assistant.findAll).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 404', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]);
    mockModels.Configuration.findOne.mockResolvedValue(null);
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint configuration not found.' });
    expect(mockModels.Assistant.findAll).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });


  it('should return 404', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]);
    mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { endpoint: '/api/assistant' } });
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Endpoint configuration not found.' });
    expect(mockModels.Assistant.findAll).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
  });

  it('should return 500', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]); // Prevent initial cache error
    mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 2 } });
    const errorMessage = 'Database error during assistant fetch';
    mockModels.Assistant.findAll.mockRejectedValue(new Error(errorMessage));
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith('Error checking assistant limits.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next()', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]); // Prevent initial cache error
    mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 2 } });
    mockModels.Assistant.findAll.mockResolvedValue([{ id: 1 }]);
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 429', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]); // Prevent initial cache error
    mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 1 } });
    mockModels.Assistant.findAll.mockResolvedValue([{ id: 1 }]);
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.send).toHaveBeenCalledWith('Assistant limit reached.');
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next()', async () => {
    mockModels.Configuration.findAll.mockResolvedValue([]); // Prevent initial cache error
    mockModels.Configuration.findOne.mockResolvedValue({ dataValues: { endpoint: '/api/assistant', limit: 2 } });
    mockModels.Assistant.findAll.mockResolvedValue([]);
    await assistantlimitReached(mockReq, mockRes, mockNext, mockModels);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.send).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });
});    
