import { expect, describe, it, beforeAll } from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { adminUser } from '../../utils/sampleUserData.js';

describe('Scope API Routes', () => {
  let token;

  beforeAll(async () => {
    token = jwt.sign(
      {
        userId: adminUser._id,
        username: adminUser.username,
        authority: adminUser.authority,
      },
      'test-secret-key'
    );

    request.set('Cookie', `accessToken=${token}`);
  });

  describe('Index GET /', () => {
    it('should return a 200 status code and the welcome message', async () => {
      const response = await request.get('/');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Welcome to the API!');
      expect(response.type).toBe('text/html');
    });
  });
});
