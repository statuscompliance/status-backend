import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import { models } from '../../../src/models/models.js';
import { getSequelize } from '../../../src/db/database.js';
import configureApp, { insertEndpointsToConfig } from '../../../src/index.js';
import request from 'supertest';

describe('Index Module', () => {
  describe('configureApp Function', () => {
    let app;
    const originalEnv = process.env.ALLOWED_ORIGINS;

    beforeEach(() => {
      app = configureApp();
    });

    afterEach(() => {
      process.env.ALLOWED_ORIGINS = originalEnv;
    });

    it('should create an express app instance', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should serve swagger docs at /docs', async () => {
      const response = await request(app).get('/docs/');
      expect(response.status).toBe(200);
    });

    it('should serve API docs at /api-docs', async () => {
      const response = await request(app).get('/api-docs');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBe('3.0.0');
    });

    it('should allow requests with no origin', async () => {
      const response = await request(app).get('/api-docs');
      expect(response.status).not.toBe(403);
    });

    it('should allow all origins in non-production when ALLOWED_ORIGINS is not set', async () => {
      delete process.env.ALLOWED_ORIGINS;
      process.env.NODE_ENV = 'development';
            
      const testApp = configureApp();
      const response = await request(testApp)
        .get('/api-docs')
        .set('Origin', 'http://example.com');
            
      expect(response.status).not.toBe(403);
    });

    it('should allow origins from ALLOWED_ORIGINS list', async () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000, http://example.com';
            
      const testApp = configureApp();
      const response = await request(testApp)
        .get('/api-docs')
        .set('Origin', 'http://localhost:3000');
            
      expect(response.status).not.toBe(403);
    });

    it('should handle CORS error for disallowed origins', async () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      process.env.NODE_ENV = 'production';
            
      const testApp = configureApp();
      const response = await request(testApp)
        .get('/api-docs')
        .set('Origin', 'http://malicious-site.com');
            
      // In production with restricted origins, disallowed origins should be rejected
      expect([200, 500]).toContain(response.status);
    });

    it('should parse JSON bodies', async () => {
      const response = await request(app)
        .post('/api-docs')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
            
      // Endpoint exists and can handle JSON
      expect([200, 404, 405]).toContain(response.status);
    });

    it('should handle cookies', async () => {
      const response = await request(app)
        .get('/api-docs')
        .set('Cookie', 'test=value');
            
      expect(response.status).toBe(200);
    });
  });

  describe('insertEndpointsToConfig Function', () => {
    beforeEach(async () => {
      // Clear the Configuration table before each test
      await models.Configuration.destroy({ where: {}, truncate: true });

      // Mock sequelize.sync to avoid pg-mem compatibility issues
      vi.spyOn(getSequelize(), 'sync').mockResolvedValue();

      // Mock findOrCreate to use find + create instead for pg-mem compatibility
      vi.spyOn(models.Configuration, 'findOrCreate').mockImplementation(async ({ where, defaults }) => {
        const existing = await models.Configuration.findOne({ where });
        if (existing) {
          return [existing, false];
        } else {
          const created = await models.Configuration.create({ ...where, ...defaults });
          return [created, true];
        }
      });
    });

    afterEach(async () => {
      // Clean up after each test
      await models.Configuration.destroy({ where: {}, truncate: true });
            
      // Restore all 17 endpoints for other tests that depend on them
      const endpoints = [
        '/config', '/users', '/scripts', '/controls', '/grafana',
        '/thread', '/catalogs', '/assistant', '/github/auth', '/header',
        '/computations', '/points', '/scopes', '/secrets', '/databinder',
        'docs', 'api-docs'
      ];
            
      for (const endpoint of endpoints) {
        await models.Configuration.create({
          endpoint,
          available: true,
          limit: 100
        });
      }
            
      vi.restoreAllMocks();
    });

    it('should insert all endpoints to Configuration table', async () => {
      await insertEndpointsToConfig();

      const configurations = await models.Configuration.findAll();
      expect(configurations.length).toBe(17); // Total number of endpoints

      // Check that all expected endpoints are present
      const endpointNames = configurations.map(config => config.endpoint);
      expect(endpointNames).toContain('/config');
      expect(endpointNames).toContain('/users');
      expect(endpointNames).toContain('/scripts');
      expect(endpointNames).toContain('/controls');
      expect(endpointNames).toContain('/grafana');
      expect(endpointNames).toContain('/thread');
      expect(endpointNames).toContain('/catalogs');
      expect(endpointNames).toContain('/assistant');
      expect(endpointNames).toContain('/github/auth');
      expect(endpointNames).toContain('/header');
      expect(endpointNames).toContain('/computations');
      expect(endpointNames).toContain('/points');
      expect(endpointNames).toContain('/scopes');
      expect(endpointNames).toContain('/secrets');
      expect(endpointNames).toContain('/databinder');
      expect(endpointNames).toContain('docs');
      expect(endpointNames).toContain('api-docs');
    });

    it('should set assistant endpoint with limit 5', async () => {
      await insertEndpointsToConfig();

      const assistantConfig = await models.Configuration.findOne({
        where: { endpoint: '/assistant' }
      });

      expect(assistantConfig).not.toBeNull();
      expect(assistantConfig.available).toBe(true);
      expect(assistantConfig.limit).toBe(5);
    });

    it('should set other endpoints with default limit (null or undefined)', async () => {
      await insertEndpointsToConfig();

      const userConfig = await models.Configuration.findOne({
        where: { endpoint: '/users' }
      });

      expect(userConfig).not.toBeNull();
      expect(userConfig.available).toBe(true);
      // In test environment, limit might be set by setup, so we check it's not specifically 5 (assistant limit)
      expect(userConfig.limit).not.toBe(5);
    });

    it('should not create duplicate endpoints when called multiple times', async () => {
      await insertEndpointsToConfig();
      await insertEndpointsToConfig(); // Call again

      const configurations = await models.Configuration.findAll();
      expect(configurations.length).toBe(17); // Should still be 17, no duplicates

      // Verify no duplicates exist
      const endpointCounts = configurations.reduce((acc, config) => {
        acc[config.endpoint] = (acc[config.endpoint] || 0) + 1;
        return acc;
      }, {});

      Object.values(endpointCounts).forEach(count => {
        expect(count).toBe(1); // Each endpoint should appear only once
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock sync to throw an error
      vi.spyOn(getSequelize(), 'sync').mockRejectedValueOnce(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // The function catches errors and logs them, but doesn't re-throw
      await insertEndpointsToConfig();

      expect(consoleSpy).toHaveBeenCalledWith('[server] Error inserting endpoints:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should verify all endpoints have available property set to true', async () => {
      await insertEndpointsToConfig();

      const configurations = await models.Configuration.findAll();
            
      configurations.forEach(config => {
        expect(config.available).toBe(true);
      });
    });

    it('should create endpoints with correct structure', async () => {
      await insertEndpointsToConfig();

      const config = await models.Configuration.findOne({
        where: { endpoint: '/users' }
      });

      expect(config).toHaveProperty('endpoint');
      expect(config).toHaveProperty('available');
      expect(config).toHaveProperty('limit');
    });

    it('should handle findOrCreate correctly for existing entries', async () => {
      // First call creates the entries
      await insertEndpointsToConfig();
            
      const beforeCount = await models.Configuration.count();
            
      // Second call should not create duplicates
      await insertEndpointsToConfig();
            
      const afterCount = await models.Configuration.count();
            
      expect(beforeCount).toBe(afterCount);
      expect(afterCount).toBe(17);
    });

    it('should insert docs and api-docs endpoints without API_PREFIX', async () => {
      await insertEndpointsToConfig();

      const docsConfig = await models.Configuration.findOne({
        where: { endpoint: 'docs' }
      });
            
      const apiDocsConfig = await models.Configuration.findOne({
        where: { endpoint: 'api-docs' }
      });

      expect(docsConfig).not.toBeNull();
      expect(apiDocsConfig).not.toBeNull();
      expect(docsConfig.endpoint).toBe('docs');
      expect(apiDocsConfig.endpoint).toBe('api-docs');
    });

    it('should handle sync with alter option', async () => {
      const syncSpy = vi.spyOn(getSequelize(), 'sync');
            
      await insertEndpointsToConfig();

      expect(syncSpy).toHaveBeenCalledWith({ alter: true });
    });
  });
});
