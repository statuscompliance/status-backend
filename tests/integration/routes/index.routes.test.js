import { expect, describe, it, beforeAll } from 'vitest';
import { request } from '../../setup/setup.js';

describe('API Main Route', () => {

  beforeAll(async () => {
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
