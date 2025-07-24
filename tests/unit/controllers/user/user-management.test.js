import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import { models } from '../../../../src/models/models.js';
import jwt from 'jsonwebtoken';
import * as nodeRedTokenModule from '../../../../src/utils/nodeRedToken.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import {
  DEFAULT_USER,
  createRes,
  createWhoamiReq,
  mockSuccessfulAuth,
  setupCommonMocks,
  restoreEnvironment
} from './test-helpers.js';

describe('User Management Tests', () => {
  beforeEach(() => {
    setupCommonMocks();
  });

  afterEach(() => {
    restoreEnvironment();
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

  // Test deleteUserById
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

  // Test whoami
  describe('whoami', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      authority: 'USER',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };

    it('should return user info when user is authenticated', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(mockUser);
      
      const req = createWhoamiReq();
      const res = createRes();

      await userController.whoami(req, res);

      expect(models.User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['id', 'username', 'email', 'authority', 'createdAt', 'updatedAt']
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        authority: mockUser.authority,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
    });

    it('should return 401 if no user in request', async () => {
      const req = createWhoamiReq(null);
      const res = createRes();

      await userController.whoami(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No user in request' });
    });

    it('should return 401 if user is undefined', async () => {
      const req = {}; // No user property at all
      const res = createRes();

      await userController.whoami(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No user in request' });
    });

    it('should return 404 if user not found in database', async () => {
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(null);
      
      const req = createWhoamiReq();
      const res = createRes();

      await userController.whoami(req, res);

      expect(models.User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['id', 'username', 'email', 'authority', 'createdAt', 'updatedAt']
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle database error gracefully', async () => {
      const error = new Error('Database connection error');
      vi.spyOn(models.User, 'findByPk').mockRejectedValue(error);
      
      const req = createWhoamiReq();
      const res = createRes();

      await userController.whoami(req, res);

      expect(errorHandler.handleControllerError).toHaveBeenCalledWith(
        res,
        error,
        'Failed to fetch user info'
      );
    });

    it('should work with different user authorities', async () => {
      const adminUserData = {
        ...mockUser,
        id: 2,
        username: 'adminuser',
        authority: 'ADMIN'
      };
      
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(adminUserData);
      
      const req = createWhoamiReq({ user_id: 2 });
      const res = createRes();

      await userController.whoami(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: adminUserData.id,
        username: adminUserData.username,
        email: adminUserData.email,
        authority: adminUserData.authority,
        createdAt: adminUserData.createdAt,
        updatedAt: adminUserData.updatedAt
      });
    });

    it('should return only specified attributes', async () => {
      const userWithExtraFields = {
        ...mockUser,
        password: 'hashedpassword',
        refresh_token: 'sometoken',
        sensitive_data: 'should not be returned'
      };
      
      vi.spyOn(models.User, 'findByPk').mockResolvedValue(userWithExtraFields);
      
      const req = createWhoamiReq();
      const res = createRes();

      await userController.whoami(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData).not.toHaveProperty('password');
      expect(responseData).not.toHaveProperty('refresh_token');
      expect(responseData).not.toHaveProperty('sensitive_data');
      expect(responseData).toHaveProperty('id');
      expect(responseData).toHaveProperty('username');
      expect(responseData).toHaveProperty('email');
      expect(responseData).toHaveProperty('authority');
      expect(responseData).toHaveProperty('createdAt');
      expect(responseData).toHaveProperty('updatedAt');
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
      
      const req = { body: { username: user.username, password: 'correctPassword' } };
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
      
      const req = { body: { username: user.username, password: 'correctPassword' } };
      const res = createRes();

      await userController.signIn(req, res);

      // Verify response with null Node-RED token
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
