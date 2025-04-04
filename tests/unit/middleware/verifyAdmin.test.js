import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyAdmin } from '../../../src/middleware/verifyAdmin.js';
import * as tokenUtils from '../../../src/utils/tokenUtils.js';

const mockRequest = (headers = {}) => ({ headers });
const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res;
};
const mockNext = vi.fn();

describe('Middleware verifyAdmin', () => {
  let verifyAccessTokenSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    verifyAccessTokenSpy = vi.spyOn(tokenUtils, 'verifyAccessToken');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Should return 401 if a token is not provided.', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    // If no token is provided, the middleware should return a 401 error
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('Should return 401 if the token is invalid.', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({ decoded: null, error: 'Invalid token' });

    const req = mockRequest({ 'x-access-token': 'invalid_token' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    // If the token is invalid, return a 401 Unauthorized error
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Invalid token' });
  });

  it('Should return 401 if the token is expired.', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({ decoded: null, error: 'Token expired' });

    const req = mockRequest({ 'x-access-token': 'expired_token' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Invalid token' });
  });

  it('Should return 401 for a malformed token.', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({ decoded: undefined, error: 'Malformed token' });

    const req = mockRequest({ 'x-access-token': 'malformed_token' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Invalid token' });
  });

  it('Should return 403 if the user does not have ADMIN privileges.', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'USER' },
      error: null,
    });

    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });
  
  it('Should allow ADMIN users to proceed.', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'ADMIN' },
      error: null,
    });

    const req = mockRequest({ 'x-access-token': 'valid_admin_token' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    // If the user is an ADMIN, `next()` should be called to continue processing the request
    expect(mockNext).toHaveBeenCalled();

    // No status or JSON response should be triggered in this case
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('Should return 401 for an empty token.', async () => {
    const req = mockRequest({ 'x-access-token': '' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('Should return 401 for a token with special characters.', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: null,
      error: 'Invalid token',
    });

    const req = mockRequest({ 'x-access-token': '!@#$%^&*()' });
    const res = mockResponse();

    await verifyAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: Invalid token' });
  });
});
