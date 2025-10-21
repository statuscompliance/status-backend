/**
 * Method description utilities for datasource operations
 */

/**
 * Provides method descriptions based on datasource definition
 * @param {Function} listDatasourceDefinitions - Function to list definitions from catalog
 * @param {string} definitionId - Datasource definition ID
 * @param {string} methodName - Method name
 * @returns {string} Method description
 */
export const getMethodDescription = (listDatasourceDefinitions, definitionId, methodName) => {
  try {
    // Try to get description from the datasource definition in the catalog
    const definitions = listDatasourceDefinitions();
    const definition = definitions.find(def => def.id === definitionId);
    
    if (definition) {
      // Check if the definition has method descriptions
      if (definition.methodDescriptions && definition.methodDescriptions[methodName]) {
        return definition.methodDescriptions[methodName];
      }
      
      // Check if the definition has available methods with descriptions
      if (definition.availableMethods && Array.isArray(definition.availableMethods)) {
        const methodInfo = definition.availableMethods.find(method => 
          typeof method === 'object' && method.name === methodName
        );
        if (methodInfo && methodInfo.description) {
          return methodInfo.description;
        }
      }
      
      // Fallback to generic descriptions based on common method patterns
      return getGenericMethodDescription(methodName, definition.name || definitionId);
    }
    
    return getGenericMethodDescription(methodName, definitionId);
  } catch {
    return getGenericMethodDescription(methodName, definitionId);
  }
};

/**
 * Provides generic method descriptions based on common patterns
 * @param {string} methodName - Method name
 * @param {string} datasourceName - Datasource name
 * @returns {string} Generic method description
 */
export const getGenericMethodDescription = (methodName, datasourceName) => {
  const genericDescriptions = {
    'default': `Default method for ${datasourceName} datasource`,
    'test': `Test connectivity for ${datasourceName}`,
    'get': 'HTTP GET request',
    'post': 'HTTP POST request',
    'put': 'HTTP PUT request',
    'patch': 'HTTP PATCH request',
    'delete': 'HTTP DELETE request',
    'getAll': 'Retrieve all items',
    'getById': 'Retrieve item by ID',
    'create': 'Create new item',
    'update': 'Update existing item',
    'search': 'Search items with criteria',
    'getUsers': 'Retrieve user information',
    'getGroups': 'Retrieve group information',
    'getEvents': 'Retrieve events',
    'authenticate': 'Perform authentication'
  };

  return genericDescriptions[methodName] || `Execute ${methodName} method on ${datasourceName}`;
};

/**
 * Creates methods info object for a datasource instance
 * @param {Object} instance - Datasource instance
 * @param {Function} getDescriptionFn - Function to get method descriptions
 * @returns {Object} Methods info object
 */
export const createMethodsInfo = (instance, getDescriptionFn) => {
  const methodsInfo = {};
  
  for (const [methodName, methodFunc] of Object.entries(instance.methods)) {
    methodsInfo[methodName] = {
      available: true,
      type: typeof methodFunc,
      description: getDescriptionFn(methodName)
    };
  }

  return methodsInfo;
};
