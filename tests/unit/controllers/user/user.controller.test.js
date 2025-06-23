import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import { models } from '../../../../src/models/models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as nodeRedTokenModule from '../../../../src/utils/nodeRedToken.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import { 
  DEFAULT_USER, 
  adminUser,
  newUserData 
} from '../../../../tests/utils/sampleUserData.js';

// Constants for reuse
const MOCK_TOKEN = 'mockToken';

// Save original environment
const originalEnv = process.env.NODE_ENV;

// Helper to create simple mock req/res objects
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

// Helper function to create signin request
function createSignInReq(username = DEFAULT_USER.username, password = 'correctPassword') {
  return { body: { username, password } };
}

// Helper function to mock successful auth
function mockSuccessfulAuth(user = DEFAULT_USER) {
  setupUserMocks({ 
    findOneValue: user, 
    compareValue: true 
  });
  vi.spyOn(jwt, 'sign').mockReturnValue(MOCK_TOKEN);
}

// Helper to setup common mocks for tests
function setupUserMocks({
  findOneValue = null,
  findAllValue = [],
  compareValue = false,
  createValue = {},
  updateValue = [1],
} = {}) {
  vi.spyOn(models.User, 'findOne').mockResolvedValue(findOneValue);
  vi.spyOn(models.User, 'findAll').mockResolvedValue(findAllValue);
  vi.spyOn(bcrypt, 'compare').mockResolvedValue(compareValue);
  vi.spyOn(models.User, 'create').mockResolvedValue(createValue);
  vi.spyOn(models.User, 'update').mockResolvedValue(updateValue);
  return { findOne: models.User.findOne, findAll: models.User.findAll };
}

// Helper for common cookie clear expectations based on environment
function expectCookiesCleared(res, includeNodeRed = true) {
  const cookieOptions = getClearCookieOptionsForTest();
  
  expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', cookieOptions);
  expect(res.clearCookie).toHaveBeenCalledWith('accessToken', cookieOptions);
  if (includeNodeRed) {
    expect(res.clearCookie).toHaveBeenCalledWith('nodeRedToken', cookieOptions);
  }
}

// Helper to get expected cookie options based on current NODE_ENV
function getCookieOptionsForTest(maxAge = 3600) {
  if (process.env.NODE_ENV === 'development') {
    return { 
      httpOnly: true, 
      path: '/',
      maxAge: maxAge * 1000 
    };
  } else if (process.env.NODE_ENV === 'production') {
    return { 
      httpOnly: true, 
      path: '/',
      maxAge: maxAge * 1000, 
      sameSite: 'none', 
      secure: true, 
      partitioned: true 
    };
  } else {
    return { 
      httpOnly: true, 
      path: '/',
      maxAge: maxAge * 1000, 
      sameSite: 'lax' 
    };
  }
}

// Helper to get expected cookie clear options based on current NODE_ENV
function getClearCookieOptionsForTest() {
  if (process.env.NODE_ENV === 'development') {
    return { 
      httpOnly: true, 
      path: '/' 
    };
  } else if (process.env.NODE_ENV === 'production') {
    return { 
      httpOnly: true, 
      path: '/',
      sameSite: 'none', 
      secure: true 
    };
  } else {
    return { 
      httpOnly: true, 
      path: '/',
      sameSite: 'lax' 
    };
  }
}

