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

  // datasourceConfigs is now REQUIRED and must configure all datasources
  if (!input.datasourceConfigs || typeof input.datasourceConfigs !== 'object' || Array.isArray(input.datasourceConfigs)) {
    errors.push('datasourceConfigs is required and must be an object');
  } else if (input.datasourceIds && Array.isArray(input.datasourceIds)) {
    // Validate that all datasources have configs
    for (const dsId of input.datasourceIds) {
      if (!input.datasourceConfigs[dsId]) {
        errors.push(`Missing configuration for datasource '${dsId}' in datasourceConfigs`);
      }
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

    const foundIds = new Set(datasources.map(ds => ds.id));
    const missingIds = datasourceIds.filter(id => !foundIds.has(id));

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
 * Validate a single datasource config
 * @param {string} dsId - Datasource ID
 * @param {Object} config - Config to validate
 * @param {Array<string>} datasourceIds - Array of valid datasource IDs
 * @returns {Array<string>} Array of error messages
 */
const validateSingleDatasourceConfig = (dsId, config, datasourceIds) => {
  const errors = [];
  const datasourceIdSet = new Set(datasourceIds);

  if (!datasourceIdSet.has(dsId)) {
    errors.push(`Config provided for datasource '${dsId}' but this ID is not in datasourceIds array`);
  }

  if (config.id && config.id !== dsId) {
    errors.push(`Config for datasource '${dsId}' has mismatched id field: '${config.id}'`);
  }

  // methodConfig is now MANDATORY for each datasource
  if (!config.methodConfig) {
    errors.push(`methodConfig is required for datasource '${dsId}'`);
  } else {
    const methodConfigErrors = validateMethodConfig(dsId, config.methodConfig);
    errors.push(...methodConfigErrors);
  }

  if (config.propertyMapping) {
    const propertyMappingErrors = validatePropertyMapping(dsId, config.propertyMapping);
    errors.push(...propertyMappingErrors);
  }

  return errors;
};

/**
 * Validate method config structure
 * @param {string} dsId - Datasource ID
 * @param {Object} methodConfig - Method config to validate
 * @returns {Array<string>} Array of error messages
 */
const validateMethodConfig = (dsId, methodConfig) => {
  const errors = [];

  if (typeof methodConfig !== 'object') {
    errors.push(`methodConfig for datasource '${dsId}' must be an object`);
    return errors;
  }

  // methodName is now MANDATORY
  if (!methodConfig.methodName) {
    errors.push(`methodConfig.methodName is required for datasource '${dsId}'`);
  } else if (typeof methodConfig.methodName !== 'string') {
    errors.push(`methodConfig.methodName for datasource '${dsId}' must be a string`);
  }

  // Validate options if provided
  if (methodConfig.options !== undefined && (typeof methodConfig.options !== 'object' || Array.isArray(methodConfig.options))) {
    errors.push(`methodConfig.options for datasource '${dsId}' must be an object`);
  }

  return errors;
};

/**
 * Validate property mapping structure
 * @param {string} dsId - Datasource ID
 * @param {Object} propertyMapping - Property mapping to validate
 * @returns {Array<string>} Array of error messages
 */
const validatePropertyMapping = (dsId, propertyMapping) => {
  const errors = [];

  if (typeof propertyMapping !== 'object' || Array.isArray(propertyMapping)) {
    errors.push(`propertyMapping for datasource '${dsId}' must be an object`);
  }

  return errors;
};

/**
 * Validate datasource configs structure
 * @param {Object} datasourceConfigs - The configs to validate
 * @param {Array<string>} datasourceIds - Array of valid datasource IDs
 * @returns {Object} Validation result
 */
export const validateDatasourceConfigs = (datasourceConfigs, datasourceIds) => {
  if (!datasourceConfigs) {
    return { isValid: false, errors: ['datasourceConfigs is required and cannot be null'] };
  }

  const allErrors = [];

  // Check that ALL datasources have configurations
  const configuredDatasourceIds = new Set(Object.keys(datasourceConfigs));
  for (const dsId of datasourceIds) {
    if (!configuredDatasourceIds.has(dsId)) {
      allErrors.push(`Missing configuration for datasource '${dsId}'`);
    }
  }

  // Validate each config
  for (const [dsId, config] of Object.entries(datasourceConfigs)) {
    const configErrors = validateSingleDatasourceConfig(dsId, config, datasourceIds);
    allErrors.push(...configErrors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
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
    throw new Error('datasourceConfigs is required and cannot be null');
  }

  const normalized = {};

  for (const dsId of datasourceIds) {
    if (!datasourceConfigs[dsId]) {
      throw new Error(`Missing configuration for datasource '${dsId}'`);
    }
    
    if (!datasourceConfigs[dsId].methodConfig) {
      throw new Error(`methodConfig is required for datasource '${dsId}'`);
    }

    normalized[dsId] = {
      id: dsId,
      methodConfig: datasourceConfigs[dsId].methodConfig,
      propertyMapping: datasourceConfigs[dsId].propertyMapping || undefined
    };
  }

  return normalized;
};
