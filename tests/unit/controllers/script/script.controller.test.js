import { describe, it, expect, vi , beforeEach} from 'vitest';
import {
  createScript,
  getAllScripts,
  getScriptById,
  updateScript,
  deleteScript,
  deleteAllScripts,
  parseScript,
} from '../../../../src/controllers/script.controller';

const mockUuidv4 = vi.fn();

const mockRedis = {
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue(null),
  keys: vi.fn().mockResolvedValue([]),
  del: vi.fn().mockResolvedValue(1),
};

const mockReq = (body = {}, params = {}) => ({ body, params });
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
};

describe('createScript', () => {

  beforeEach(() => {
    mockUuidv4.mockReset();
    mockRedis.set.mockClear();
  });

  it('should successfully create a new script', async () => {
    const mockId = 'test-uuid';
    mockUuidv4.mockReturnValue(mockId);
    const req = mockReq({ code: 'module.exports.main = () => {};', metadata: { name: 'test' } });
    const res = mockRes();

    await createScript(req, res, mockUuidv4, mockRedis);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Script created successfully', id: mockId });
    expect(mockRedis.set).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if code is missing', async () => {
    const req = mockReq({ metadata: { name: 'test' } });
    const res = mockRes();

    await createScript(req, res, mockUuidv4, mockRedis);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Code is required.' });
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('should return 400 if code does not include module.exports.main', async () => {
    const req = mockReq({ code: 'const a = 1;', metadata: { name: 'test' } });
    const res = mockRes();

    await createScript(req, res, mockUuidv4, mockRedis);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'The code must include a module.exports.main function.' });
    expect(mockRedis.set).not.toHaveBeenCalled();
  });
});

describe('getAllScripts', () => {
  beforeEach(() => {
    mockRedis.keys.mockClear();
    mockRedis.get.mockClear();
  });

  it('should return a list of all scripts', async () => {
    mockRedis.keys.mockResolvedValue(['script:id1', 'script:id2']);
    mockRedis.get.mockResolvedValueOnce(JSON.stringify({ code: '...', metadata: {} }))
      .mockResolvedValueOnce(JSON.stringify({ code: '...', metadata: {} }));
    const req = mockReq();
    const res = mockRes();

    await getAllScripts(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { id: 'id1', code: '...', metadata: {} },
      { id: 'id2', code: '...', metadata: {} },
    ]);
    expect(mockRedis.keys).toHaveBeenCalledWith('script:*');
    expect(mockRedis.get).toHaveBeenCalledTimes(2);
  });

  it('should return an empty array if no scripts exist', async () => {
    mockRedis.keys.mockResolvedValue([]);
    const req = mockReq();
    const res = mockRes();

    await getAllScripts(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
    expect(mockRedis.keys).toHaveBeenCalledWith('script:*');
    expect(mockRedis.get).not.toHaveBeenCalled();
  });
});

describe('getScriptById', () => {
  beforeEach(() => {
    mockRedis.get.mockClear();
  });

  it('should return the script code if found', async () => {
    const mockId = 'test-id';
    mockRedis.get.mockResolvedValue(JSON.stringify({ code: 'module.exports.main = () => { console.log("hello"); };' }));
    const req = mockReq({}, { id: mockId });
    const res = mockRes();

    await getScriptById(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('module.exports.main = () => { console.log("hello"); };');
    expect(mockRedis.get).toHaveBeenCalledWith('script:test-id');
  });

  it('should return 404 if script is not found', async () => {
    const mockId = 'non-existent-id';
    mockRedis.get.mockResolvedValue(null);
    const req = mockReq({}, { id: mockId });
    const res = mockRes();

    await getScriptById(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Script not found' });
    expect(mockRedis.get).toHaveBeenCalledWith('script:non-existent-id');
  });
});

describe('updateScript', () => {
  beforeEach(() => {
    mockRedis.get.mockClear();
    mockRedis.set.mockClear();
  });

  it('should successfully update an existing script', async () => {
    const mockId = 'existing-id';
    mockRedis.get.mockResolvedValue(JSON.stringify({ code: 'old code', metadata: { version: 1 }, createdAt: '...' }));
    const req = mockReq({ code: 'new code', metadata: { version: 2 } }, { id: mockId });
    const res = mockRes();

    await updateScript(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Script updated successfully' });
    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).toHaveBeenCalledWith('script:existing-id');
  });

  it('should return 404 if script to update is not found', async () => {
    const mockId = 'non-existent-id';
    mockRedis.get.mockResolvedValue(null);
    const req = mockReq({ code: 'new code' }, { id: mockId });
    const res = mockRes();

    await updateScript(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Script not found' });
    expect(mockRedis.get).toHaveBeenCalledWith('script:non-existent-id');
    expect(mockRedis.set).not.toHaveBeenCalled();
  });
});

describe('deleteScript', () => {
  beforeEach(() => {
    mockRedis.get.mockClear();
    mockRedis.del.mockClear();
  });

  it('should successfully delete a script', async () => {
    const mockId = 'existing-id';
    mockRedis.get.mockResolvedValue(JSON.stringify({ code: 'some code' }));
    const req = mockReq({}, { id: mockId });
    const res = mockRes();

    await deleteScript(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Script deleted successfully' });
    expect(mockRedis.get).toHaveBeenCalledWith('script:existing-id');
    expect(mockRedis.del).toHaveBeenCalledWith('script:existing-id');
  });

  it('should return 404 if script to delete is not found', async () => {
    const mockId = 'non-existent-id';
    mockRedis.get.mockResolvedValue(null);
    const req = mockReq({}, { id: mockId });
    const res = mockRes();

    await deleteScript(req, res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Script not found' });
    expect(mockRedis.get).toHaveBeenCalledWith('script:non-existent-id');
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

describe('deleteAllScripts', () => {
  beforeEach(() => {
    mockRedis.keys.mockClear();
    mockRedis.del.mockClear();
  });

  it('should successfully delete all scripts', async () => {
    mockRedis.keys.mockResolvedValue(['script:id1', 'script:id2', 'script:id3']);
    const res = mockRes();

    await deleteAllScripts(res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'All scripts deleted successfully' });
    expect(mockRedis.keys).toHaveBeenCalledWith('script:*');
    expect(mockRedis.del).toHaveBeenCalledTimes(3);
    expect(mockRedis.del).toHaveBeenCalledWith('script:id1');
    expect(mockRedis.del).toHaveBeenCalledWith('script:id2');
    expect(mockRedis.del).toHaveBeenCalledWith('script:id3');
  });

  it('should handle no scripts to delete gracefully', async () => {
    mockRedis.keys.mockResolvedValue([]);
    const res = mockRes();

    await deleteAllScripts(res, mockRedis);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'All scripts deleted successfully' });
    expect(mockRedis.keys).toHaveBeenCalledWith('script:*');
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

describe('parseScript', () => {

  it('should successfully parse and stringify code', async () => {
    const code = 'module.exports.main = () => {\n    console.log("hello");\n};';
    const req = mockReq(code);
    const res = mockRes();
    const expectedParsedCode = JSON.stringify('module.exports.main = () => {\n\tconsole.log("hello");\n};');

    await parseScript(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expectedParsedCode);
  });

  it('should return 400 if code does not include module.exports.main', async () => {
    const code = 'const a = 1;';
    const req = mockReq(code);
    const res = mockRes();

    await parseScript(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'The code must include a module.exports.main function.' });
  });
});
