import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import { models } from '../../../../src/models/models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as nodeRedTokenModule from '../../../../src/utils/nodeRedToken.js';

// Helper to create simple mock req/res objects
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

describe('User Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Test getUsers
  describe('getUsers', () => {
    it('should return a list of users with status 200', async () => {
      // Mocking database response
      const mockUsers = [{ id: 1, name: 'John Doe' }];

      vi.spyOn(models.User, 'findAll').mockResolvedValue(mockUsers);

      // Mocking request and response objects
      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle errors gracefully in getUsers', async () => {
      vi.spyOn(models.User, 'findAll').mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = {};
      const res = createRes();

      await userController.getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });
  });

  // Test singUp
  describe('signUp', () => {
    it('should return 400 if username exists', async () => {
      const req = {
        body: {
          username: 'existingUser',
          password: 'password123',
          email: 'test@example.com',
          authority: 'USER',
        },
      };
      const res = createRes();

      // Set the mock for findAll
      vi.spyOn(models.User, 'findOne').mockResolvedValue(null);
      vi.spyOn(models.User, 'findAll').mockResolvedValue([
        { username: 'existingUser' },
      ]);

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username already exists',
      });
    });

    it('should return 201 create user successfully in signUp', async () => {
      const req = {
        body: {
          username: 'existingUser',
          password: 'password123',
          email: 'test@example.com',
          authority: 'USER',
        },
      };
      const res = createRes();

      vi.spyOn(models.User, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.User, 'create').mockResolvedValue({});

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User existingUser created successfully with authority USER',
      });
    });
    it('should return 400 if username exists (case insensitive)', async () => {
      const req = {
        body: {
          username: 'ExistingUser', // uppercase
          password: 'password123',
          email: 'test@example.com',
          authority: 'USER',
        },
      };
      const res = createRes();

      // Set the mock for findAll with case-insensitive search
      vi.spyOn(models.User, 'findAll').mockResolvedValue([
        { username: 'existinguser' }, // lowercase
      ]);

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username already exists',
      });
    });
    it('should return 400 if email already exists', async () => {
      const req = {
        body: {
          username: 'newUser',
          password: 'password123',
          email: 'existing@example.com',
          authority: 'USER',
        },
      };
      const res = createRes();

      vi.spyOn(models.User, 'findOne').mockResolvedValue({
        email: 'existing@example.com',
      });

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email already exists',
      });
    });

    it('should hash password before saving user', async () => {
      const req = {
        body: {
          username: 'newUser',
          password: 'plainPassword',
          email: 'test@example.com',
          authority: 'USER',
        },
      };
      const res = createRes();

      vi.spyOn(models.User, 'findOne').mockResolvedValue(null);
      vi.spyOn(models.User, 'findAll').mockResolvedValue([]);
      const hashSpy = vi
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashedPassword');
      vi.spyOn(models.User, 'create').mockResolvedValue({});

      await userController.signUp(req, res);

      expect(hashSpy).toHaveBeenCalledWith('plainPassword', 10);
      expect(models.User.create).toHaveBeenCalledWith({
        username: 'newUser',
        password: 'hashedPassword', // should match the mocked hash
        authority: 'USER',
        email: 'test@example.com',
      });
    });
    it('should return 500 if there is a server error during user creation', async () => {
      const req = {
        body: {
          username: 'errorUser',
          password: 'password123',
          email: 'test@example.com',
          authority: 'USER',
        },
      };
      const res = createRes();

      vi.spyOn(models.User, 'findOne').mockResolvedValue(null);
      vi.spyOn(models.User, 'findAll').mockResolvedValue([]);
      vi.spyOn(models.User, 'create').mockRejectedValue(new Error('DB error'));

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to create user, error',
      });
    });
    it('should create user with default authority USER if not provided', async () => {
      // authority not provided
      const req = {
        body: {
          username: 'defaultUser',
          password: 'password123',
          email: 'default@example.com',
        },
      };
      const res = createRes();

      vi.spyOn(models.User, 'findOne').mockResolvedValue(null);
      vi.spyOn(models.User, 'findAll').mockResolvedValue([]);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      const createUserSpy = vi
        .spyOn(models.User, 'create')
        .mockResolvedValue({});

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User defaultUser created successfully with authority USER',
      });
      expect(createUserSpy).toHaveBeenCalledWith({
        username: 'defaultUser',
        password: 'hashedPassword',
        authority: 'USER', // default authority
        email: 'default@example.com',
      });
    });
  });

  // Test singIn
  describe('signIn', () => {
    it('should return 404 if user not found in signIn', async () => {
      const req = {
        body: {
          username: 'nonExistentUser',
          password: 'password123',
        },
      };
      const res = createRes();

      // simulate no user found
      vi.spyOn(models.User, 'findOne').mockResolvedValue(null);

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should return 401 if password is invalid in signIn', async () => {
      const req = {
        body: {
          username: 'existingUser',
          password: 'wrongPassword',
        },
      };
      const res = createRes();
      const mockUser = { username: 'existingUser', password: 'hashedPassword' };

      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockUser);

      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword'
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid password' });
    });

    it('should return 200 and a token if signIn is successful', async () => {
      const req = {
        body: {
          username: 'existingUser',
          password: 'correctPassword',
        },
      };
      const res = createRes();
      const mockUser = {
        username: 'existingUser',
        password: 'hashedPassword',
        email: 'user@example.com',
        authority: 'USER',
      };

      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(jwt, 'sign').mockReturnValue('mockToken');
      vi.spyOn(models.User, 'update').mockResolvedValue([1]);

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        'hashedPassword'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'mockToken',
          refreshToken: 'mockToken',
          username: 'existingUser',
          email: 'user@example.com',
          authority: 'USER',
        })
      );

      expect(models.User.update).toHaveBeenCalledWith(
        { refresh_token: 'mockToken' },
        { where: { username: 'existingUser' } }
      );
    });

    it('should return 400 if username is missing', async () => {
      const req = { body: { password: 'somePassword' } };
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username and password are required',
      });
    });

    it('should return 400 if password is missing', async () => {
      const req = { body: { username: 'existingUser' } };
      const res = createRes();

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username and password are required',
      });
    });

    it('should handle special characters in username', async () => {
      const req = {
        body: { username: 'user!@#', password: 'correctPassword' },
      };
      const res = createRes();

      // Mock de usuario
      const mockUser = {
        username: 'user!@#',
        password: 'hashedPassword',
        email: 'user@example.com',
        authority: 'userAuthority',
      };

      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(jwt, 'sign').mockImplementation(() => 'mockToken');

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        'hashedPassword'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'mockToken',
          refreshToken: 'mockToken',
          username: 'user!@#',
          email: 'user@example.com',
          authority: 'userAuthority',
          nodeRedToken: '',
        })
      );
    });
    it('should be case insensitive for username in signIn', async () => {
      const req = {
        body: { username: 'ExistingUser', password: 'correctPassword' },
      };
      const res = createRes();

      const mockUser = {
        username: 'existinguser', // lowercase,
        password: 'hashedPassword',
        email: 'user@example.com',
        authority: 'userAuthority',
      };

      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(jwt, 'sign').mockReturnValue('mockToken');

      await userController.signIn(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        'hashedPassword'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'mockToken',
          refreshToken: 'mockToken',
          username: mockUser.username,
          email: mockUser.email,
          authority: mockUser.authority,
          nodeRedToken: '',
        })
      );
    });
    it('should generate valid accessToken and refreshToken', async () => {
      const req = {
        body: { username: 'existingUser', password: 'correctPassword' },
      };
      const res = createRes();

      const mockUser = { username: 'existingUser', password: 'hashedPassword' };

      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      const signSpy = vi.spyOn(jwt, 'sign').mockReturnValue('mockToken');

      await userController.signIn(req, res);

      expect(signSpy).toHaveBeenCalledTimes(2); // accessToken y refreshToken
    });

    it('should handle database error during user lookup in signIn', async () => {
      const req = {
        body: {
          username: 'existingUser',
          password: 'password123',
        },
      };
      const res = createRes();

      // Mocking the database error
      vi.spyOn(models.User, 'findOne').mockRejectedValue(
        new Error('Database error')
      );

      await userController.signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
      console.error('Error in signIn:', new Error('Database error')); 
    });
    it('should call getNodeRedToken and include it in the response and cookie for DEVELOPER', async () => {
      const req = {
        body: {
          username: 'developerUser',
          password: 'developerPassword',
        },
      };
      const res = createRes();
      const mockDeveloperUser = {
        id: 123,
        username: 'developerUser',
        password: 'hashedDeveloperPassword',
        email: 'developer@example.com',
        authority: 'DEVELOPER',
      };

      vi.spyOn(models.User, 'findOne').mockResolvedValue(mockDeveloperUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      vi.spyOn(jwt, 'sign').mockReturnValue('mockToken');
      vi.spyOn(models.User, 'update').mockResolvedValue([1]);
      const getNodeRedTokenSpy = vi
        .spyOn(nodeRedTokenModule, 'getNodeRedToken')
        .mockResolvedValue({
          accessToken: 'mockNodeRedToken',
        });
      await userController.signIn(req, res);
      //getNodeRedTokenSpy.mockRestore();
      expect(getNodeRedTokenSpy).toHaveBeenCalledWith(
        'developerUser',
        'developerPassword'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'mockToken',
          refreshToken: 'mockToken',
          username: 'developerUser',
          email: 'developer@example.com',
          authority: 'DEVELOPER',
          nodeRedToken: {
            accessToken: 'mockNodeRedToken',
          },
        })
      );
    });
  });

  // Test signOut
  describe('signOut', () => {
    it('should return 400 if no refreshToken in signOut', async () => {
      const req = {
        refreshToken: null,
      };
      const res = createRes();

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No refresh token provided',
      });
    });

    it('should return 204 sign out successfully', async () => {
      const res = createRes();
      // FIX: Token must be in req.cookies
      const req = {
        cookies: { refreshToken: 'validToken' },
      };
      const user = [
        { id: 1, username: 'existingUser', refresh_token: 'validToken' },
      ];

      vi.spyOn(models.User, 'findAll').mockResolvedValue(user);
      vi.spyOn(models.User, 'update').mockResolvedValue([1]);

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Signed out successfully',
      });
      // FIX: Verify that the cookie is cleared
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object)
      );
    });

    it('should return 404 if user not found for refreshToken', async () => {
      // Mock invalid token
      const req = {
        cookies: { refreshToken: 'invalidToken' },
      };
      const res = createRes();

      // Mocking the user not found scenario
      vi.spyOn(models.User, 'findAll').mockResolvedValue([]); // No user with that refresh token

      await userController.signOut(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No user found for provided refresh token',
      });
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object)
      );
    });
    it('should return 204 sign out successfully', async () => {
      const res = createRes();
      const req = { cookies: { refreshToken: 'validToken' } };
      const mockUser = [
        { id: 1, username: 'existingUser', refresh_token: 'validToken' },
      ];

      vi.spyOn(models.User, 'findAll').mockResolvedValue(mockUser);
      vi.spyOn(models.User, 'update').mockResolvedValue([1]);

      await userController.signOut(req, res);

      expect(models.User.findAll).toHaveBeenCalledWith({
        where: { refresh_token: 'validToken' },
      });
      expect(models.User.update).toHaveBeenCalledWith(
        { refresh_token: '' },
        { where: { refresh_token: 'validToken' } }
      );
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Signed out successfully',
      });
    });
    it('should handle database error during user lookup in signOut', async () => {
      const req = { cookies: { refreshToken: 'someToken' } };
      const res = createRes();

      vi.spyOn(models.User, 'findAll').mockRejectedValue(
        new Error('Database error')
      );

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
      const res = createRes();
      const req = { params: { id: 1 } };

      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);

      await userController.deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should delete user successfully in deleteUserById', async () => {
      const res = createRes();
      const user = {
        id: 1,
        username: 'existingUser',
        destroy: vi.fn().mockResolvedValue({}), // destroy() is a real function that returns a resolved promise.
      };

      vi.spyOn(models.User, 'findByPk').mockResolvedValue(user);
      vi.spyOn(models.User, 'destroy').mockResolvedValue({});

      const req = { params: { id: 1 } };

      await userController.deleteUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User deleted successfully',
      });
    });
    it('should handle database error during user deletion in deleteUserById', async () => {
      const res = createRes();
      const req = { params: { id: 1 } };
      const mockUser = {
        id: 1,
        username: 'existingUser',
        destroy: vi.fn().mockRejectedValue(new Error('Database error')), // Simulate an error during destroy
      };

      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);

      await userController.deleteUserById(req, res);

      expect(models.User.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error in deleteUserById:',
        new Error('Database error')
      );
    });
  });

  // Test getAuthority
  describe('getAuthority', () => {
    it('should return authority if valid token is provided', async () => {
      const mockAuthority = 'admin';
      const mockToken = 'validToken';

      const req = { cookies: { accessToken: mockToken } };
      const res = createRes();

      vi.spyOn(jwt, 'verify').mockReturnValue({ authority: mockAuthority });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ authority: mockAuthority });
    });

    it('should return 400 if no token is provided', async () => {
      const req = { cookies: {} };
      const res = createRes();

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token is required' });
    });
    it('should return 403 if the token is invalid or expired', async () => {
      const mockToken = 'invalidToken';

      const req = { cookies: { accessToken: mockToken } };
      const res = createRes();

      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });
    it('should return 403 if the token format is incorrect', async () => {
      const mockToken = 'malformedToken';

      const req = { cookies: { accessToken: mockToken } };
      const res = createRes();

      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    it('should return 200 if token has authority ADMIN', async () => {
      const mockAuthority = 'ADMIN';
      const mockToken = 'validTokenWithAdminAuthority';

      const req = { cookies: { accessToken: mockToken } };
      const res = createRes();

      vi.spyOn(jwt, 'verify').mockReturnValue({ authority: mockAuthority });

      await userController.getAuthority(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ authority: mockAuthority });
    });
  });
});
