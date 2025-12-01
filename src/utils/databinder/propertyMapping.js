/**
 * Property mapping utilities for datasource operations
 */

/**
 * Applies property mapping to transform property names in the response data
 * @param {any} data - The data to transform (object, array, or primitive)
 * @param {Object} mapping - The property mapping object (oldKey -> newKey)
 * @returns {any} - The transformed data
 */
export const applyPropertyMapping = (data, mapping) => {
  if (!data || typeof data !== 'object' || !mapping || Object.keys(mapping).length === 0) {
    return data;
  }

  // Handle arrays by applying mapping to each item
  if (Array.isArray(data)) {
    return data.map(item => applyPropertyMapping(item, mapping));
  }

  // Handle objects by remapping properties
  const remapped = {};
  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      const newKey = mapping[key] || key;
      // If the value is an object or array, recursively apply mapping
      if (typeof data[key] === 'object' && data[key] !== null) {
        remapped[newKey] = applyPropertyMapping(data[key], mapping);
      } else {
        remapped[newKey] = data[key];
      }
    }
  }
  return remapped;
};

/**
 * Validates property mapping configuration
 * @param {Object} mapping - The mapping object to validate
 * @returns {Object} Validation result
 */
export const validatePropertyMapping = (mapping) => {
  if (!mapping) {
    return { isValid: true };
  }

  if (typeof mapping !== 'object') {
    return { 
      isValid: false, 
      error: 'Property mapping must be an object' 
    };
  }

  // Check for circular mappings
  const values = Object.values(mapping);
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  
  if (duplicates.length > 0) {
    return { 
      isValid: false, 
      error: `Duplicate mapping targets found: ${duplicates.join(', ')}` 
    };
  }

  return { isValid: true };
};

/**
 * Creates property mapping metadata for logging/tracking
 * @param {any} originalData - Original data before mapping
 * @param {any} transformedData - Data after mapping
 * @param {Object} mapping - The mapping rules applied
 * @returns {Object} Mapping metadata
 */
export const createMappingMetadata = (originalData, transformedData, mapping) => ({
  applied: !!mapping,
  mappingRules: mapping || null,
  originalSize: JSON.stringify(originalData).length,
  transformedSize: JSON.stringify(transformedData).length,
  sizeChange: JSON.stringify(transformedData).length - JSON.stringify(originalData).length,
  rulesCount: mapping ? Object.keys(mapping).length : 0
});
