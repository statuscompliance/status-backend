import { expect, describe, it, beforeAll, vi } from 'vitest';
import { request } from '../../setup/setup.js';
import axios from 'axios';

// Mock axios for external API calls
vi.mock('axios');

describe('GitHub Access Routes', () => {
  beforeAll(() => {
    // Set environment variables for tests
    process.env.GH_CLIENT_ID = 'test_client_id';
    process.env.GH_CLIENT_SECRET = 'test_client_secret';
  });

  describe('GET /github/auth', () => {
    it('should handle GitHub OAuth callback and return error on failure', async () => {
      // Mock axios to reject (simulating GitHub API error)
      axios.post.mockRejectedValue(new Error('GitHub API error'));

      const response = await request
        .get('/github/auth')
        .query({ code: 'test_auth_code_123' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Error interno del servidor.');
    });

    it('should handle missing code parameter', async () => {
      axios.post.mockRejectedValue(new Error('Invalid request'));

      const response = await request.get('/github/auth');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /header', () => {
    it('should successfully retrieve authorization header', async () => {
      const response = await request
        .get('/header')
        .set('Authorization', 'Bearer test_token_123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authorizationHeader');
      expect(response.body.authorizationHeader).toBe('Bearer test_token_123');
    });

    it('should return undefined when no authorization header is present', async () => {
      const response = await request.get('/header');

      expect(response.status).toBe(200);
      expect(response.body.authorizationHeader).toBeUndefined();
    });

    it('should handle different authorization header formats', async () => {
      const response = await request
        .get('/header')
        .set('Authorization', 'Token github_pat_abc123');

      expect(response.status).toBe(200);
      expect(response.body.authorizationHeader).toBe('Token github_pat_abc123');
    });

    it('should handle Basic authorization header', async () => {
      const response = await request
        .get('/header')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(response.status).toBe(200);
      expect(response.body.authorizationHeader).toBe('Basic dXNlcjpwYXNz');
    });
  });
});
