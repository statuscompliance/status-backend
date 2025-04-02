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
    mockReq = { params: {}, query: {}, body: {} }; // Inicializamos todos los posibles req properties
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should call next if id param is present', () => {
    mockReq.params.id = '123'; // Directamente asignamos el valor
    checkIdParam(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1); // Usamos toHaveBeenCalledTimes para ser explícitos
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

describe('validateParams Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  const mockValidationResult = vi.fn();
  const { validateParams } = require('../../../src/middleware/validation');

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { params: {}, query: {}, body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();

    vi.doMock('express-validator', () => ({
      validationResult: mockValidationResult,
    }));
  });

  it('should call next if there are no validation errors', () => {
    mockValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    validateParams(mockReq, mockRes, mockNext, mockValidationResult);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
    expect(mockValidationResult).toHaveBeenCalledTimes(1);
  });

  const errorCases = [
    {
      name: 'should return 400 with single validation error',
      mockReturnValue: { isEmpty: () => false, array: () => [{ msg: 'Test Error' }] },
      expectedStatus: 400,
      expectedJson: { errors: [{ msg: 'Test Error' }] },
    },
    {
      name: 'should return 400 with multiple validation errors',
      mockReturnValue: { isEmpty: () => false, array: () => [{ msg: 'Error 1' }, { msg: 'Error 2' }] },
      expectedStatus: 400,
      expectedJson: { errors: [{ msg: 'Error 1' }, { msg: 'Error 2' }] },
    },
  ];

  errorCases.forEach(({ name, mockReturnValue, expectedStatus, expectedJson }) => {
    it(name, () => {
      mockValidationResult.mockReturnValue(mockReturnValue);
      validateParams(mockReq, mockRes, mockNext, mockValidationResult);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
      expect(mockRes.json).toHaveBeenCalledWith(expectedJson);
      expect(mockValidationResult).toHaveBeenCalledTimes(1);
    });
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