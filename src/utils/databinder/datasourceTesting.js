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
 * @returns {Object} Primary test result
 */
export const performPrimaryTest = async (instance) => {
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
      testResult = await executeTestMethod(
        instance,
        'default',
        'Basic connectivity test using default method',
        {
          responseOptions: { 
            throwHttpErrors: false,
            fullResponse: true 
          },
          method: 'GET'
        }
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
 * @returns {Array} Additional test results
 */
export const performAdditionalTests = async (instance, definitionId, availableMethods) => {
  const additionalTestMethods = getAdditionalTestMethods(definitionId, availableMethods);
  const additionalResults = [];

  for (const { methodName: testMethodName, description } of additionalTestMethods) {
    if (instance.methods[testMethodName] && typeof instance.methods[testMethodName] === 'function') {
      const result = await executeTestMethod(instance, testMethodName, description);
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
