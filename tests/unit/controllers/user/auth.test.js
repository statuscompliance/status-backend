import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import { models } from '../../../../src/models/models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as nodeRedTokenModule from '../../../../src/utils/nodeRedToken.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import * as twofaGenerator from '../../../../src/utils/twofaGenerator.js';
import * as encryption from '../../../../src/config/encryption.js';
import {
  MOCK_TOKEN,
  USER_WITH_2FA_ENABLED,
  USER_WITHOUT_2FA,
  MOCK_OTP_TOKEN,
  MOCK_SECRET,
  MOCK_ENCRYPTED_SECRET,
  DEFAULT_USER,
  adminUser,
  newUserData,
  createRes,
  createSignInReq,
  setupUserMocks,
  mockSuccessfulAuth,
  mock2FAUtils,
  expectCookiesCleared,
  getCookieOptionsForTest,
  getClearCookieOptionsForTest,
  setupCommonMocks,
  restoreEnvironment
} from './test-helpers.js';

describe('Authentication Tests', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  afterEach(() => {
    restoreEnvironment();
  });

  // Test signUp
  describe('signUp', () => {
    const signUpReqBody = { ...newUserData, username: 'existingUser' };

    function createSignUpReq(overrides = {}) {
      return { body: { ...signUpReqBody, ...overrides } };
    }

    it('should return 400 if username exists', async () => {
      setupUserMocks({ 
        findAllValue: [{ username: 'existingUser' }] 
      });
      
      const req = createSignUpReq();
      const res = createRes();

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists' });
    });

    it('should return 201 create user successfully in signUp', async () => {
      setupUserMocks();
      
      const req = createSignUpReq();
      const res = createRes();

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User existingUser created successfully with authority USER',
      });
    });

    it('should return 400 if username exists (case insensitive)', async () => {
      setupUserMocks({ 
        findAllValue: [{ username: 'existinguser' }]
      });
      
      const req = createSignUpReq({ username: 'ExistingUser' });
      const res = createRes();

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists' });
    });

    it('should return 400 if email already exists', async () => {
      setupUserMocks({ 
        findOneValue: { email: 'existing@example.com' } 
      });
      
      const req = createSignUpReq({ 
        username: 'newUser', 
        email: 'existing@example.com' 
      });
      const res = createRes();

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
    });

    it('should hash password before saving user', async () => {
      setupUserMocks();
      const hashSpy = vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      
      const req = createSignUpReq({ 
        username: 'newUser', 
        password: 'plainPassword' 
      });
      const res = createRes();

      await userController.signUp(req, res);

      expect(hashSpy).toHaveBeenCalledWith('plainPassword', 10);
      expect(models.User.create).toHaveBeenCalledWith({
        username: 'newUser',
        password: 'hashedPassword',
        authority: 'USER',
        email: 'new@example.com',
      });
    });

    it('should handle server error during user creation', async () => {
      setupUserMocks();
      const error = new Error('DB error');
      vi.spyOn(models.User, 'create').mockRejectedValue(error);
      
      const req = createSignUpReq({ username: 'errorUser' });
      const res = createRes();

      await userController.signUp(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res, 
        error,
        'Failed to create user'
      );
    });

    it('should create user with default authority USER if not provided', async () => {
      setupUserMocks();
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      
      const req = createSignUpReq({ 
        username: 'defaultUser', 
        email: 'default@example.com',
        authority: undefined
      });
      const res = createRes();

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User defaultUser created successfully with authority USER',
      });
      expect(models.User.create).toHaveBeenCalledWith({
        username: 'defaultUser',
        password: 'hashedPassword',
        authority: 'USER',
        email: 'default@example.com',
      });
    });
  });

  // Test signIn
  describe('signIn', () => {
    it('should return 404 if user not found in signIn', async () => {
      setupUserMocks();
      
      const req = createSignInReq('nonExistentUser');
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 401 if password is invalid in signIn', async () => {
      setupUserMocks({ 
        findOneValue: DEFAULT_USER 
      });
      
      const req = createSignInReq(DEFAULT_USER.username, 'wrongPassword');
      const res = createRes();

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', DEFAULT_USER.password);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid password' });
    });

    it('should return 200 and a token if signIn is successful', async () => {
      mockSuccessfulAuth();
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', DEFAULT_USER.password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: MOCK_TOKEN,
          refreshToken: MOCK_TOKEN,
          username: DEFAULT_USER.username,
          email: DEFAULT_USER.email,
          authority: DEFAULT_USER.authority,
        })
      );

      expect(models.User.update).toHaveBeenCalledWith(
        { refresh_token: MOCK_TOKEN },
        { where: { username: DEFAULT_USER.username } }
      );
    });

    it('should return 400 if username or password is missing', async () => {
      const testCases = [
        { body: { password: 'someLongAndStrongPassword.123.' } },
        { body: { username: 'existingUser' } }
      ];
      
      for (const req of testCases) {
        const res = createRes();
        await userController.signIn(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Username and password are required',
        });
      }
    });

    it('should handle special characters in username', async () => {
      const specialUser = {
        username: 'user!@#',
        password: 'hashedPassword',
        email: 'user@example.com',
        authority: 'userAuthority',
      };
      
      mockSuccessfulAuth(specialUser);
      
      const req = createSignInReq('user!@#');
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: MOCK_TOKEN,
          refreshToken: MOCK_TOKEN,
          username: 'user!@#',
          email: 'user@example.com',
          authority: 'userAuthority',
          nodeRedToken: '',
        })
      );
    });

    it('should be case insensitive for username in signIn', async () => {
      const lowerCaseUser = {
        username: 'existinguser',
        password: 'hashedPassword',
        email: 'user@example.com',
        authority: 'userAuthority',
      };
      
      mockSuccessfulAuth(lowerCaseUser);
      
      const req = createSignInReq('ExistingUser');
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: MOCK_TOKEN,
          refreshToken: MOCK_TOKEN,
          username: lowerCaseUser.username,
          email: lowerCaseUser.email,
          authority: lowerCaseUser.authority,
          nodeRedToken: '',
        })
      );
    });

    it('should generate valid accessToken and refreshToken', async () => {
      mockSuccessfulAuth();
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should handle database error during user lookup in signIn', async () => {
      const error = new Error('Database error');
      vi.spyOn(models.User, 'findOne').mockRejectedValue(error);
      
      const req = createSignInReq();
      const res = createRes();
      
      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });

    it('should call getNodeRedToken and include it in the response for DEVELOPER', async () => {
      const developerUser = {
        ...DEFAULT_USER,
        id: 123,
        username: 'developerUser',
        authority: 'DEVELOPER',
      };
      
      mockSuccessfulAuth(developerUser);
      const getNodeRedTokenSpy = vi.spyOn(nodeRedTokenModule, 'getNodeRedToken')
        .mockResolvedValue({ accessToken: 'mockNodeRedToken' });
      
      const req = createSignInReq('developerUser', 'developerPassword');
      const res = createRes();

      await userController.signIn(req, res);

      expect(getNodeRedTokenSpy).toHaveBeenCalledWith('developerUser', 'developerPassword');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          authority: 'DEVELOPER',
          nodeRedToken: { accessToken: 'mockNodeRedToken' },
        })
      );
    });

    it('should handle Node-RED authentication failure with 403 status code', async () => {
      const developerUser = {
        ...DEFAULT_USER,
        id: 123,
        username: 'developerUser',
        authority: 'DEVELOPER',
      };
      
      mockSuccessfulAuth(developerUser);
      
      // Simulate Node-RED 403 authentication error
      const nodeRedError = new Error('Node-RED authentication failed');
      nodeRedError.statusCode = 403;
      
      vi.spyOn(nodeRedTokenModule, 'getNodeRedToken')
        .mockRejectedValue(nodeRedError);
      
      const req = createSignInReq('developerUser', 'developerPassword');
      const res = createRes();

      await userController.signIn(req, res);

      // Verify token cookies are set despite Node-RED failure
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        MOCK_TOKEN,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
      
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        MOCK_TOKEN,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
      
      // Verify Node-RED token is not sent
      expect(res.cookie).not.toHaveBeenCalledWith(
        'nodeRedToken',
        expect.any(String),
        expect.any(Object)
      );
      
      // Verify response is successful but includes Node-RED access denied message
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        username: developerUser.username,
        email: developerUser.email,
        authority: developerUser.authority,
        accessToken: MOCK_TOKEN,
        refreshToken: MOCK_TOKEN,
        nodeRedAccess: false,
        message: 'Logged in successfully, but Node-RED access was denied. Check Node-RED credentials.'
      });
    });

    it('should re-throw non-403 errors from Node-RED authentication', async () => {
      const developerUser = {
        ...DEFAULT_USER,
        id: 123,
        username: 'developerUser',
        authority: 'DEVELOPER',
      };
      
      mockSuccessfulAuth(developerUser);
      
      // Simulate Node-RED general error (non-403)
      const nodeRedError = new Error('Node-RED general error');
      nodeRedError.statusCode = 500;
      
      vi.spyOn(nodeRedTokenModule, 'getNodeRedToken')
        .mockRejectedValue(nodeRedError);
      
      const req = createSignInReq('developerUser', 'developerPassword');
      const res = createRes();

      await userController.signIn(req, res);

      // Verify error is handled by the outer catch block
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Node-RED general error',
        details: undefined
      });
    });

    it('should set cookies with proper options based on environment', async () => {
      // Test different environments
      const environments = ['development', 'production', 'test'];
      
      for (const env of environments) {
        process.env.NODE_ENV = env;
        mockSuccessfulAuth();
        
        const req = createSignInReq();
        const res = createRes();
        vi.clearAllMocks(); // Clear previous calls

        await userController.signIn(req, res);

        // Only verify cookie was called with accessToken and correct environment-specific options
        const expectedOptions = getCookieOptionsForTest(3600);
        expect(res.cookie).toHaveBeenCalledWith('accessToken', MOCK_TOKEN, expectedOptions);
        
        // Check refreshToken was set with some cookie options (don't check exact maxAge as it's different)
        expect(res.cookie).toHaveBeenCalledWith(
          'refreshToken', 
          MOCK_TOKEN, 
          expect.objectContaining({
            httpOnly: true,
            path: '/',
          })
        );
      }
    });

    // 2FA Tests for signIn
    describe('2FA Authentication in signIn', () => {
      beforeEach(() => {
        mock2FAUtils();
      });

      it('should require 2FA token when user has 2FA enabled', async () => {
        const userWith2FA = { ...USER_WITH_2FA_ENABLED };
        setupUserMocks({ 
          findOneValue: userWith2FA, 
          compareValue: true 
        });
        
        const req = createSignInReq(); // No totpToken
        const res = createRes();

        await userController.signIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          requires2FA: true,
          message: 'Two-factor authentication required. Please provide your TOTP.'
        });
      });

      it('should authenticate successfully with valid 2FA token', async () => {
        setupUserMocks({ 
          findOneValue: USER_WITH_2FA_ENABLED, 
          compareValue: true 
        });
        vi.spyOn(jwt, 'sign').mockReturnValue(MOCK_TOKEN);
        // Make sure the mock is set up before the test
        vi.spyOn(encryption, 'decrypt').mockReturnValue(MOCK_SECRET);
        vi.spyOn(twofaGenerator, 'verifyOTP').mockReturnValue(true);
        
        const req = {
          body: {
            username: DEFAULT_USER.username,
            password: 'correctPassword',
            totpToken: MOCK_OTP_TOKEN
          }
        };
        const res = createRes();

        await userController.signIn(req, res);

        expect(encryption.decrypt).toHaveBeenCalledWith(MOCK_ENCRYPTED_SECRET);
        expect(twofaGenerator.verifyOTP).toHaveBeenCalledWith(MOCK_OTP_TOKEN, MOCK_SECRET);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            accessToken: MOCK_TOKEN,
            refreshToken: MOCK_TOKEN,
            username: USER_WITH_2FA_ENABLED.username,
            email: USER_WITH_2FA_ENABLED.email,
            authority: USER_WITH_2FA_ENABLED.authority,
          })
        );
      });

      it('should reject invalid 2FA token', async () => {
        setupUserMocks({ 
          findOneValue: USER_WITH_2FA_ENABLED, 
          compareValue: true 
        });
        vi.spyOn(encryption, 'decrypt').mockReturnValue(MOCK_SECRET);
        vi.spyOn(twofaGenerator, 'verifyOTP').mockReturnValue(false); // Invalid token
        
        const req = {
          body: {
            username: DEFAULT_USER.username,
            password: 'correctPassword',
            totpToken: 'invalid_token'
          }
        };
        const res = createRes();

        await userController.signIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid 2FA token. Please try again.',
          requires2FA: true
        });
      });

      it('should authenticate without 2FA when user has it disabled', async () => {
        const userWithout2FA = { ...USER_WITHOUT_2FA };
        setupUserMocks({ 
          findOneValue: userWithout2FA, 
          compareValue: true 
        });
        vi.spyOn(jwt, 'sign').mockReturnValue(MOCK_TOKEN);
        
        const req = createSignInReq();
        const res = createRes();

        await userController.signIn(req, res);

        expect(twofaGenerator.verifyOTP).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            accessToken: MOCK_TOKEN,
            refreshToken: MOCK_TOKEN,
          })
        );
      });
    });
  });

  // Test signOut
  describe('signOut', () => {
    it('should return 400 if no refreshToken in signOut', async () => {
      const req = { cookies: {} };
      const res = createRes();

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No refresh token provided' });
    });

    it('should return 204 and clear all cookies when sign out successfully', async () => {
      const token = 'validToken';
      const mockUser = [{ id: 1, username: 'existingUser', refresh_token: token }];
      setupUserMocks({ findOneValue: mockUser });
      
      const req = { cookies: { refreshToken: token } };
      const res = createRes();

      await userController.signOut(req, res);

      expect(models.User.findOne).toHaveBeenCalledWith({ where: { refresh_token: token } });
      expect(models.User.update).toHaveBeenCalledWith(
        { refresh_token: '' },
        { where: { refresh_token: token } }
      );
      expectCookiesCleared(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ message: 'Signed out successfully' });
    });

    it('should return 404 and clear all cookies if user not found for refreshToken', async () => {
      setupUserMocks({ findOneValue: [] });
      
      const req = { cookies: { refreshToken: 'invalidToken' } };
      const res = createRes();

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No user found for provided refresh token',
      });
      expectCookiesCleared(res);
    });

    it('should clear cookies with proper options based on environment', async () => {
      // Test different environments
      const environments = ['development', 'production', 'test'];
      
      for (const env of environments) {
        process.env.NODE_ENV = env;
        setupUserMocks({ findOneValue: [] });
        
        const req = { cookies: { refreshToken: 'invalidToken' } };
        const res = createRes();
        vi.clearAllMocks(); // Clear previous calls

        await userController.signOut(req, res);

        const expectedOptions = getClearCookieOptionsForTest();
        expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expectedOptions);
        expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expectedOptions);
        expect(res.clearCookie).toHaveBeenCalledWith('nodeRedToken', expectedOptions);
      }
    });

    it('should handle database error during signOut process', async () => {
      const error = new Error('Database error during signout');
      vi.spyOn(models.User, 'findOne').mockRejectedValue(error);
      
      const req = { cookies: { refreshToken: 'someToken' } };
      const res = createRes();

      await userController.signOut(req, res);

      expect(models.User.findOne).toHaveBeenCalledWith({
        where: { refresh_token: 'someToken' },
      });
      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Error during sign out process'
      );
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // Test refreshToken
  describe('refreshToken', () => {
    const mockDecodedToken = {
      user_id: DEFAULT_USER._id || 1,
      username: DEFAULT_USER.username,
      authority: DEFAULT_USER.authority
    };

    function setupRefreshTokenTest(mockUser = null, verifyError = null) {
      const req = { cookies: { refreshToken: 'valid-refresh-token' } };
      const res = createRes();
      
      if (verifyError) {
        vi.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
          callback(verifyError, null);
        });
      } else {
        vi.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
          callback(null, mockDecodedToken);
        });
      }
      
      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockUser);
      vi.spyOn(jwt, 'sign').mockReturnValue(MOCK_TOKEN);
      
      return { req, res };
    }

    it('should return 400 if no refresh token provided', async () => {
      const req = { cookies: {} };
      const res = createRes();

      await userController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token is required' });
    });

    it('should return 403 if refresh token is invalid', async () => {
      const { req, res } = setupRefreshTokenTest(null, new Error('Invalid token'));

      await userController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired refresh token' });
    });

    it('should return 403 if user not found with the token', async () => {
      const { req, res } = setupRefreshTokenTest(null);

      await userController.refreshToken(req, res);

      expect(models.User.findOne).toHaveBeenCalledWith({
        where: {
          id: mockDecodedToken.user_id,
          refresh_token: 'valid-refresh-token'
        }
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' });
    });

    it('should return 200 and new accessToken for regular user', async () => {
      const mockUser = {
        id: DEFAULT_USER._id || 1,
        username: DEFAULT_USER.username,
        email: DEFAULT_USER.email,
        authority: DEFAULT_USER.authority,
        refresh_token: 'valid-refresh-token'
      };
      
      const { req, res } = setupRefreshTokenTest(mockUser);

      await userController.refreshToken(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user_id: mockUser.id,
          username: mockUser.username,
          authority: mockUser.authority
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        MOCK_TOKEN,
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        })
      );
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: MOCK_TOKEN
      });
    });

    it('should handle internal server error during refresh', async () => {
      const error = new Error('Unexpected error');
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw error;
      });
      
      const req = { cookies: { refreshToken: 'valid-refresh-token' } };
      const res = createRes();

      await userController.refreshToken(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res, 
        error, 
        'Failed to refresh access token'
      );
    });

    it('should refresh token for admin and developer roles', async () => {
      const mockAdminUser = {
        id: adminUser._id || 2,
        username: adminUser.username,
        email: adminUser.email,
        authority: adminUser.authority,
        refresh_token: 'valid-refresh-token'
      };
      
      const { req, res } = setupRefreshTokenTest(mockAdminUser);

      await userController.refreshToken(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: MOCK_TOKEN,
        })
      );
    });

    it('should set cookies with proper options when refreshing token', async () => {
      // Test different environments
      const environments = ['development', 'production', 'test'];
      
      for (const env of environments) {
        process.env.NODE_ENV = env;
        
        const mockUser = {
          id: DEFAULT_USER._id || 1,
          username: DEFAULT_USER.username,
          email: DEFAULT_USER.email,
          authority: DEFAULT_USER.authority,
          refresh_token: 'valid-refresh-token'
        };
        
        const { req, res } = setupRefreshTokenTest(mockUser);
        vi.clearAllMocks(); // Clear previous calls

        await userController.refreshToken(req, res);

        const expectedOptions = getCookieOptionsForTest(3600);
        expect(res.cookie).toHaveBeenCalledWith('accessToken', MOCK_TOKEN, expectedOptions);
      }
    });
  });

  // Test environment-specific cookie settings
  describe('Cookie environment settings', () => {
    it('should use development cookie settings when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      mockSuccessfulAuth();
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken', 
        MOCK_TOKEN, 
        {
          httpOnly: true,
          path: '/',
          maxAge: expect.any(Number)
        }
      );
    });

    it('should use production cookie settings when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      mockSuccessfulAuth();
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken', 
        MOCK_TOKEN, 
        {
          httpOnly: true,
          path: '/',
          maxAge: expect.any(Number),
          sameSite: 'none',
          secure: true,
          partitioned: true
        }
      );
    });

    it('should use default cookie settings for other environments', async () => {
      process.env.NODE_ENV = 'test';
      mockSuccessfulAuth();
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken', 
        MOCK_TOKEN, 
        {
          httpOnly: true,
          path: '/',
          maxAge: expect.any(Number),
          sameSite: 'lax'
        }
      );
    });
  });
});
