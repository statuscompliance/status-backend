import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createScript,
  getAllScripts,
  getScriptById,
  updateScript,
  deleteScript,
  deleteAllScripts,
  parseScript,
} from '../../../../src/controllers/script.controller';
import redis from '../../../../src/config/redis';
import { v4 as uuidv4 } from 'uuid';

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid'),
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe('Script Controller - createScript', () => {
  
  let mockRedisSet;
  let mockUuidv4;
  let mockRes;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisSet = vi.spyOn(redis, 'set').mockResolvedValue('OK');
    mockUuidv4 = uuidv4;
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should create a new script successfully with valid code and metadata', async () => {
    const req = {
      body: { code: 'module.exports.main = () => {};', metadata: { name: 'test' } },
    };

    await createScript(req, mockRes);

    expect(mockUuidv4).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      'script:mock-uuid',
      JSON.stringify({
        code: 'module.exports.main = () => {};',
        metadata: { name: 'test' },
        createdAt: expect.any(String),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Script created successfully', id: 'mock-uuid' });
  });

  it('should create a new script successfully with valid code and no metadata', async () => {
    const req = {
      body: { code: 'module.exports.main = () => { return "hello"; };' },
    };

    await createScript(req, mockRes);

    expect(mockUuidv4).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      'script:mock-uuid',
      JSON.stringify({
        code: 'module.exports.main = () => { return "hello"; };',
        metadata: {},
        createdAt: expect.any(String),
      })
    );
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Script created successfully', id: 'mock-uuid' });
  });

  it('should return 400 if code is missing in the request body', async () => {
    const req = {
      body: {},
    };

    await createScript(req, mockRes);

    expect(mockUuidv4).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Code is required.' });
  });

  it('should return 400 if code does not include module.exports.main', async () => {
    const req = {
      body: { code: 'const x = 1;' },
    };

    await createScript(req, mockRes);

    expect(mockUuidv4).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'The code must include a module.exports.main function.' });
  });

  it('should return 500 if Redis `set` operation fails', async () => {
    mockRedisSet.mockRejectedValue(new Error('Redis error'));
    const req = {
      body: { code: 'module.exports.main = () => {};' },
    };

    await createScript(req, mockRes);

    expect(mockUuidv4).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      'script:mock-uuid',
      JSON.stringify({
        code: 'module.exports.main = () => {};',
        metadata: {},
        createdAt: expect.any(String),
      })
    );
    expect(console.error).toHaveBeenCalledWith('Error creating script:', new Error('Redis error'));
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});