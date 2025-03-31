// middleware.test.js
import { describe, it, expect, vi } from 'vitest';
import { checkIdParam, validateUUID, validateParams, isGrafanaUID } from '../../../src/middleware/validation.js';
import { validationResult } from 'express-validator';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
}));

describe('checkIdParam', () => {

  it('should call next if id param is present', () => {
    const req = { params: { id: '123' } };
    const res = {};
    const next = vi.fn();

    checkIdParam(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if id param is missing', () => {
    const req = { params: {} };
    const res = {
      status: vi.fn().mockReturnThis(), // Uses mockReturnThis()
      json: vi.fn(),
    };
    const next = vi.fn();

    checkIdParam(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required parameter: id' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateUUID', () => {

  it('should call next if the parameter is a valid UUID in params', () => {
    const req = { body: { userId: '5f1b7114-b133-487b-9442-2b48bf60807c' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    const middleware = validateUUID('userId');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should call next if the parameter is a valid Grafana UID in body', () => {
    const req = { body: { dashboardUid: '5f1b7114-b133-487b-9442-2b48bf60807c' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    const middleware = validateUUID('dashboardUid');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 400 with error if the parameter is missing', () => {
    const req = { body: {} };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    const middleware = validateUUID('userId');
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing parameter: userId' });
  });

  it('should return 400 with error if the parameter is not a valid UUID or Grafana UID', () => {
    const req = { body: { userId: 'invalid-uuid' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    const middleware = validateUUID('userId');
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid UUID for parameter: userId' });
  });

});

describe('validateParams', () => {
  
  it('should call next if there are no validation errors', () => {
    const req = {};
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

    validateParams(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should NOT call next and should send 400 if validationResult indicates errors', () => {
    const req = {};
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    const errorsArray = [{ msg: 'Test Error' }];
    const mockErrors = { isEmpty: () => false, array: () => errorsArray };

    validationResult.mockReturnValue(mockErrors);

    validateParams(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: errorsArray });
  });
  
});

describe('isGrafanaUID', () => {

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