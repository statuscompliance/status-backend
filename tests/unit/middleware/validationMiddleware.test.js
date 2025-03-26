// middleware.test.js
import { describe, it, expect, vi } from 'vitest';
import { checkIdParam, validateUUID, validateParams, isGrafanaUID } from '../../../src/middleware/validation.js'; // Ajusta la ruta
import { validationResult } from 'express-validator';
import { validate as isUUID } from 'uuid';

vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
}));

vi.mock('uuid', () => ({
  validate: vi.fn(),
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
  
  it('should return 400 if param is missing', () => {
    const req = { params: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    validateUUID('id')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing parameter: id' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if param is a valid UUID', () => {
    isUUID.mockImplementation((value) => value === '550e8400-e29b-41d4-a716-446655440000');
    global.isGrafanaUID = vi.fn().mockReturnValue(false);

    const req = { params: { id: '550e8400-e29b-41d4-a716-446655440000' } };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
    };
    const next = vi.fn();

    validateUUID('id')(req, res, next);
    expect(next).toHaveBeenCalled();

    global.isGrafanaUID = undefined;
});

  it('should call next if param is a valid Grafana UID', () => {
    isUUID.mockReturnValue(false);
    global.isGrafanaUID = vi.fn().mockReturnValue(true);

    const req = { params: { id: 'validgrafana123' } };
    const res = {};
    const next = vi.fn();

    validateUUID('id')(req, res, next);
    expect(next).toHaveBeenCalled();

    global.isGrafanaUID = undefined;
  });

  it('should return 400 if param is invalid', () => {
    isUUID.mockReturnValue(false);
    global.isGrafanaUID = vi.fn().mockReturnValue(false);

    const req = { params: { id: 'invalid-uuid' } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    validateUUID('id')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid UUID for parameter: id' });
    expect(next).not.toHaveBeenCalled();

    global.isGrafanaUID = undefined;
  });
});

function mockValidationResult(isEmpty, errors = []) {
  validationResult.mockReturnValue({
    isEmpty: () => isEmpty,
    array: () => errors,
  });
}

describe('validateParams', () => {

  it('should call next if no validation errors', () => {
    mockValidationResult(true);

    const req = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    validateParams(req, res, next);

    expect(validationResult).toHaveBeenCalledWith(req);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 400 if validation errors', () => {
    mockValidationResult(false, [{ msg: 'error1' }, { msg: 'error2' }]);

    const req = {};
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    validateParams(req, res, next);

    expect(validationResult).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'error1' }, { msg: 'error2' }] });
    expect(next).not.toHaveBeenCalled();
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