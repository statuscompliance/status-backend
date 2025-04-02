import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { verifyAuthority } from '../../../src/middleware/verifyAuth';
import * as tokenUtils from '../../../src/utils/tokenUtils.js';
import jwt from 'jsonwebtoken';
import * as userController from '../../../src/controllers/user.controller.js';

const mockRequest = (headers = {}, cookies = {}, user = null) => ({
  headers,
  cookies,
  user,
});


const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  res.cookie = vi.fn().mockReturnThis();
  res.clearCookie = vi.fn().mockReturnThis();
  return res;
};

// Mock next function for middleware.
const mockNext = vi.fn();

let verifyAccessTokenSpy;
let refreshAccessTokenSpy;

const setupMocks = ({ verifyReturnValue, refreshReturnValue }) => {
  verifyAccessTokenSpy.mockResolvedValueOnce(verifyReturnValue);
  refreshAccessTokenSpy.mockResolvedValueOnce(refreshReturnValue);
};

// Setup mock functions before each test.
describe('verifyAuthority middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on verifyAccessToken and mock its implementation.
    verifyAccessTokenSpy = vi.spyOn(tokenUtils, 'verifyAccessToken');
    refreshAccessTokenSpy = vi.spyOn(tokenUtils, 'refreshAccessToken');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('should return 401 if access token is missing from both header and cookie', async () => {
    const req = mockRequest({}, {}); // No accessToken in header or cookie
    const res = mockResponse();
  
    await verifyAuthority(req, res, mockNext);
  
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('should return 401 if token is invalid', async () => {
    setupMocks({
      verifyReturnValue: { decoded: null, error: { name: 'JsonWebTokenError' } },
      refreshReturnValue: { newAccessToken: null, user: null, error: 'Invalid token' }
    });

    const req = mockRequest({ 'x-access-token': 'invalid_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 401 if refresh token is invalid', async () => {
    setupMocks({
      verifyReturnValue: { decoded: null, error: { name: 'TokenExpiredError' } },
      refreshReturnValue: { newAccessToken: null, user: null, error: 'Invalid refresh token' }
    });

    const req = mockRequest({ 'x-access-token': 'expired_token' }, { refreshToken: 'invalid_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
  });
  it('should return 401 if refresh token is not provided when access token expired', async () => {
    setupMocks({
      verifyReturnValue: { decoded: null, error: { name: 'TokenExpiredError' } },
      refreshReturnValue: { newAccessToken: null, user: null, error: null }
    });

    const req = mockRequest({ 'x-access-token': 'expired_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token not provided' });
  });
  it('should return 403 if user has invalid authority', async () => {
    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();

    verifyAccessTokenSpy.mockResolvedValueOnce({ decoded: { authority: 'GUEST' }, error: null });

    await verifyAuthority(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should proceed if token is valid and user has a valid authority', async () => {
    setupMocks({
      verifyReturnValue: { decoded: { authority: 'ADMIN' }, error: null },
      refreshReturnValue: { newAccessToken: null, user: null, error: null }
    });

    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  it('should proceed to next middleware if token is valid and authority is allowed', async () => {
    verifyAccessTokenSpy.mockResolvedValueOnce({
      decoded: { authority: 'ADMIN' },
      error: null,
    });
  
    const req = mockRequest({ 'x-access-token': 'valid_token' });
    const res = mockResponse();
    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
  it('should prioritize header token over cookie token', async () => {
    setupMocks({
      verifyReturnValue: { decoded: { authority: 'ADMIN' }, error: null },
      refreshReturnValue: { newAccessToken: null, user: null, error: null }
    });

    const req = mockRequest({ 'x-access-token': 'header_token' }, { accessToken: 'cookie_token' });
    const res = mockResponse();

    await verifyAuthority(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow valid authorities (ADMIN, USER, DEVELOPER)', async () => {
    const validAuthorities = ['ADMIN', 'USER', 'DEVELOPER'];

    for (const authority of validAuthorities) {
      setupMocks({
        verifyReturnValue: { decoded: { authority }, error: null },
        refreshReturnValue: { newAccessToken: null, user: null, error: null }
      });

      const req = mockRequest({ 'x-access-token': 'valid_token' });
      const res = mockResponse();

      await verifyAuthority(req, res, mockNext);
      expect(mockNext).toHaveBeenCalled();
    }
  });
  it('should allow valid authorities (ADMIN, USER, DEVELOPER)', async () => {
    const validRoles = ['ADMIN', 'USER', 'DEVELOPER'];
  
    for (const role of validRoles) {
      // Crear mocks de req, res, y next
      const req = mockRequest({ 'x-access-token': 'valid_token' });
      const res = mockResponse();
      const next = mockNext;
  
      // Configurar los mocks manualmente
      verifyAccessTokenSpy.mockResolvedValueOnce({ decoded: { authority: role }, error: null });
  
      // Ejecutar el middleware
      await verifyAuthority(req, res, next);
  
      // Verificar que el middleware llamó a next() correctamente
      expect(next).toHaveBeenCalled();
    }
  });
  
  it('should block invalid authorities (GUEST, UNKNOWN, etc.)', async () => {
    const invalidRoles = ['GUEST', 'UNKNOWN', 'VIEWER'];
  
    for (const role of invalidRoles) {
      // Crear mocks de req, res, y next
      const req = mockRequest({ 'x-access-token': 'valid_token' });
      const res = mockResponse();
      const next = mockNext;
  
      // Configurar los mocks manualmente
      verifyAccessTokenSpy.mockResolvedValueOnce({ decoded: { authority: role }, error: null });
  
      // Ejecutar el middleware
      await verifyAuthority(req, res, next);
  
      // Verificar que el middleware bloqueó la petición correctamente
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    }
    
  });

  it('should not attempt to refresh access token if refresh token is missing', async () => {
    setupMocks({
      verifyReturnValue: { decoded: null, error: { name: 'TokenExpiredError' } },
      refreshReturnValue: { newAccessToken: null, user: null, error: null }
    });
  
    const req = mockRequest({ 'x-access-token': 'expired_token' }); // No refresh token
    const res = mockResponse();
  
    await verifyAuthority(req, res, mockNext);
  
    expect(refreshAccessTokenSpy).not.toHaveBeenCalled(); // Verify that no attempt is made to refresh
  });

  it('should set cookies with correct properties for new tokens', async () => {
    // Set REFRESH_JWT_SECRET for testing
    const mockJWT = 'refresh_test_secret';
  
    // Mock tokenUtils.verifyAccessToken to simulate TokenExpiredError
    const verifyAccessTokenSpy = vi.spyOn(tokenUtils, 'verifyAccessToken').mockResolvedValue({
      decoded: null,
      error: { name: 'TokenExpiredError' },
    });
  
    // Generate a valid refresh token with user_id
    const refreshToken = jwt.sign(
      { user_id: 'testUserId' },
      mockJWT,
      { expiresIn: '1d' }
    );
  
    const req = mockRequest({ 'x-access-token': 'nodeRedAccessToken' }, { refreshToken: refreshToken });
    const res = mockResponse();
  
    // Mock tokenUtils.refreshAccessToken
    const refreshAccessTokenSpy = vi.spyOn(tokenUtils, 'refreshAccessToken').mockResolvedValue({
      newAccessToken: 'newAccessToken123',
      user: { username: 'testUser', password: 'testPassword' },
      error: null,
    });
  
    // Mock getNodeRedToken
    const getNodeRedTokenSpy = vi.spyOn(userController, 'getNodeRedToken').mockResolvedValue('mockNodeRedToken');
  
    await verifyAuthority(req, res, mockNext);
  
    // Validate the cookie properties
    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'newAccessToken123', expect.objectContaining({
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    }));
  
    // Restore the original implementation
    verifyAccessTokenSpy.mockRestore();
    refreshAccessTokenSpy.mockRestore();
    getNodeRedTokenSpy.mockRestore();
  });
});
