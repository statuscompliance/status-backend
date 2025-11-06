/**
 * Core linker utility functions for sanitization and ownership checks
 */

/**
 * Sanitize a linker object for API response
 * @param {Object} linker - The linker object from database
 * @param {boolean} includeConfigs - Whether to include full datasource configs
 * @returns {Object} Sanitized linker object
 */
export const sanitizeLinker = (linker, includeConfigs = false) => {
  if (!linker) return null;

  const sanitized = {
    id: linker.id,
    name: linker.name,
    defaultMethodName: linker.defaultMethodName,
    datasourceIds: linker.datasourceIds,
    description: linker.description,
    environment: linker.environment,
    isActive: linker.isActive,
    createdBy: linker.createdBy,
    version: linker.version,
    lastExecutedAt: linker.lastExecutedAt,
    executionStatus: linker.executionStatus,
    createdAt: linker.createdAt,
    updatedAt: linker.updatedAt,
    ownerId: linker.ownerId
  };

  if (includeConfigs) {
    sanitized.datasourceConfigs = linker.datasourceConfigs;
  }

  return sanitized;
};

/**
 * Check if user owns the linker
 * @param {Object} linker - The linker object
 * @param {number} userId - The user ID to check
 * @returns {boolean} True if user owns the linker
 */
export const checkLinkerOwnership = (linker, userId) => {
  return linker && linker.ownerId === userId;
};

/**
 * Generate a unique execution ID for linker operations
 * @param {string} linkerId - The linker ID
 * @param {number} timestamp - Timestamp for uniqueness
 * @returns {string} Unique execution ID
 */
export const generateLinkerExecutionId = (linkerId, timestamp) => {
  return `linker_${linkerId}_${timestamp}`;
};
