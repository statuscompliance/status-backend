import { randomBytes } from 'crypto';

/**
 * Utility functions for datasource operations
 */

/**
 * Sanitizes datasource object for response
 * @param {Object} datasource - The datasource object
 * @param {boolean} includeConfig - Whether to include config in response
 * @returns {Object} Sanitized datasource object
 */
export const sanitizeDatasource = (datasource, includeConfig = false) => ({
  id: datasource.id,
  name: datasource.name,
  definitionId: datasource.definitionId,
  config: includeConfig ? datasource.config : '***HIDDEN***',
  description: datasource.description,
  environment: datasource.environment,
  isActive: datasource.isActive,
  createdBy: datasource.createdBy,
  version: datasource.version,
  lastTestedAt: datasource.lastTestedAt,
  testStatus: datasource.testStatus,
  createdAt: datasource.createdAt,
  updatedAt: datasource.updatedAt,
});

/**
 * Checks if user owns the datasource
 * @param {Object} datasource - The datasource object
 * @param {string} userId - The user ID
 * @returns {boolean} True if user owns the datasource
 */
export const checkOwnership = (datasource, userId) =>
  datasource && datasource.ownerId === userId;

/**
 * Normalizes datasource name
 * @param {string} name - The name to normalize
 * @returns {string} Normalized name
 */
export const normalizeName = (name) => 
  name.toLowerCase().replace(/\s+/g, '_');

/**
 * Generates unique instance ID
 * @param {string} userId - User ID
 * @param {string} normalizedName - Normalized name
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique instance ID
 */
export const generateInstanceId = (userId, normalizedName, prefix = '') => {
  const baseId = `${userId}_${normalizedName}_${Date.now()}`;
  return prefix ? `${prefix}_${baseId}` : baseId;
};

/**
 * Generates execution ID for tracking
 * @param {string} datasourceId - Datasource ID
 * @param {number} timestamp - Timestamp
 * @returns {string} Execution ID
 */
export const generateExecutionId = (datasourceId, timestamp = Date.now()) => 
  `exec_${datasourceId}_${timestamp}_${randomBytes(4).toString('hex')}`;

/**
 * Extracts data from nested response structure
 * @param {any} result - The result to extract data from
 * @returns {any} Extracted data
 */
export const extractResultData = (result) => {
  if (result && typeof result === 'object' && result.data !== undefined) {
    return result.data;
  }
  return result;
};
