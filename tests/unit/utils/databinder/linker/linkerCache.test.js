import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cacheLinkerExecution,
  getCachedLinkerExecution,
  invalidateLinkerCache,
  updateLinkerCacheTTL,
  getLinkerCacheTTL,
  hasValidCache
} from '../../../../../src/utils/databinder/linker/linkerCache.js';
import redis from '../../../../../src/config/redis.js';
import logger from '../../../../../src/config/logger.js';

describe('linkerCache', () => {
  const mockLinkerId = 'linker-123';
  const mockData = { results: [{ id: 1, name: 'Test' }] };
  const mockMetadata = { 
    mergeStrategy: 'append',
    datasourceCount: 2 
  };

  // Store original methods
  let originalSetex, originalGet, originalDel, originalExpire, originalTtl;

  beforeEach(() => {
    // Store original methods
    originalSetex = redis.setex;
    originalGet = redis.get;
    originalDel = redis.del;
    originalExpire = redis.expire;
    originalTtl = redis.ttl;

    // Spy on logger methods
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original methods
    if (originalSetex) redis.setex = originalSetex;
    if (originalGet) redis.get = originalGet;
    if (originalDel) redis.del = originalDel;
    if (originalExpire) redis.expire = originalExpire;
    if (originalTtl) redis.ttl = originalTtl;
    
    vi.restoreAllMocks();
  });

  describe('cacheLinkerExecution', () => {
    it('should cache linker execution data with 2 weeks expiration', async () => {
      const setexSpy = vi.spyOn(redis, 'setex').mockResolvedValue('OK');

      const result = await cacheLinkerExecution(mockLinkerId, mockData, mockMetadata);

      expect(result).toBe(true);
      expect(setexSpy).toHaveBeenCalledTimes(2);
      
      // Check cache data call
      const cacheCall = setexSpy.mock.calls[0];
      expect(cacheCall[0]).toBe(`linker:cache:${mockLinkerId}`);
      expect(cacheCall[1]).toBe(14 * 24 * 60 * 60); // 2 weeks in seconds
      
      const cachedData = JSON.parse(cacheCall[2]);
      expect(cachedData.data).toEqual(mockData);
      expect(cachedData.linkerId).toBe(mockLinkerId);
      expect(cachedData.cachedAt).toBeTypeOf('number');

      // Check metadata call
      const metadataCall = setexSpy.mock.calls[1];
      expect(metadataCall[0]).toBe(`linker:metadata:${mockLinkerId}`);
      expect(metadataCall[1]).toBe(14 * 24 * 60 * 60);
      
      const cachedMetadata = JSON.parse(metadataCall[2]);
      expect(cachedMetadata.mergeStrategy).toBe('append');
      expect(cachedMetadata.datasourceCount).toBe(2);
      expect(cachedMetadata.lastExecutedAt).toBeTypeOf('number');
      expect(cachedMetadata.linkerId).toBe(mockLinkerId);
    });

    it('should cache linker execution without metadata', async () => {
      const setexSpy = vi.spyOn(redis, 'setex').mockResolvedValue('OK');

      const result = await cacheLinkerExecution(mockLinkerId, mockData);

      expect(result).toBe(true);
      expect(setexSpy).toHaveBeenCalledTimes(2);
      
      const metadataCall = setexSpy.mock.calls[1];
      const cachedMetadata = JSON.parse(metadataCall[2]);
      expect(cachedMetadata.lastExecutedAt).toBeTypeOf('number');
      expect(cachedMetadata.linkerId).toBe(mockLinkerId);
    });

    it('should return false and log error on redis failure', async () => {
      const error = new Error('Redis connection error');
      vi.spyOn(redis, 'setex').mockRejectedValue(error);

      const result = await cacheLinkerExecution(mockLinkerId, mockData, mockMetadata);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error caching linker execution for ${mockLinkerId}`),
        error
      );
    });
  });

  describe('getCachedLinkerExecution', () => {
    it('should retrieve cached data when cache is fresh (less than 1 hour old)', async () => {
      const now = Date.now();
      const cachedData = {
        data: mockData,
        cachedAt: now - (30 * 60 * 1000), // 30 minutes ago
        linkerId: mockLinkerId
      };
      const cachedMetadata = {
        ...mockMetadata,
        lastExecutedAt: now - (30 * 60 * 1000), // 30 minutes ago
        linkerId: mockLinkerId
      };

      vi.spyOn(redis, 'get').mockImplementation((key) => {
        if (key === `linker:cache:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedData));
        }
        if (key === `linker:metadata:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedMetadata));
        }
        return Promise.resolve(null);
      });

      const result = await getCachedLinkerExecution(mockLinkerId);

      expect(result.data).toEqual(mockData);
      expect(result.metadata).toMatchObject(mockMetadata);
      expect(result.isStale).toBe(false);
      expect(result.cacheAge).toBeLessThan(60 * 60 * 1000); // Less than 1 hour
    });

    it('should mark cache as stale when older than 1 hour', async () => {
      const now = Date.now();
      const cachedData = {
        data: mockData,
        cachedAt: now - (2 * 60 * 60 * 1000), // 2 hours ago
        linkerId: mockLinkerId
      };
      const cachedMetadata = {
        ...mockMetadata,
        lastExecutedAt: now - (2 * 60 * 60 * 1000), // 2 hours ago
        linkerId: mockLinkerId
      };

      vi.spyOn(redis, 'get').mockImplementation((key) => {
        if (key === `linker:cache:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedData));
        }
        if (key === `linker:metadata:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedMetadata));
        }
        return Promise.resolve(null);
      });

      const result = await getCachedLinkerExecution(mockLinkerId);

      expect(result.data).toEqual(mockData);
      expect(result.metadata).toMatchObject(mockMetadata);
      expect(result.isStale).toBe(true);
      expect(result.cacheAge).toBeGreaterThan(60 * 60 * 1000); // More than 1 hour
    });

    it('should return null data when cache does not exist', async () => {
      vi.spyOn(redis, 'get').mockResolvedValue(null);

      const result = await getCachedLinkerExecution(mockLinkerId);

      expect(result.data).toBeNull();
      expect(result.metadata).toBeNull();
      expect(result.isStale).toBe(true);
    });

    it('should return null when only cache data exists but not metadata', async () => {
      vi.spyOn(redis, 'get').mockImplementation((key) => {
        if (key === `linker:cache:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify({ data: mockData, cachedAt: Date.now() }));
        }
        return Promise.resolve(null);
      });

      const result = await getCachedLinkerExecution(mockLinkerId);

      expect(result.data).toBeNull();
      expect(result.metadata).toBeNull();
      expect(result.isStale).toBe(true);
    });

    it('should handle redis errors gracefully', async () => {
      const error = new Error('Redis get error');
      vi.spyOn(redis, 'get').mockRejectedValue(error);

      const result = await getCachedLinkerExecution(mockLinkerId);

      expect(result.data).toBeNull();
      expect(result.metadata).toBeNull();
      expect(result.isStale).toBe(true);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error retrieving cached linker execution for ${mockLinkerId}`),
        error
      );
    });
  });

  describe('invalidateLinkerCache', () => {
    it('should delete cache and metadata keys', async () => {
      const delSpy = vi.spyOn(redis, 'del').mockResolvedValue(2); // 2 keys deleted

      const result = await invalidateLinkerCache(mockLinkerId);

      expect(result).toBe(true);
      expect(delSpy).toHaveBeenCalledWith(
        `linker:cache:${mockLinkerId}`,
        `linker:metadata:${mockLinkerId}`
      );
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`Invalidated cache for linker ${mockLinkerId}`),
        expect.objectContaining({
          linkerId: mockLinkerId,
          keysDeleted: 2
        })
      );
    });

    it('should return false when no keys were deleted', async () => {
      vi.spyOn(redis, 'del').mockResolvedValue(0); // No keys deleted

      const result = await invalidateLinkerCache(mockLinkerId);

      expect(result).toBe(false);
    });

    it('should handle redis errors gracefully', async () => {
      const error = new Error('Redis delete error');
      vi.spyOn(redis, 'del').mockRejectedValue(error);

      const result = await invalidateLinkerCache(mockLinkerId);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error invalidating cache for linker ${mockLinkerId}`),
        error
      );
    });
  });

  describe('updateLinkerCacheTTL', () => {
    it('should update TTL for both cache and metadata keys with default value', async () => {
      const expireSpy = vi.spyOn(redis, 'expire').mockResolvedValue(1);

      const result = await updateLinkerCacheTTL(mockLinkerId);

      expect(result).toBe(true);
      expect(expireSpy).toHaveBeenCalledTimes(2);
      expect(expireSpy).toHaveBeenCalledWith(
        `linker:cache:${mockLinkerId}`,
        14 * 24 * 60 * 60
      );
      expect(expireSpy).toHaveBeenCalledWith(
        `linker:metadata:${mockLinkerId}`,
        14 * 24 * 60 * 60
      );
    });

    it('should update TTL with custom value', async () => {
      const expireSpy = vi.spyOn(redis, 'expire').mockResolvedValue(1);
      const customTTL = 3600; // 1 hour

      const result = await updateLinkerCacheTTL(mockLinkerId, customTTL);

      expect(result).toBe(true);
      expect(expireSpy).toHaveBeenCalledWith(
        `linker:cache:${mockLinkerId}`,
        customTTL
      );
      expect(expireSpy).toHaveBeenCalledWith(
        `linker:metadata:${mockLinkerId}`,
        customTTL
      );
    });

    it('should handle redis errors gracefully', async () => {
      const error = new Error('Redis expire error');
      vi.spyOn(redis, 'expire').mockRejectedValue(error);

      const result = await updateLinkerCacheTTL(mockLinkerId);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error updating TTL for linker ${mockLinkerId}`),
        error
      );
    });
  });

  describe('getLinkerCacheTTL', () => {
    it('should return TTL in seconds for existing key', async () => {
      vi.spyOn(redis, 'ttl').mockResolvedValue(86400); // 1 day

      const result = await getLinkerCacheTTL(mockLinkerId);

      expect(result).toBe(86400);
    });

    it('should return -1 for key with no expiration', async () => {
      vi.spyOn(redis, 'ttl').mockResolvedValue(-1);

      const result = await getLinkerCacheTTL(mockLinkerId);

      expect(result).toBe(-1);
    });

    it('should return -2 for non-existent key', async () => {
      vi.spyOn(redis, 'ttl').mockResolvedValue(-2);

      const result = await getLinkerCacheTTL(mockLinkerId);

      expect(result).toBe(-2);
    });

    it('should handle redis errors gracefully', async () => {
      const error = new Error('Redis TTL error');
      vi.spyOn(redis, 'ttl').mockRejectedValue(error);

      const result = await getLinkerCacheTTL(mockLinkerId);

      expect(result).toBe(-2);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(`Error getting TTL for linker ${mockLinkerId}`),
        error
      );
    });
  });

  describe('hasValidCache', () => {
    it('should return true when cache exists and is not stale', async () => {
      const now = Date.now();
      const cachedData = {
        data: mockData,
        cachedAt: now - (30 * 60 * 1000), // 30 minutes ago
        linkerId: mockLinkerId
      };
      const cachedMetadata = {
        ...mockMetadata,
        lastExecutedAt: now - (30 * 60 * 1000),
        linkerId: mockLinkerId
      };

      vi.spyOn(redis, 'get').mockImplementation((key) => {
        if (key === `linker:cache:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedData));
        }
        if (key === `linker:metadata:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedMetadata));
        }
        return Promise.resolve(null);
      });

      const result = await hasValidCache(mockLinkerId);

      expect(result).toBe(true);
    });

    it('should return false when cache is stale', async () => {
      const now = Date.now();
      const cachedData = {
        data: mockData,
        cachedAt: now - (2 * 60 * 60 * 1000), // 2 hours ago
        linkerId: mockLinkerId
      };
      const cachedMetadata = {
        ...mockMetadata,
        lastExecutedAt: now - (2 * 60 * 60 * 1000),
        linkerId: mockLinkerId
      };

      vi.spyOn(redis, 'get').mockImplementation((key) => {
        if (key === `linker:cache:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedData));
        }
        if (key === `linker:metadata:${mockLinkerId}`) {
          return Promise.resolve(JSON.stringify(cachedMetadata));
        }
        return Promise.resolve(null);
      });

      const result = await hasValidCache(mockLinkerId);

      expect(result).toBe(false);
    });

    it('should return false when cache does not exist', async () => {
      vi.spyOn(redis, 'get').mockResolvedValue(null);

      const result = await hasValidCache(mockLinkerId);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis error');
      vi.spyOn(redis, 'get').mockRejectedValue(error);

      const result = await hasValidCache(mockLinkerId);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle empty data object', async () => {
      const setexSpy = vi.spyOn(redis, 'setex').mockResolvedValue('OK');

      const result = await cacheLinkerExecution(mockLinkerId, {});

      expect(result).toBe(true);
      const cacheCall = setexSpy.mock.calls[0];
      const cachedData = JSON.parse(cacheCall[2]);
      expect(cachedData.data).toEqual({});
    });

    it('should handle special characters in linkerId', async () => {
      const specialLinkerId = 'linker-123-abc_def';
      const setexSpy = vi.spyOn(redis, 'setex').mockResolvedValue('OK');

      const result = await cacheLinkerExecution(specialLinkerId, mockData);

      expect(result).toBe(true);
      expect(setexSpy).toHaveBeenCalledWith(
        `linker:cache:${specialLinkerId}`,
        expect.any(Number),
        expect.any(String)
      );
    });

    it('should maintain data integrity through cache cycle', async () => {
      // Cache the data
      const setexSpy = vi.spyOn(redis, 'setex').mockResolvedValue('OK');
      await cacheLinkerExecution(mockLinkerId, mockData, mockMetadata);

      // Get the cached data
      const cacheCall = setexSpy.mock.calls[0];
      const cachedDataString = cacheCall[2];
      const metadataCall = setexSpy.mock.calls[1];
      const cachedMetadataString = metadataCall[2];

      vi.spyOn(redis, 'get').mockImplementation((key) => {
        if (key === `linker:cache:${mockLinkerId}`) {
          return Promise.resolve(cachedDataString);
        }
        if (key === `linker:metadata:${mockLinkerId}`) {
          return Promise.resolve(cachedMetadataString);
        }
        return Promise.resolve(null);
      });

      const result = await getCachedLinkerExecution(mockLinkerId);

      expect(result.data).toEqual(mockData);
      expect(result.metadata.mergeStrategy).toBe(mockMetadata.mergeStrategy);
      expect(result.metadata.datasourceCount).toBe(mockMetadata.datasourceCount);
    });
  });
});
