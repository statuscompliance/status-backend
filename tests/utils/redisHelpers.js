import { vi } from 'vitest';

/**
 * Creates a comprehensive set of Redis method spies
 * @param {Object} redis - Redis client object
 * @returns {Object} Object containing all redis method spies
 */
export function createRedisMocks(redis) {
  return {
    setex: vi.spyOn(redis, 'setex'),
    get: vi.spyOn(redis, 'get'),
    del: vi.spyOn(redis, 'del'),
    expire: vi.spyOn(redis, 'expire'),
    ttl: vi.spyOn(redis, 'ttl'),
  };
}

/**
 * Stores original Redis methods for restoration
 * @param {Object} redis - Redis client object
 * @returns {Object} Object containing original Redis methods
 */
export function storeOriginalRedisMethods(redis) {
  return {
    setex: redis.setex,
    get: redis.get,
    del: redis.del,
    expire: redis.expire,
    ttl: redis.ttl,
  };
}

/**
 * Restores original Redis methods
 * @param {Object} redis - Redis client object
 * @param {Object} originalMethods - Object containing original methods
 */
export function restoreRedisMethods(redis, originalMethods) {
  if (originalMethods.setex) redis.setex = originalMethods.setex;
  if (originalMethods.get) redis.get = originalMethods.get;
  if (originalMethods.del) redis.del = originalMethods.del;
  if (originalMethods.expire) redis.expire = originalMethods.expire;
  if (originalMethods.ttl) redis.ttl = originalMethods.ttl;
}

/**
 * Mock Redis setex to return successful response
 * @param {Object} redis - Redis client object
 * @param {string} [response='OK'] - Response value
 * @returns {import('vitest').MockInstance} Spy instance
 */
export function mockRedisSetex(redis, response = 'OK') {
  return vi.spyOn(redis, 'setex').mockResolvedValue(response);
}

/**
 * Mock Redis get to return cached data
 * @param {Object} redis - Redis client object
 * @param {*} data - Data to return (will be JSON stringified)
 * @returns {import('vitest').MockInstance} Spy instance
 */
export function mockRedisGet(redis, data) {
  return vi.spyOn(redis, 'get').mockResolvedValue(
    data ? JSON.stringify(data) : null
  );
}

/**
 * Mock Redis get with custom implementation for multiple keys
 * @param {Object} redis - Redis client object
 * @param {Object} keyValueMap - Map of keys to their return values
 * @returns {import('vitest').MockInstance} Spy instance
 */
export function mockRedisGetMultiple(redis, keyValueMap) {
  return vi.spyOn(redis, 'get').mockImplementation((key) => {
    const value = keyValueMap[key];
    return Promise.resolve(value !== undefined ? JSON.stringify(value) : null);
  });
}

/**
 * Mock Redis del to return number of deleted keys
 * @param {Object} redis - Redis client object
 * @param {number} [count=1] - Number of keys deleted
 * @returns {import('vitest').MockInstance} Spy instance
 */
export function mockRedisDel(redis, count = 1) {
  return vi.spyOn(redis, 'del').mockResolvedValue(count);
}

/**
 * Mock Redis expire to return success
 * @param {Object} redis - Redis client object
 * @param {number} [result=1] - Result value (1 for success, 0 for failure)
 * @returns {import('vitest').MockInstance} Spy instance
 */
export function mockRedisExpire(redis, result = 1) {
  return vi.spyOn(redis, 'expire').mockResolvedValue(result);
}

/**
 * Mock Redis ttl to return time-to-live
 * @param {Object} redis - Redis client object
 * @param {number} ttl - TTL value (-2: key doesn't exist, -1: no expiration, >0: seconds)
 * @returns {import('vitest').MockInstance} Spy instance
 */
export function mockRedisTtl(redis, ttl) {
  return vi.spyOn(redis, 'ttl').mockResolvedValue(ttl);
}

/**
 * Mock Redis methods to reject with error
 * @param {Object} redis - Redis client object
 * @param {string[]} methods - Array of method names to mock
 * @param {Error} error - Error to reject with
 * @returns {Object} Object containing spy instances
 */
export function mockRedisError(redis, methods, error) {
  const spies = {};
  methods.forEach((method) => {
    spies[method] = vi.spyOn(redis, method).mockRejectedValue(error);
  });
  return spies;
}
