/**
 * Validation utilities for datasource operations
 */

/**
 * Validates datasource creation input
 * @param {Object} input - The input to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateDatasourceInput = (input) => {
  const errors = [];
  
  if (typeof input.name !== 'string' || !input.name.trim()) {
    errors.push('Name must be a non-empty string');
  }

  if (typeof input.definitionId !== 'string' || !input.definitionId.trim()) {
    errors.push('DefinitionId must be a non-empty string');
  }

  if (!input.config || typeof input.config !== 'object') {
    errors.push('Config must be a valid object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates datasource update input
 * @param {Object} input - The input to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateDatasourceUpdateInput = (input) => {
  const errors = [];
  
  if (input.name !== undefined && (typeof input.name !== 'string' || !input.name.trim())) {
    errors.push('Name must be a non-empty string');
  }

  if (input.definitionId !== undefined && (typeof input.definitionId !== 'string' || !input.definitionId.trim())) {
    errors.push('DefinitionId must be a non-empty string');
  }

  if (input.config !== undefined && (!input.config || typeof input.config !== 'object')) {
    errors.push('Config must be a valid object');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates that a definition exists in the catalog
 * @param {string} definitionId - The definition ID to validate
 * @param {Array} availableDefinitions - Available definitions from catalog
 * @returns {Object} Validation result
 */
export const validateDefinitionExists = (definitionId, availableDefinitions) => {
  const definition = availableDefinitions.find(def => def.id === definitionId);
  
  if (!definition) {
    return {
      isValid: false,
      error: `Invalid definitionId '${definitionId}'. Available types: ${availableDefinitions.map(d => d.id).join(', ')}`
    };
  }

  return {
    isValid: true,
    definition
  };
};

/**
 * Validates datasource config using catalog
 * @param {Function} createDatasourceInstance - Function to create datasource instance
 * @param {string} definitionId - Definition ID
 * @param {Object} config - Configuration to validate
 * @param {string} instanceId - Instance ID for testing
 * @returns {Object} Validation result
 */
export const validateDatasourceConfig = (createDatasourceInstance, definitionId, config, instanceId) => {
  try {
    const instance = createDatasourceInstance(definitionId, config, instanceId);
    return {
      isValid: true,
      instance
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * Checks if a method exists and is callable on an instance
 * @param {Object} instance - Datasource instance
 * @param {string} methodName - Method name to check
 * @returns {Object} Validation result
 */
export const validateMethodExists = (instance, methodName) => {
  if (!instance.methods[methodName] || typeof instance.methods[methodName] !== 'function') {
    const availableMethods = Object.keys(instance.methods);
    return {
      isValid: false,
      error: `Method '${methodName}' not available for this datasource`,
      availableMethods
    };
  }

  return {
    isValid: true
  };
};
