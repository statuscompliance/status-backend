import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createScript, getAllScripts, getScriptById, updateScript, deleteScript, deleteAllScripts, parseScript } from '../../../../src/controllers/script.controller';
import redis from '../../../../src/config/redis'

// Mock del módulo uuid ANTES de la importación del controlador
const mockUuidv4 = vi.fn().mockReturnValue('test-uuid');
vi.mock('uuid', () => ({ v4: mockUuidv4 }));
import * as uuid from 'uuid';

// Limpiar los mocks ANTES de cada test
beforeEach(() => {
  vi.clearAllMocks();
});

describe('createScript', () => {

  it('should create a new script successfully with valid code and metadata', async () => {
    const mockRedisSet = vi.fn().mockResolvedValue('OK');
    vi.spyOn(redis, 'set').mockImplementation(mockRedisSet);

    const req = {
      body: { code: 'module.exports.main = () => {};', metadata: { name: 'test' } },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createScript(req, res);

    expect(mockUuidv4).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      'script:test-uuid',
      JSON.stringify({
        code: 'module.exports.main = () => {};',
        metadata: { name: 'test' },
        createdAt: expect.any(String),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Script created successfully', id: 'test-uuid' });
  });

  it('should create a new script successfully with valid code and no metadata', async () => {
    const mockRedisSet = vi.fn().mockResolvedValue('OK');
    vi.spyOn(redis, 'set').mockImplementation(mockRedisSet);
    vi.mock('uuid', () => ({ v4: vi.fn().mockReturnValue('another-test-uuid') })); // Mock específico para este test

    const req = {
      body: { code: 'module.exports.main = () => { return "hello"; };' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createScript(req, res);

    expect(uuid.v4).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      'script:another-test-uuid',
      JSON.stringify({
        code: 'module.exports.main = () => { return "hello"; };',
        metadata: {},
        createdAt: expect.any(String),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Script created successfully', id: 'another-test-uuid' });
  });

  it('should return 400 if code is missing in the request body', async () => {
    const req = {
      body: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createScript(req, res);

    expect(uuid.v4).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Code is required.' });
  });

  it('should return 400 if code does not include module.exports.main', async () => {
    const req = {
      body: { code: 'const x = 1;' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createScript(req, res);

    expect(uuid.v4).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'The code must include a module.exports.main function.' });
  });

  it('should return 500 if Redis `set` operation fails', async () => {
    const mockRedisSet = vi.fn().mockRejectedValue(new Error('Redis error'));
    vi.spyOn(redis, 'set').mockImplementation(mockRedisSet);

    const req = {
      body: { code: 'module.exports.main = () => {};' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createScript(req, res);

    expect(uuid.v4).toHaveBeenCalledTimes(1);
    expect(mockRedisSet).toHaveBeenCalledWith(
      'script:test-uuid',
      JSON.stringify({
        code: 'module.exports.main = () => {};',
        metadata: {},
        createdAt: expect.any(String),
      })
    );
    expect(console.error).toHaveBeenCalledWith('Error creating script:', new Error('Redis error'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});