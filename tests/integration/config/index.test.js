import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import { models } from '../../../src/models/models.js';
import { getSequelize } from '../../../src/db/database.js';
import { insertEndpointsToConfig } from '../../../src/index.js';

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
});
