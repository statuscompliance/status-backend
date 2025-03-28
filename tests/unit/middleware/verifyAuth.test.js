import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { verifyAuthority } from '../../../src/middleware/verifyAuth';
import * as tokenUtils from '../../../src/utils/tokenUtils.js';

const mockRequest = (headers = {}, cookies = {}) => ({
  headers,
  cookies,
});

const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  res.cookie = vi.fn().mockReturnThis();
  return res;
};
// Mock next function for middleware.
const mockNext = vi.fn();

// Setup mock functions before each test.
describe('verifyAuthority middleware', () => {
  let verifyAccessTokenSpy;
  let refreshAccessTokenSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on verifyAccessToken and mock its implementation.
    verifyAccessTokenSpy = vi.spyOn(tokenUtils, 'verifyAccessToken').mockImplementation(async () => {
      return {
        decoded: null,
        error: { name: 'JsonWebTokenError' },
      };
    });
    // Spy on refreshAccessToken and mock its resolved value.
    refreshAccessTokenSpy = vi.spyOn(tokenUtils, 'refreshAccessToken').mockResolvedValue({
      newAccessToken: 'newAccessToken123',
      user: { id: 1, username: 'testUser', authority: 'USER' },
      error: null,
    });
  });
  // Restore mock functions after each test.
  afterEach(() => {
    vi.restoreAllMocks();
    verifyAccessTokenSpy.mockRestore();
    refreshAccessTokenSpy.mockRestore();
  });
  it('should return 401 if no access token is provided', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();

    await verifyAuthority(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('should return 401 if token is invalid or expired (generic error)', async () => {
    verifyAccessTokenSpy.mockImplementationOnce(() => ({
      decoded: null,
      error: { name: 'JsonWebTokenError' },
    }));

    const req = mockRequest({ 'x-access-token': 'invalid_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 if refresh token is not provided when access token expired', async () => {
    verifyAccessTokenSpy.mockImplementationOnce(() => ({
      decoded: null,
      error: { name: 'TokenExpiredError' },
    }));

    const req = mockRequest({ 'x-access-token': 'expired_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token not provided' });
  });

  it('should return 401 if refreshAccessToken returns an error', async () => {
    // Expired token and refresh error.
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: null,
      error: { name: 'TokenExpiredError' },
    });
    refreshAccessTokenSpy.mockResolvedValueOnce({
      newAccessToken: null,
      user: null,
      error: 'Invalid refresh token',
    });
    const req = mockRequest(
      { 'x-access-token': 'expired_token' },
      { refreshToken: 'invalid_refresh_token' }
    );
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
  });

  it('should return 403 if user does not have a valid authority', async () => {
    verifyAccessTokenSpy.mockImplementationOnce(() => ({
      decoded: { authority: 'GUEST' },
      error: null,
    }));

    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should proceed if token is valid and user has a valid authority', async () => {
    verifyAccessTokenSpy.mockImplementationOnce(() => ({
      decoded: { authority: 'ADMIN' },
      error: null,
    }));

    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use the header token if both header and cookie are provided', async () => {
    // Valid header token.
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'ADMIN' },
      error: null,
    });
    const req = mockRequest({ 'x-access-token': 'header_token' }, { accessToken: 'cookie_token' });
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    // Expect next() to be called, indicating that the valid header token was used.
    expect(mockNext).toHaveBeenCalled();
  });
  it('should return 403 if user does not have a valid authority', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'GUEST' },
      error: null,
    });
    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });
  it('should proceed if token is valid and user has a valid authority', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'ADMIN' },
      error: null,
    });
    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  it('should use header token when req.cookies is undefined', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'ADMIN' },
      error: null,
    });
    const req = mockRequest({ 'x-access-token': 'header_token' });
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  it('should use header token when req.cookies is empty', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'ADMIN' },
      error: null,
    });
    const req = mockRequest({ 'x-access-token': 'header_token' }, {}); // req.cookies is empty
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
