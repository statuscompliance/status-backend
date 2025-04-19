import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createScript,
  getAllScripts,
  getScriptById,
  updateScript,
  deleteScript,
  deleteAllScripts,
  parseScript,
} from '../../../../src/controllers/script.controller.js';
import redis from '../../../../src/config/redis.js';

describe('Script Controller', () => {

  let redisSetSpy;
  let redisGetSpy;
  let redisKeysSpy;
  let redisDelSpy;

  let consoleSpy;

  beforeEach(() => {
    vi.clearAllMocks();

    redisSetSpy = vi.spyOn(redis, 'set').mockResolvedValue('OK');
    redisGetSpy = vi.spyOn(redis, 'get');
    redisKeysSpy = vi.spyOn(redis, 'keys');
    redisDelSpy = vi.spyOn(redis, 'del').mockResolvedValue(1);


    consoleSpy = vi.spyOn(console, 'error');
  });

  describe('createScript', () => {

    it('should create a script successfully and return 201 with the new ID', async () => {
      const req = {
        body: {
          code: 'module.exports.main = () => { return "hello"; };',
          metadata: { description: 'A simple script' },
        },
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await createScript(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledOnce();
    });

    it('should return 400 if code is missing', async () => {
      const req = { body: { metadata: {} } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await createScript(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Code is required.' });
      expect(redisSetSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if code does not include module.exports.main', async () => {
      const req = { body: { code: 'const x = 1;', metadata: {} } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await createScript(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'The code must include a module.exports.main function.' });
      expect(redisSetSpy).not.toHaveBeenCalled();

    });

    it('should handle Redis errors and return 500', async () => {
      const req = {
        body: {
          code: 'module.exports.main = () => { return "hello"; };',
          metadata: { description: 'A simple script' },
        },
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };
      redisSetSpy.mockRejectedValue(new Error('Redis error'));
      await createScript(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(consoleSpy).toHaveBeenCalledWith('Error creating script:', new Error('Redis error'));
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getAllScripts', () => {

    it('should return an empty array if no scripts exist', async () => {
      redisKeysSpy.mockResolvedValue([]);
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await getAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return a list of scripts with their IDs and data', async () => {
      redisKeysSpy.mockResolvedValue(['script:id1', 'script:id2']);
      redisGetSpy.mockResolvedValueOnce(JSON.stringify({ code: '...', metadata: {} }));
      redisGetSpy.mockResolvedValueOnce(JSON.stringify({ code: '...', metadata: {} }));
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await getAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisGetSpy).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: 'id1', code: '...', metadata: {} },
        { id: 'id2', code: '...', metadata: {} },
      ]);
    });

    it('should handle Redis errors and return 500', async () => {
      redisKeysSpy.mockRejectedValue(new Error('Redis error'));
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await getAllScripts(req, res);

      expect(console.error).toHaveBeenCalledWith('Error getting all scripts:', new Error('Redis error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getScriptById', () => {

    it('should return the script code with 200 if found', async () => {
      const mockScriptData = JSON.stringify({ code: 'const x = "hello\\nworld";', metadata: {} });
      redisGetSpy.mockResolvedValue(mockScriptData);
      const req = { params: { id: 'test-id' } };
      const res = {
        status: vi.fn(() => res),
        send: vi.fn(),
      };

      await getScriptById(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:test-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('const x = "hello\nworld";');
    });

    it('should return 404 if script is not found', async () => {
      redisGetSpy.mockResolvedValue(null);
      const req = { params: { id: 'non-existent-id' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await getScriptById(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Script not found' });
    });

    it('should handle Redis errors and return 500', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis error'));
      const req = { params: { id: 'test-id' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await getScriptById(req, res);

      expect(console.error).toHaveBeenCalledWith('Error getting script by ID:', new Error('Redis error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('updateScript', () => {

    it('should update a script successfully and return 200', async () => {
      const existingScriptData = JSON.stringify({ code: 'old code', metadata: { old: 'data' }, createdAt: '...' });
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: 'test-id' },
        body: { code: 'new code', metadata: { new: 'data' } },
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await updateScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(redisSetSpy).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });
    });

    it('should update only code if provided', async () => {
      const existingScriptData = JSON.stringify({ code: 'old code', metadata: { old: 'data' }, createdAt: '...' });
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: 'test-id' },
        body: { code: 'new code' },
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await updateScript(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(redisSetSpy).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });

    });

    it('should update only metadata if provided', async () => {
      const existingScriptData = JSON.stringify({ code: 'old code', metadata: { old: 'data' }, createdAt: '...' });
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: 'test-id' },
        body: { metadata: { new: 'data' } },
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await updateScript(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(redisSetSpy).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });

    });

    it('should return 404 if script to update is not found', async () => {
      redisGetSpy.mockResolvedValue(null);
      const req = { params: { id: 'non-existent-id' }, body: { code: 'new code' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await updateScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Script not found' });
      expect(redisSetSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors and return 500', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis error'));
      const req = { params: { id: 'test-id' }, body: { code: 'new code' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await updateScript(req, res);

      expect(console.error).toHaveBeenCalledWith('Error updating script:', new Error('Redis error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('deleteScript', () => {

    it('should delete a script successfully and return 200', async () => {
      redisGetSpy.mockResolvedValue(JSON.stringify({ code: '...', metadata: {} }));
      const req = { params: { id: 'test-id' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:test-id');
      expect(redisDelSpy).toHaveBeenCalledWith('script:test-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Script deleted successfully' });
    });

    it('should return 404 if script to delete is not found', async () => {
      redisGetSpy.mockResolvedValue(null);
      const req = { params: { id: 'non-existent-id' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Script not found' });
      expect(redisDelSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors and return 500', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis error'));
      const req = { params: { id: 'test-id' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteScript(req, res);

      expect(console.error).toHaveBeenCalledWith('Error deleting script:', new Error('Redis error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should handle Redis delete errors and return 500', async () => {
      redisGetSpy.mockResolvedValue(JSON.stringify({ code: '...', metadata: {} }));
      redisDelSpy.mockRejectedValue(new Error('Redis delete error'));
      const req = { params: { id: 'test-id' } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:test-id');
      expect(redisDelSpy).toHaveBeenCalledWith('script:test-id');
      expect(console.error).toHaveBeenCalledWith('Error deleting script:', new Error('Redis delete error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('deleteAllScripts', () => {

    it('should delete all scripts successfully and return 200', async () => {
      redisKeysSpy.mockResolvedValue(['script:id1', 'script:id2']);
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisDelSpy).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'All scripts deleted successfully' });
    });

    it('should return 200 even if no scripts exist', async () => {
      redisKeysSpy.mockResolvedValue([]);
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisDelSpy).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'All scripts deleted successfully' });
    });

    it('should handle Redis errors when getting keys and return 500', async () => {
      redisKeysSpy.mockRejectedValue(new Error('Redis keys error'));
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(console.error).toHaveBeenCalledWith('Error deleting all scripts:', new Error('Redis keys error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(redisDelSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors when deleting a script and still return 500', async () => {
      redisKeysSpy.mockResolvedValue(['script:id1', 'script:id2']);
      redisDelSpy.mockRejectedValueOnce(new Error('Redis delete error'));
      const req = {};
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisDelSpy).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenCalledWith('Error deleting all scripts:', new Error('Redis delete error'));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('parseScript', () => {

    it('should return the stringified and escaped code with 200 if it includes module.exports.main', async () => {
      const req = { body: 'module.exports.main = () => {\n    return "hello";\n}' };
      const res = {
        status: vi.fn(() => res),
        send: vi.fn()
      };
    
      await parseScript(req, res);
    
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(JSON.stringify('module.exports.main = () => {\n\treturn "hello";\n}'));
    });

    it('should return 400 if the code does not include module.exports.main', async () => {
      const req = { body: 'const x = 1;' };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
        send: vi.fn()
      };

      await parseScript(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'The code must include a module.exports.main function.' });
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle errors during parsing and return 500', async () => {
      const req = { body: { toString: () => { throw new Error('Parsing error'); } } };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
        send: vi.fn()
      };
      console.error = vi.fn();

      await parseScript(req, res);

      expect(console.error).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(res.send).not.toHaveBeenCalled();
    });
  });

});
