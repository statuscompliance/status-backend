import { expect, describe, it, beforeAll, beforeEach } from 'vitest';
import { request } from '../../setup/setup.js';
import { models } from '../../../src/models/models.js';
import { sampleScopes } from '../../utils/sampleScopesData.js';
import { adminUser } from '../../utils/sampleUserData.js';
import jwt from 'jsonwebtoken';

describe('Scope API Routes', () => {
  beforeAll(async () => {
    const token = jwt.sign(
      { userId: adminUser._id, username: adminUser.username, authority: adminUser.authority },
      'test-secret-key'
    );
    
    request.set('Cookie', `accessToken=${token}`);
  });

  describe('GET /scopes', () => {
    beforeEach(async () => {
      await models.Scope.destroy({ where: {}, truncate: true });
      await models.Scope.bulkCreate(sampleScopes);
    });

    it('should retrieve all scopes', async () => {
      const response = await request.get('/scopes');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(sampleScopes.length);
      
      for (let i = 0; i < sampleScopes.length; i++) {
        expect(response.body[i].name).toBe(sampleScopes[i].name);
        expect(response.body[i].description).toBe(sampleScopes[i].description);
        expect(response.body[i].type).toBe(sampleScopes[i].type);
        expect(response.body[i].default).toBe(sampleScopes[i].default);
      }
    });
  });
});