describe('User Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(errorHandler, 'handleControllerError').mockImplementation((res, error, message) => {
      return res.status(500).json({ message: message || 'Internal server error' });
    });
    // Default to 'test' environment for most tests
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalEnv;
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

  // Test getUsers
  describe('getUsers', () => {
    it('should return a list of users with status 200', async () => {
      const mockUsers = [{ id: 1, name: 'John Doe' }];
      vi.spyOn(models.User, 'findAll').mockResolvedValue(mockUsers);
      
      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle errors gracefully in getUsers', async () => {
      const error = new Error('Database error');
      vi.spyOn(models.User, 'findAll').mockRejectedValueOnce(error);
      
      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res, 
        error,
        'Failed to retrieve users'
      );
    });
  });

  // Test singUp
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

  // Test singIn
  describe('signIn', () => {
    function createSignInReq(username = DEFAULT_USER.username, password = 'correctPassword') {
      return { body: { username, password } };
    }

    function mockSuccessfulAuth(user = DEFAULT_USER) {
      // Alternative implementation: setup mocks individually
      vi.spyOn(models.User, 'findOne').mockResolvedValue(user);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(jwt, 'sign').mockReturnValue(MOCK_TOKEN);
    }

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
      setupUserMocks({ findAllValue: mockUser });
      
      const req = { cookies: { refreshToken: token } };
      const res = createRes();

      await userController.signOut(req, res);

      expect(models.User.findAll).toHaveBeenCalledWith({ where: { refresh_token: token } });
      expect(models.User.update).toHaveBeenCalledWith(
        { refresh_token: '' },
        { where: { refresh_token: token } }
      );
      expectCookiesCleared(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({ message: 'Signed out successfully' });
    });

    it('should return 404 and clear all cookies if user not found for refreshToken', async () => {
      setupUserMocks({ findAllValue: [] });
      
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
        setupUserMocks({ findAllValue: [] });
        
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
      vi.spyOn(models.User, 'findAll').mockRejectedValue(error);
      
      const req = { cookies: { refreshToken: 'someToken' } };
      const res = createRes();

      await userController.signOut(req, res);

      expect(models.User.findAll).toHaveBeenCalledWith({
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

  // Test para deleteUserById
  describe('deleteUserById', () => {
    it('should return 404 if user not found in deleteUserById', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
      
      const req = { params: { id: 1 } };
      const res = createRes();

      await userController.deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should delete user successfully in deleteUserById', async () => {
      const mockUser = {
        id: 1,
        username: 'existingUser',
        destroy: vi.fn().mockResolvedValue({}),
      };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = { params: { id: 1 } };
      const res = createRes();

      await userController.deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should handle database error during user deletion in deleteUserById', async () => {
      const error = new Error('Database error');
      const mockUser = {
        id: 1,
        username: 'existingUser',
        destroy: vi.fn().mockRejectedValue(error),
      };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = { params: { id: 1 } };
      const res = createRes();

      await userController.deleteUserById(req, res);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Failed to delete user'
      );
    });
  });

  // Test getAuthority
  describe('getAuthority', () => {
    function setupTokenTest(token, authority = null) {
      const req = { cookies: { accessToken: token } };
      const res = createRes();
      
      if (authority) {
        vi.spyOn(jwt, 'verify').mockReturnValue({ authority });
      }
      
      return { req, res };
    }

    it('should return authority if valid token is provided', async () => {
      const { req, res } = setupTokenTest('validToken', 'admin');

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ authority: 'admin' });
    });

    it('should return 400 if no token is provided', async () => {
      const req = { cookies: {} };
      const res = createRes();

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token is required' });
    });

    it('should return 403 if the token is invalid or expired', async () => {
      const { req, res } = setupTokenTest('invalidToken');
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should return 403 if the token format is incorrect', async () => {
      const { req, res } = setupTokenTest('malformedToken');
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should return 200 if token has authority ADMIN', async () => {
      const { req, res } = setupTokenTest('validTokenWithAdminAuthority', 'ADMIN');

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ authority: 'ADMIN' });
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

  // New tests for 100% coverage
  describe('Cookie config helpers', () => {
    it('should generate correct cookie options for different environments', () => {
      // Test development environment
      process.env.NODE_ENV = 'development';
      const devOptions = userController.getCookieOptions(3600);
      expect(devOptions).toEqual({
        httpOnly: true,
        path: '/',
        maxAge: 3600 * 1000
      });
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      const prodOptions = userController.getCookieOptions(3600);
      expect(prodOptions).toEqual({
        httpOnly: true,
        path: '/',
        maxAge: 3600 * 1000,
        sameSite: 'none',
        secure: true,
        partitioned: true
      });
      
      // Test other environments
      process.env.NODE_ENV = 'staging';
      const otherOptions = userController.getCookieOptions(3600);
      expect(otherOptions).toEqual({
        httpOnly: true,
        path: '/',
        maxAge: 3600 * 1000,
        sameSite: 'lax'
      });
    });
    
    it('should generate correct cookie clear options for different environments', () => {
      // Test development environment
      process.env.NODE_ENV = 'development';
      const devOptions = userController.getClearCookieOptions();
      expect(devOptions).toEqual({
        httpOnly: true,
        path: '/'
      });
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      const prodOptions = userController.getClearCookieOptions();
      expect(prodOptions).toEqual({
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true
      });
      
      // Test other environments
      process.env.NODE_ENV = 'staging';
      const otherOptions = userController.getClearCookieOptions();
      expect(otherOptions).toEqual({
        httpOnly: true,
        path: '/',
        sameSite: 'lax'
      });
    });
  });

  describe('Edge cases for Node-RED token', () => {
    it('should handle empty nodeRedToken correctly', async () => {
      const user = {
        ...DEFAULT_USER,
        authority: 'DEVELOPER'
      };
      
      mockSuccessfulAuth(user);
      vi.spyOn(nodeRedTokenModule, 'getNodeRedToken').mockResolvedValue('');
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      // Verify Node-RED token cookie not set when empty
      expect(res.cookie).toHaveBeenCalledTimes(2); // Only accessToken and refreshToken
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeRedToken: '',
          nodeRedAccess: false
        })
      );
    });
    
    it('should properly handle null nodeRedToken', async () => {
      const user = {
        ...DEFAULT_USER,
        authority: 'DEVELOPER'
      };
      
      mockSuccessfulAuth(user);
      vi.spyOn(nodeRedTokenModule, 'getNodeRedToken').mockResolvedValue(null);
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      // Verify response with null Node-RED token
      // En lugar de verificar el objeto completo, verificamos solo las propiedades que nos interesan
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeRedToken: null
        })
      );
      
      // Verificar que nodeRedAccess refleja que no hay acceso a Node-RED cuando el token es null
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.nodeRedAccess).toBe(false);
    });
  });
});
