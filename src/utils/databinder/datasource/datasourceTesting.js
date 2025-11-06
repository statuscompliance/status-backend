/**
 * Testing utilities for datasource operations
 */

/**
 * Executes a test method on a datasource instance
 * @param {Object} instance - Datasource instance
 * @param {string} methodName - Method name to test
 * @param {string} description - Description of the test
 * @param {Object} options - Optional options for the method
 * @returns {Object} Test result
 */
export const executeTestMethod = async (instance, methodName, description, options = {}) => {
  try {
    const result = await instance.methods[methodName](options);
    
    // Check if the result indicates an HTTP error
    // When fullResponse is true, check the 'ok' field or status code
    if (result && typeof result === 'object') {
      // Check for HTTP response with 'ok' field (false means error)
      if (result.ok === false || (result.status && (result.status < 200 || result.status >= 300))) {
        return {
          method: methodName,
          status: 'failure',
          description,
          error: `HTTP ${result.status || 'error'}: ${result.statusText || result.data || 'Request failed'}`,
          result
        };
      }
    }
    
    return {
      method: methodName,
      status: 'success',
      description,
      result
    };
  } catch (error) {
    return {
      method: methodName,
      status: 'failure',
      description,
      error: error.message
    };
  }
};

/**
 * Performs primary test using 'test' method if available, otherwise 'default'
 * @param {Object} instance - Datasource instance
 * @param {Object} datasourceConfig - Datasource configuration (optional, for context)
 * @returns {Object} Primary test result
 */
export const performPrimaryTest = async (instance, datasourceConfig = {}) => {
  let primaryTestMethod = null;
  let testResult = null;

  // Try to use a 'test' method if available
  if (instance.methods.test && typeof instance.methods.test === 'function') {
    primaryTestMethod = 'test';
    testResult = await executeTestMethod(
      instance, 
      'test', 
      'Dedicated test method execution'
    );
  }

  // If no test method or it failed, try the default method with minimal options
  if (!primaryTestMethod || testResult?.status === 'failure') {
    if (instance.methods.default && typeof instance.methods.default === 'function') {
      primaryTestMethod = 'default';
      
      // Build test options
      const testOptions = {
        responseOptions: { 
          throwHttpErrors: false,
          fullResponse: true 
        },
        method: 'GET'
      };
      
      // If datasource has a resourceType, use it as the endpoint for testing
      if (datasourceConfig.resourceType) {
        testOptions.endpoint = datasourceConfig.resourceType;
      }
      // Otherwise, if there's a defaultEndpoint, use that
      else if (datasourceConfig.defaultEndpoint) {
        testOptions.endpoint = datasourceConfig.defaultEndpoint;
      }
      
      testResult = await executeTestMethod(
        instance,
        'default',
        'Basic connectivity test using default method',
        testOptions
      );
    }
  }

  return {
    primaryTestMethod,
    testResult
  };
};

/**
 * Executes additional test methods based on datasource type
 * @param {Object} instance - Datasource instance
 * @param {string} definitionId - Datasource definition ID
 * @param {Array} availableMethods - Available methods on the instance
 * @param {Object} datasourceConfig - Datasource configuration (optional, for context)
 * @returns {Array} Additional test results
 */
export const performAdditionalTests = async (instance, definitionId, availableMethods, datasourceConfig = {}) => {
  const additionalTestMethods = getAdditionalTestMethods(definitionId, availableMethods);
  const additionalResults = [];

  for (const { methodName: testMethodName, description } of additionalTestMethods) {
    if (instance.methods[testMethodName] && typeof instance.methods[testMethodName] === 'function') {
      // Build test options for methods that might need an endpoint
      const testOptions = {};
      
      // For search or getAll methods, provide endpoint if available
      if ((testMethodName === 'search' || testMethodName === 'getAll') && 
          (datasourceConfig.resourceType || datasourceConfig.defaultEndpoint)) {
        testOptions.endpoint = datasourceConfig.resourceType || datasourceConfig.defaultEndpoint;
      }
      
      const result = await executeTestMethod(instance, testMethodName, description, testOptions);
      additionalResults.push(result);
    }
  }

  return additionalResults;
};

