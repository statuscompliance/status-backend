/**
 * Linker validation utilities
 */

/**
 * Validate linker input for creation
 * @param {Object} input - The input to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateLinkerInput = (input) => {
  const errors = [];

  if (!input.datasourceIds || !Array.isArray(input.datasourceIds)) {
    errors.push('datasourceIds must be an array');
  } else if (input.datasourceIds.length === 0) {
    errors.push('datasourceIds must contain at least one datasource ID');
  }

  if (input.defaultMethodName !== undefined && typeof input.defaultMethodName !== 'string') {
    errors.push('defaultMethodName must be a string');
  }

  if (input.datasourceConfigs !== undefined && input.datasourceConfigs !== null) {
    if (typeof input.datasourceConfigs !== 'object' || Array.isArray(input.datasourceConfigs)) {
      errors.push('datasourceConfigs must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate linker input for updates
 * @param {Object} input - The input to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateLinkerUpdateInput = (input) => {
  const errors = [];

  if (input.datasourceIds !== undefined) {
    if (!Array.isArray(input.datasourceIds)) {
      errors.push('datasourceIds must be an array');
    } else if (input.datasourceIds.length === 0) {
      errors.push('datasourceIds must contain at least one datasource ID');
    }
  }

  if (input.defaultMethodName !== undefined && typeof input.defaultMethodName !== 'string') {
    errors.push('defaultMethodName must be a string');
  }

  if (input.datasourceConfigs !== undefined && input.datasourceConfigs !== null) {
    if (typeof input.datasourceConfigs !== 'object' || Array.isArray(input.datasourceConfigs)) {
      errors.push('datasourceConfigs must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate that all datasource IDs exist in the database
 * @param {Array<string>} datasourceIds - Array of datasource IDs to validate
 * @param {Object} Datasource - Datasource model
 * @param {number} userId - User ID to check ownership
 * @returns {Promise<Object>} Validation result with isValid, errors, and found datasources
 */
export const validateDatasourcesExist = async (datasourceIds, Datasource, userId) => {
  try {
    const datasources = await Datasource.findAll({
      where: {
        id: datasourceIds,
        ownerId: userId
      }
    });

    const foundIds = datasources.map(ds => ds.id);
    const missingIds = datasourceIds.filter(id => !foundIds.includes(id));

    if (missingIds.length > 0) {
      return {
        isValid: false,
        errors: [`The following datasource IDs were not found or you don't have access: ${missingIds.join(', ')}`],
        datasources: []
      };
    }

    return {
      isValid: true,
      errors: [],
      datasources
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Error validating datasources: ${error.message}`],
      datasources: []
    };
  }
};

/**
 * Validate datasource configs structure
 * @param {Object} datasourceConfigs - The configs to validate
 * @param {Array<string>} datasourceIds - Array of valid datasource IDs
 * @returns {Object} Validation result
 */
export const validateDatasourceConfigs = (datasourceConfigs, datasourceIds) => {
  const errors = [];

  if (!datasourceConfigs) {
    return { isValid: true, errors: [] };
  }

  for (const [dsId, config] of Object.entries(datasourceConfigs)) {
    if (!datasourceIds.includes(dsId)) {
      errors.push(`Config provided for datasource '${dsId}' but this ID is not in datasourceIds array`);
    }

    if (config.id && config.id !== dsId) {
      errors.push(`Config for datasource '${dsId}' has mismatched id field: '${config.id}'`);
    }

    if (config.methodConfig) {
      if (typeof config.methodConfig !== 'object') {
        errors.push(`methodConfig for datasource '${dsId}' must be an object`);
      } else if (config.methodConfig.methodName && typeof config.methodConfig.methodName !== 'string') {
        errors.push(`methodConfig.methodName for datasource '${dsId}' must be a string`);
      }
    }

    if (config.propertyMapping) {
      if (typeof config.propertyMapping !== 'object' || Array.isArray(config.propertyMapping)) {
        errors.push(`propertyMapping for datasource '${dsId}' must be an object`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Normalize datasource configs to ensure all have the correct structure
 * @param {Object} datasourceConfigs - The configs to normalize
 * @param {Array<string>} datasourceIds - Array of datasource IDs
 * @returns {Object} Normalized configs
 */
export const normalizeDatasourceConfigs = (datasourceConfigs, datasourceIds) => {
  if (!datasourceConfigs) {
    return {};
  }

  const normalized = {};

  for (const dsId of datasourceIds) {
    if (datasourceConfigs[dsId]) {
      normalized[dsId] = {
        id: dsId,
        methodConfig: datasourceConfigs[dsId].methodConfig || undefined,
        propertyMapping: datasourceConfigs[dsId].propertyMapping || undefined
      };
    }
  }

  return normalized;
};
