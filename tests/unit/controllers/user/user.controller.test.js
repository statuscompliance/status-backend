import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import { models } from '../../../../src/models/models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as nodeRedTokenModule from '../../../../src/utils/nodeRedToken.js';
import { 
  DEFAULT_USER, 
  adminUser,
  newUserData 
} from '../../../../tests/utils/sampleUserData.js';

// Constants for reuse
const MOCK_TOKEN = 'mockToken';

// Helper to create simple mock req/res objects
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
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

// Helper for common cookie clear expectations
function expectCookiesCleared(res, includeNodeRed = true) {
  expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  expect(res.clearCookie).toHaveBeenCalledWith('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  if (includeNodeRed) {
    expect(res.clearCookie).toHaveBeenCalledWith('nodeRedToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
  }
}

describe('User Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
      vi.spyOn(models.User, 'findAll').mockRejectedValueOnce(new Error('Database error'));
      
      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
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

    it('should return 500 if there is a server error during user creation', async () => {
      setupUserMocks();
      vi.spyOn(models.User, 'create').mockRejectedValue(new Error('DB error'));
      
      const req = createSignUpReq({ username: 'errorUser' });
      const res = createRes();

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to create user, error' });
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
      setupUserMocks({ 
        findOneValue: user, 
        compareValue: true 
      });
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
      vi.spyOn(models.User, 'findOne').mockRejectedValue(new Error('Database error'));
      
      const req = createSignInReq();
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
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

    it('should handle database error during user lookup in signOut', async () => {
      vi.spyOn(models.User, 'findAll').mockRejectedValue(new Error('Database error'));
      
      const req = { cookies: { refreshToken: 'someToken' } };
      const res = createRes();

      await userController.signOut(req, res);

      expect(models.User.findAll).toHaveBeenCalledWith({
        where: { refresh_token: 'someToken' },
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error in signOut:',
        new Error('Database error')
      );
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
      const mockUser = {
        id: 1,
        username: 'existingUser',
        destroy: vi.fn().mockRejectedValue(new Error('Database error')),
      };
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = { params: { id: 1 } };
      const res = createRes();

      await userController.deleteUserById(req, res);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith(
        'Error in deleteUserById:',
        new Error('Database error')
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
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const req = { cookies: { refreshToken: 'valid-refresh-token' } };
      const res = createRes();

      await userController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
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
  });
});