/**
 * Determines overall test status from test results
 * @param {Array} allResults - All test results
 * @returns {string} Overall status ('success' or 'failure')
 */
export const determineOverallTestStatus = (allResults) => {
  if (!allResults || allResults.length === 0) {
    return 'failure';
  }

  // Find the primary test (usually 'default' or 'test')
  const primaryTest = allResults.find(result => 
    result.method === 'default' || result.method === 'test'
  );

  // If the primary test failed, the overall status is failure
  // unless there are other successful tests
  if (primaryTest && primaryTest.status === 'failure') {
    const hasOtherSuccessfulTest = allResults.some(
      result => result.status === 'success' && result.method !== primaryTest.method
    );
    
    // Only consider it success if there's at least one other successful test
    if (!hasOtherSuccessfulTest) {
      return 'failure';
    }
  }

  const hasSuccessfulTest = allResults.some(result => result.status === 'success');
  return hasSuccessfulTest ? 'success' : 'failure';
};

/**
 * Creates test summary from test results
 * @param {Array} testsPerformed - All performed tests
 * @param {string} primaryMethod - Primary test method used
 * @returns {Object} Test summary
 */
export const createTestSummary = (testsPerformed, primaryMethod) => ({
  totalTests: testsPerformed.length,
  successfulTests: testsPerformed.filter(t => t.status === 'success').length,
  failedTests: testsPerformed.filter(t => t.status === 'failure').length,
  primaryMethod
});

/**
 * Helper function to determine additional test methods based on available methods
 * @param {string} definitionId - Datasource definition ID
 * @param {Array} availableMethods - Available methods
 * @returns {Array} Additional test methods
 */
export const getAdditionalTestMethods = (definitionId, availableMethods) => {
  const additionalTests = [];
  
  // Define safe test methods in order of preference
  const safeTestMethods = [
    { method: 'getAll', description: 'Test fetching all items' },
    { method: 'get', description: 'Test GET request' },
    { method: 'search', description: 'Test search functionality' },
    { method: 'getUsers', description: 'Test user retrieval' },
    { method: 'getGroups', description: 'Test group retrieval' },
    { method: 'authenticate', description: 'Test authentication' }
  ];
  
  // Only add methods that are actually available and are likely to be safe for testing
  for (const { method, description } of safeTestMethods) {
    if (availableMethods.includes(method)) {
      additionalTests.push({
        methodName: method,
        description: `${description} for ${definitionId}`
      });
      // Only add one additional test method to avoid too many requests
      break;
    }
  }
  
  return additionalTests;
};

/**
 * Creates detailed test report
 * @param {string} datasourceType - Type of datasource
 * @param {Array} availableMethods - Available methods
 * @param {Array} testsPerformed - All performed tests
 * @returns {Object} Test details
 */
export const createTestDetails = (datasourceType, availableMethods, testsPerformed) => ({
  datasourceType,
  availableMethods,
  testsPerformed
});

/**
 * Creates test results object from all test outcomes
 * @param {Object} primaryResult - Primary test result
 * @param {Array} additionalResults - Additional test results
 * @returns {Object} Combined test results
 */
export const createTestResults = (primaryResult, additionalResults) => {
  const testResults = {};
  
  if (primaryResult) {
    testResults[primaryResult.method] = {
      status: primaryResult.status,
      ...(primaryResult.result && { result: primaryResult.result }),
      ...(primaryResult.error && { error: primaryResult.error })
    };
  }

  additionalResults.forEach(result => {
    testResults[result.method] = {
      status: result.status,
      ...(result.result && { result: result.result }),
      ...(result.error && { error: result.error })
    };
  });

  return testResults;
};
