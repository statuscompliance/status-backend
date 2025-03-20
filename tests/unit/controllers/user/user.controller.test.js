import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as userController from '../../../../src/controllers/user.controller.js';
import User from '../../../../src/models/user.model.js';

// Helper to create simple mock req/res objects
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn()
  };
}

describe('User Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should return 400 if username exists', async () => {
      const req = {
        body: {
          username: 'existingUser',
          password: 'password123',
          email: 'test@example.com',
          authority: 'USER'
        }
      };
      const res = createRes();

      // Set the mock for findAll
      vi.spyOn(User , 'findAll').mockResolvedValue([{ username: 'existingUser' }]);

      await userController.signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Username already exists' });
    });
  });
});