import { describe, it, expect, beforeEach } from 'vitest';
import { verifyAdmin } from '../../../src/middleware/verifyAdmin';
import { request } from '../../setup/setup';
import jwt from 'jsonwebtoken';
import { adminUser } from '../../utils/sampleUserData';
import express from 'express';

describe('verifyAdmin Middleware Integration Tests', () => {
  let token;
  const secretKey = 'test-secret-key';
  const testAdminRoute = '/config';

  beforeEach(async () => {
    const app = express();

    app.use(express.json());

    app.get(testAdminRoute, verifyAdmin, (req, res) => {
      res.status(200).json({ message: 'Admin access granted' });
    });

    token = jwt.sign(
      { userId: adminUser._id, username: adminUser.username, authority: adminUser.authority },
      secretKey
    );

  });


  it('should return 401 if no token is provided', async () => {
    const response = await request.get(testAdminRoute).unset('Cookie');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  it('should return 401 if the token is invalid', async () => {
    const response = await request
      .get(testAdminRoute)
      .set('x-access-token', 'invalid_token');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('should return 401 if token verification fails', async () => {
    const accessToken = 'invalid_token';
    const response = await request
      .get(testAdminRoute)
      .set('x-access-token', accessToken);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized: Invalid token');
  });

  it('should return 403 if the user is not an admin', async () => {
    const userPayload = {
      id: 'user123',
      username: 'testuser',
      authority: 'USER',
    };
    token = jwt.sign(userPayload, secretKey, { expiresIn: '1h' });

    const response = await request
      .get(testAdminRoute)
      .set('x-access-token', token);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });

  it('should call next() if the user is an admin', async () => {
    const response = await request
      .get(testAdminRoute)
      .set('x-access-token', token);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Admin access granted');
  });
});
