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
  let res;

  const setupMockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  });
  
  const expectErrorResponse = (res, status, errorMessage) => {
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  };

  const mockTimestamp = () => {
    const now = new Date();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    return now;
  };

  const restoreTimers = () => {
    vi.useRealTimers();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    redisSetSpy = vi.spyOn(redis, 'set').mockResolvedValue('OK');
    redisGetSpy = vi.spyOn(redis, 'get');
    redisKeysSpy = vi.spyOn(redis, 'keys');
    redisDelSpy = vi.spyOn(redis, 'del').mockResolvedValue(1);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    res = setupMockRes();
  });

  describe('createScript', () => {
    const validScriptBody = {
      code: 'module.exports.main = () => { return "hello"; };',
      metadata: { description: 'A simple script' },
    };

    it('should create a script successfully and return 201 with the new ID', async () => {
      const req = { body: validScriptBody };

      await createScript(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledOnce();
    });

    it('should return 400 if code is missing', async () => {
      const req = { body: { metadata: {} } };

      await createScript(req, res);

      expectErrorResponse(res, 400, 'Code is required.');
      expect(redisSetSpy).not.toHaveBeenCalled();
    });

    it('should return 400 if code does not include module.exports.main', async () => {
      const req = { body: { code: 'const x = 1;', metadata: {} } };

      await createScript(req, res);

      expectErrorResponse(res, 400, 'The code must include a module.exports.main function.');
      expect(redisSetSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors and return 500', async () => {
      const req = { body: validScriptBody };
      redisSetSpy.mockRejectedValue(new Error('Redis error'));
      
      await createScript(req, res);

      expectErrorResponse(res, 500, 'Internal server error');
    });

    it('should create a script with createdAt timestamp', async () => {
      const req = { body: validScriptBody };
      const now = mockTimestamp();

      await createScript(req, res);

      expect(redisSetSpy).toHaveBeenCalledTimes(1);
      expect(redisSetSpy.mock.calls[0][1]).toContain(`"createdAt":"${now.toISOString()}"`);
      
      restoreTimers();
    });
  });

  describe('getAllScripts', () => {
    it('should return an empty array if no scripts exist', async () => {
      redisKeysSpy.mockResolvedValue([]);
      const req = {};

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

      await getAllScripts(req, res);

      expect(console.error).toHaveBeenCalledWith('Error getting all scripts:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
    });
  });

  describe('getScriptById', () => {
    const testId = 'test-id';

    it('should return the script code with 200 if found', async () => {
      const mockScriptData = JSON.stringify({ code: 'const x = "hello\\nworld";', metadata: {} });
      redisGetSpy.mockResolvedValue(mockScriptData);
      const req = { params: { id: testId } };

      await getScriptById(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith(`script:${testId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('const x = "hello\nworld";');
    });

    it('should return 404 if script is not found', async () => {
      redisGetSpy.mockResolvedValue(null);
      const req = { params: { id: 'non-existent-id' } };

      await getScriptById(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:non-existent-id');
      expectErrorResponse(res, 404, 'Script not found');
    });

    it('should handle Redis errors and return 500', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis error'));
      const req = { params: { id: testId } };

      await getScriptById(req, res);

      expect(console.error).toHaveBeenCalledWith('Error getting script by ID:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
    });
  });

  describe('updateScript', () => {
    const testId = 'test-id';
    const existingScriptData = JSON.stringify({ code: 'old code', metadata: { old: 'data' }, createdAt: '...' });

    it('should update a script successfully and return 200', async () => {
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: testId },
        body: { code: 'new code', metadata: { new: 'data' } },
      };

      await updateScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(redisSetSpy).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });
    });

    it('should update only code if provided', async () => {
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: testId },
        body: { code: 'new code' },
      };

      await updateScript(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(redisSetSpy).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });
    });

    it('should update only metadata if provided', async () => {
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: testId },
        body: { metadata: { new: 'data' } },
      };

      await updateScript(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(redisSetSpy).toHaveBeenCalledOnce();
      expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });
    });

    it('should return 404 if script to update is not found', async () => {
      redisGetSpy.mockResolvedValue(null);
      const req = { params: { id: 'non-existent-id' }, body: { code: 'new code' } };

      await updateScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:non-existent-id');
      expectErrorResponse(res, 404, 'Script not found');
      expect(redisSetSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors and return 500', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis error'));
      const req = { params: { id: testId }, body: { code: 'new code' } };

      await updateScript(req, res);

      expect(console.error).toHaveBeenCalledWith('Error updating script:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
    });

    it('should set updatedAt timestamp when updating a script', async () => {
      redisGetSpy.mockResolvedValue(existingScriptData);
      const req = {
        params: { id: testId },
        body: { code: 'new code' },
      };
      const now = mockTimestamp();

      await updateScript(req, res);
      
      expect(redisSetSpy).toHaveBeenCalledTimes(1);
      expect(redisSetSpy.mock.calls[0][1]).toContain(`"updatedAt":"${now.toISOString()}"`);
      
      restoreTimers();
    });
  });

  describe('deleteScript', () => {
    const testId = 'test-id';

    it('should delete a script successfully and return 200', async () => {
      redisGetSpy.mockResolvedValue(JSON.stringify({ code: '...', metadata: {} }));
      const req = { params: { id: testId } };

      await deleteScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith(`script:${testId}`);
      expect(redisDelSpy).toHaveBeenCalledWith(`script:${testId}`);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Script deleted successfully' });
    });

    it('should return 404 if script to delete is not found', async () => {
      redisGetSpy.mockResolvedValue(null);
      const req = { params: { id: 'non-existent-id' } };

      await deleteScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith('script:non-existent-id');
      expectErrorResponse(res, 404, 'Script not found');
      expect(redisDelSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors and return 500', async () => {
      redisGetSpy.mockRejectedValue(new Error('Redis error'));
      const req = { params: { id: testId } };

      await deleteScript(req, res);

      expect(console.error).toHaveBeenCalledWith('Error deleting script:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
    });

    it('should handle Redis delete errors and return 500', async () => {
      redisGetSpy.mockResolvedValue(JSON.stringify({ code: '...', metadata: {} }));
      redisDelSpy.mockRejectedValue(new Error('Redis delete error'));
      const req = { params: { id: testId } };

      await deleteScript(req, res);

      expect(redisGetSpy).toHaveBeenCalledWith(`script:${testId}`);
      expect(redisDelSpy).toHaveBeenCalledWith(`script:${testId}`);
      expect(console.error).toHaveBeenCalledWith('Error deleting script:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
    });
  });

  describe('deleteAllScripts', () => {
    it('should delete all scripts successfully and return 200', async () => {
      redisKeysSpy.mockResolvedValue(['script:id1', 'script:id2']);
      const req = {};

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisDelSpy).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'All scripts deleted successfully' });
    });

    it('should return 200 even if no scripts exist', async () => {
      redisKeysSpy.mockResolvedValue([]);
      const req = {};

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisDelSpy).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'All scripts deleted successfully' });
    });

    it('should handle Redis errors when getting keys and return 500', async () => {
      redisKeysSpy.mockRejectedValue(new Error('Redis keys error'));
      const req = {};

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(console.error).toHaveBeenCalledWith('Error deleting all scripts:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
      expect(redisDelSpy).not.toHaveBeenCalled();
    });

    it('should handle Redis errors when deleting a script and still return 500', async () => {
      redisKeysSpy.mockResolvedValue(['script:id1', 'script:id2']);
      redisDelSpy.mockRejectedValueOnce(new Error('Redis delete error'));
      const req = {};

      await deleteAllScripts(req, res);

      expect(redisKeysSpy).toHaveBeenCalledWith('script:*');
      expect(redisDelSpy).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenCalledWith('Error deleting all scripts:', expect.any(Error));
      expectErrorResponse(res, 500, 'Internal server error');
    });
  });

  describe('parseScript', () => {
    const setupParseTest = (code) => ({ body: code });
    
    it('should return the stringified and escaped code with 200 if it includes module.exports.main', async () => {
      const req = setupParseTest('module.exports.main = () => {\n    return "hello";\n}');
    
      await parseScript(req, res);
    
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(JSON.stringify('module.exports.main = () => {\n\treturn "hello";\n}'));
    });

    it('should return 400 if the code does not include module.exports.main', async () => {
      const req = setupParseTest('const x = 1;');

      await parseScript(req, res);

      expectErrorResponse(res, 400, 'The code must include a module.exports.main function.');
      expect(res.send).not.toHaveBeenCalled();
    });

    it('should handle errors during parsing and return 500', async () => {
      const req = { body: { toString: () => { throw new Error('Parsing error'); } } };

      await parseScript(req, res);

      expect(console.error).toHaveBeenCalledOnce();
      expectErrorResponse(res, 500, 'Internal server error');
      expect(res.send).not.toHaveBeenCalled();
    });
    
    it('should properly JSON stringify the parsed code', async () => {
      const req = setupParseTest('module.exports.main = () => "hello"');
    
      await parseScript(req, res);
    
      const result = res.send.mock.calls[0][0];
      expect(() => JSON.parse(result)).not.toThrow();
      expect(JSON.parse(result)).toBe('module.exports.main = () => "hello"');
    });
    
    it('should handle multi-line code with mixed indentation', async () => {
      const code = `module.exports.main = () => {
    const a = 1;
        const b = 2;
    return a + b;
}`;
      const req = setupParseTest(code);
    
      await parseScript(req, res);
      
      const expected = `module.exports.main = () => {
\tconst a = 1;
\t\tconst b = 2;
\treturn a + b;
}`;
      
      expect(res.send).toHaveBeenCalledWith(JSON.stringify(expected));
    });
  });
});
