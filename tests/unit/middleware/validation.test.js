import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkIdParam, isGrafanaUID, validateUUID } from '../../../src/middleware/validation.js';
import { validate as isUUID } from 'uuid';

vi.mock('uuid', () => ({
  validate: vi.fn(),
}));

describe('checkIdParam Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { params: {}, query: {}, body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should call next if id param is present', () => {
    mockReq.params.id = '123';
    checkIdParam(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 400 if id param is missing', () => {
    checkIdParam(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing required parameter: id' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('validateUUID Middleware', () => {

  let mockReq;
  let mockRes;
  let mockNext;
  const mockIsGrafanaUID = vi.fn();
  const userId = '5f1b7114-b133-487b-9442-2b48bf60807c';
  const dashboardUid = 'validgrafana123';
  const invalidUuid = 'invalid-uuid';
  const missingParamError = 'Missing parameter: userId';
  const invalidUuidError = 'Invalid UUID for parameter: userId';

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { params: {}, query: {}, body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.doMock('../../../src/middleware/validation', () => ({
      ...vi.importActual('../../../src/middleware/validation'),
      isGrafanaUID: mockIsGrafanaUID,
    }));
  });

  const runUUIDValidationTest = (reqField, reqValue, expectedError) => {
    mockReq[reqField] = reqValue;
    validateUUID('userId')(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expectedError });
    expect(mockNext).not.toHaveBeenCalled();
  };

  it('should call next if the parameter is a valid UUID in params', () => {
    mockReq.params.userId = userId;
    isUUID.mockReturnValue(true);
    mockIsGrafanaUID.mockReturnValue(false);
    validateUUID('userId')(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next if the parameter is a valid Grafana UID in body', () => {
    mockReq.body.dashboardUid = dashboardUid;
    isUUID.mockReturnValue(false);
    mockIsGrafanaUID.mockReturnValue(true);
    validateUUID('dashboardUid')(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 400 with error if the parameter is missing (params)', () => {
    runUUIDValidationTest('params', mockReq, missingParamError)
  });

  it('should return 400 with error if the parameter is missing (query)', () => {
    runUUIDValidationTest('query', mockReq, missingParamError)
  });

  it('should return 400 with error if the parameter is missing (body)', () => {
    runUUIDValidationTest('body', mockReq, missingParamError)
  });

  it('should return 400 with error if the parameter is not a valid UUID or Grafana UID', () => {
    mockReq.body.userId = invalidUuid;
    isUUID.mockReturnValue(false);
    mockIsGrafanaUID.mockReturnValue(false);
    validateUUID('userId')(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: invalidUuidError });
  });

  it('should return 400 with error if the parameter is present but empty', () => {
    mockReq.body.userId = '';
    isUUID.mockReturnValue(false);
    mockIsGrafanaUID.mockReturnValue(false);
    validateUUID('userId')(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: missingParamError });
  });
});

describe('isGrafanaUID Function', () => {

  it('should return true for a valid Grafana UID', () => {
    expect(isGrafanaUID('validgrafana123')).toBe(true);
    expect(isGrafanaUID('VALIDGRAFANA123')).toBe(true);
    expect(isGrafanaUID('v4l1dgr4f4n4123')).toBe(true);
    expect(isGrafanaUID('1234567890abcdef12345678')).toBe(true);
  });

  it('should return false for an invalid Grafana UID', () => {
    expect(isGrafanaUID('short')).toBe(false);
    expect(isGrafanaUID('tooloooooooooooooooooooooooooooong')).toBe(false);
    expect(isGrafanaUID('invalid-chars')).toBe(false);
    expect(isGrafanaUID('')).toBe(false);
  });
});
