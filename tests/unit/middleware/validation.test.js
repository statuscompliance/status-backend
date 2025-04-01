import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkIdParam, validateUUID, validateParams, isGrafanaUID } from '../../../src/middleware/validation.js';
import { validate as isUUID } from 'uuid';


vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
}));

vi.mock('uuid', () => ({
  validate: vi.fn(),
}));

describe('checkIdParam Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should call next if id param is present', () => {
    mockReq.params = { id: '123' };
    checkIdParam(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 400 if id param is missing', () => {
    mockReq.params = {};
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should call next if the parameter is a valid UUID in params', () => {
    mockReq.params = { userId: '5f1b7114-b133-487b-9442-2b48bf60807c' };
    isUUID.mockReturnValue(true);
    const middleware = validateUUID('userId');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should call next if the parameter is a valid Grafana UID in body', () => {
    mockReq.body = { dashboardUid: 'validgrafana123' };
    isUUID.mockReturnValue(false);
    const middleware = validateUUID('dashboardUid');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 400 with error if the parameter is missing (params)', () => {
    mockReq.params = {};
    const middleware = validateUUID('userId');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing parameter: userId' });
  });

  it('should return 400 with error if the parameter is missing (query)', () => {
    mockReq.query = {};
    const middleware = validateUUID('userId');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing parameter: userId' });
  });

  it('should return 400 with error if the parameter is missing (body)', () => {
    mockReq.body = {};
    const middleware = validateUUID('userId');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing parameter: userId' });
  });

  it('should return 400 with error if the parameter is not a valid UUID or Grafana UID', () => {
    mockReq.body = { userId: 'invalid-uuid' };
    isUUID.mockReturnValue(false);
    const middleware = validateUUID('userId');
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid UUID for parameter: userId' });
  });
});

describe('validateParams Middleware', () => {
  
  it('should call next if there are no validation errors', () => {
    const mockReq = {};
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const mockValidationResult = vi.fn().mockReturnValue({ isEmpty: () => true, array: () => [] });
    vi.mock('express-validator', () => ({
      validationResult: mockValidationResult,
    }));

    validateParams(mockReq, mockRes, mockNext, mockValidationResult);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should NOT call next and should send 400 if validationResult indicates errors', () => {
    const mockReq = {};
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const errorsArray = [{ msg: 'Test Error' }];
    const mockValidationResult = vi.fn().mockReturnValue({
      isEmpty: () => false,
      array: () => errorsArray,
    });
    vi.mock('express-validator', () => ({
      validationResult: mockValidationResult,
    }));

    validateParams(mockReq, mockRes, mockNext, mockValidationResult);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ errors: errorsArray });
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