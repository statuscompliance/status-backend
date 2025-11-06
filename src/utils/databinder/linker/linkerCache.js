import redis from '../../../config/redis.js';
import logger from '../../../config/logger.js';

/**
 * Cache keys follow the pattern: linker:cache:{linkerId}
 * Metadata keys follow the pattern: linker:metadata:{linkerId}
 */

const CACHE_PREFIX = 'linker:cache:';
const METADATA_PREFIX = 'linker:metadata:';
const TWO_WEEKS_IN_SECONDS = 14 * 24 * 60 * 60; // 14 days
const ONE_HOUR_IN_SECONDS = 60 * 60; // 1 hour

/**
 * Stores linker execution results in cache with 2 weeks expiration
 * @param {string} linkerId - The linker ID
 * @param {object} data - The execution data to cache
 * @param {object} metadata - Metadata about the execution (timestamp, mergeStrategy, etc.)
 * @returns {Promise<boolean>} - Success status
 */
export const cacheLinkerExecution = async (linkerId, data, metadata = {}) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${linkerId}`;
    const metadataKey = `${METADATA_PREFIX}${linkerId}`;
    
    const cacheData = {
      data,
      cachedAt: Date.now(),
      linkerId
    };
    
    const metadataWithTimestamp = {
      ...metadata,
      lastExecutedAt: Date.now(),
      linkerId
    };

    // Store data with 2 weeks expiration
    await redis.setex(
      cacheKey, 
      TWO_WEEKS_IN_SECONDS, 
      JSON.stringify(cacheData)
    );
    
    // Store metadata with 2 weeks expiration
    await redis.setex(
      metadataKey,
      TWO_WEEKS_IN_SECONDS,
      JSON.stringify(metadataWithTimestamp)
    );

    logger.debug(`Cached linker execution for linker ${linkerId}`, {
      linkerId,
      expirationSeconds: TWO_WEEKS_IN_SECONDS,
      cachedAt: new Date(cacheData.cachedAt).toISOString()
    });

    return true;
  } catch (error) {
    logger.error(`Error caching linker execution for ${linkerId}:`, error);
    return false;
  }
};

/**
 * Retrieves cached linker execution data if available and not stale
 * @param {string} linkerId - The linker ID
 * @returns {Promise<{data: object|null, metadata: object|null, isStale: boolean}>}
 */
export const getCachedLinkerExecution = async (linkerId) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${linkerId}`;
    const metadataKey = `${METADATA_PREFIX}${linkerId}`;
    
    const [cachedData, cachedMetadata] = await Promise.all([
      redis.get(cacheKey),
      redis.get(metadataKey)
    ]);

    if (!cachedData || !cachedMetadata) {
      logger.debug(`No cached data found for linker ${linkerId}`);
      return { data: null, metadata: null, isStale: true };
    }

    const parsedData = JSON.parse(cachedData);
    const parsedMetadata = JSON.parse(cachedMetadata);
    
    // Check if cache is stale (more than 1 hour old)
    const cacheAge = Date.now() - parsedMetadata.lastExecutedAt;
    const isStale = cacheAge > (ONE_HOUR_IN_SECONDS * 1000);

    logger.debug(`Retrieved cached data for linker ${linkerId}`, {
      linkerId,
      cachedAt: new Date(parsedData.cachedAt).toISOString(),
      cacheAgeMs: cacheAge,
      isStale
    });

    return {
      data: parsedData.data,
      metadata: parsedMetadata,
      isStale,
      cacheAge: cacheAge
    };
  } catch (error) {
    logger.error(`Error retrieving cached linker execution for ${linkerId}:`, error);
    return { data: null, metadata: null, isStale: true };
  }
};

/**
 * Invalidates (deletes) cached linker execution data
 * @param {string} linkerId - The linker ID
 * @returns {Promise<boolean>} - Success status
 */
export const invalidateLinkerCache = async (linkerId) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${linkerId}`;
    const metadataKey = `${METADATA_PREFIX}${linkerId}`;
    
    const deletedCount = await redis.del(cacheKey, metadataKey);

    logger.debug(`Invalidated cache for linker ${linkerId}`, {
      linkerId,
      keysDeleted: deletedCount
    });

    return deletedCount > 0;
  } catch (error) {
    logger.error(`Error invalidating cache for linker ${linkerId}:`, error);
    return false;
  }
};

/**
 * Updates the TTL (expiration) of cached linker data
 * @param {string} linkerId - The linker ID
 * @param {number} seconds - New TTL in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const updateLinkerCacheTTL = async (linkerId, seconds = TWO_WEEKS_IN_SECONDS) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${linkerId}`;
    const metadataKey = `${METADATA_PREFIX}${linkerId}`;
    
    await Promise.all([
      redis.expire(cacheKey, seconds),
      redis.expire(metadataKey, seconds)
    ]);

    logger.debug(`Updated TTL for linker ${linkerId}`, {
      linkerId,
      newTTLSeconds: seconds
    });

    return true;
  } catch (error) {
    logger.error(`Error updating TTL for linker ${linkerId}:`, error);
    return false;
  }
};

/**
 * Gets the remaining TTL for cached linker data
 * @param {string} linkerId - The linker ID
 * @returns {Promise<number>} - TTL in seconds, -1 if no expiration, -2 if key doesn't exist
 */
export const getLinkerCacheTTL = async (linkerId) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${linkerId}`;
    const ttl = await redis.ttl(cacheKey);
    
    return ttl;
  } catch (error) {
    logger.error(`Error getting TTL for linker ${linkerId}:`, error);
    return -2;
  }
};

/**
 * Checks if a linker has valid (non-stale) cached data
 * @param {string} linkerId - The linker ID
 * @returns {Promise<boolean>} - True if valid cache exists
 */
export const hasValidCache = async (linkerId) => {
  try {
    const { data, isStale } = await getCachedLinkerExecution(linkerId);
    return data !== null && !isStale;
  } catch (error) {
    logger.error(`Error checking valid cache for linker ${linkerId}:`, error);
    return false;
  }
};

export default {
  cacheLinkerExecution,
  getCachedLinkerExecution,
  invalidateLinkerCache,
  updateLinkerCacheTTL,
  getLinkerCacheTTL,
  hasValidCache
};
