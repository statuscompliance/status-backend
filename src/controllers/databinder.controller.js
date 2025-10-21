import { models } from '../models/models.js';
import { getDatabinderCatalog } from '../config/databinder.js';
import logger from '../config/logger.js';
import { 
  sanitizeDatasource, 
  checkOwnership, 
  normalizeName, 
  generateInstanceId, 
  generateExecutionId,
  extractResultData,
  validateDatasourceInput, 
  validateDatasourceUpdateInput, 
  validateDefinitionExists, 
  validateDatasourceConfig, 
  validateMethodExists,
  performPrimaryTest, 
  performAdditionalTests, 
  determineOverallTestStatus, 
  createTestSummary, 
  createTestDetails, 
  createTestResults,
  applyPropertyMapping, 
  createMappingMetadata,
  generateCorrelationIds, 
  createHttpCallDetails, 
  createSpanAttributes, 
  createCallInfo, 
  createResponseMetadata, 
  createLogMetadata, 
  createTelemetryContext,
  getMethodDescription, 
  createMethodsInfo 
} from '../utils/databinder/index.js';

// Get the initialized DatasourceCatalog
const datasourceCatalog = getDatabinderCatalog();

export const listDatasources = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const datasources = await models.Datasource.findAll({
      where: { ownerId: userId },
    });

    const sanitized = datasources.map((ds) => sanitizeDatasource(ds));
    res.json(sanitized);
  } catch (error) {
    logger.error('Error getting datasource methods:', error);
    res.status(500).json({ message: 'Error getting datasource methods', error: error.message });
  }
};

export const getDatasource = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const datasource = await models.Datasource.findByPk(id);

    if (!checkOwnership(datasource, userId)) {
      return res.status(404).json({ message: 'Datasource not found or access denied' });
    }

    res.json(sanitizeDatasource(datasource, true));
  } catch (error) {
    logger.error('Error fetching datasource:', error);
    res.status(500).json({ message: 'Error fetching datasource', error: error.message });
  }
};

export const createDatasource = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, definitionId, config, description, environment } = req.body;

    // Validate input
    const validation = validateDatasourceInput({ name, definitionId, config });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Validate that the definitionId exists
    const availableDefinitions = datasourceCatalog.listDatasourceDefinitions();
    const definitionValidation = validateDefinitionExists(definitionId, availableDefinitions);
    if (!definitionValidation.isValid) {
      return res.status(400).json({ error: definitionValidation.error });
    }

    const normalizedName = normalizeName(name);

    // Check if datasource with same name already exists for this user
    const existing = await models.Datasource.findOne({
      where: { name: normalizedName, ownerId: userId }
    });
    if (existing) {
      return res.status(409).json({ message: 'A datasource with this name already exists.' });
    }

    // Generate a unique instanceId based on user and name
    const instanceId = generateInstanceId(userId, normalizedName);

    // Try to create a datasource instance using the catalog to validate config
    const configValidation = validateDatasourceConfig(
      datasourceCatalog.createDatasourceInstance.bind(datasourceCatalog),
      definitionId,
      config,
      instanceId
    );

    if (!configValidation.isValid) {
      return res.status(400).json({ 
        message: 'Invalid datasource configuration', 
        error: configValidation.error 
      });
    }

    // Save to database
    const datasourceData = {
      name: normalizedName,
      definitionId,
      config,
      description: description || null,
      environment: environment || 'production',
      isActive: true,
      createdBy: req.user.username,
      version: 1,
      ownerId: userId,
    };

    const newDatasource = await models.Datasource.create(datasourceData);

    const response = sanitizeDatasource(newDatasource, true);
    res.status(201).json({ 
      message: 'Datasource created successfully', 
      instanceId: configValidation.instance.id,
      availableMethods: definitionValidation.definition.availableMethods || Object.keys(configValidation.instance.methods),
      ...response 
    });
  } catch (error) {
    logger.error('Error creating datasource:', error);
    res.status(500).json({ message: 'Error creating datasource', error: error.message });
  }
};

export const updateDatasource = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    const { name, definitionId, config, description, environment, isActive } = req.body;

    const datasource = await models.Datasource.findByPk(id);
    if (!checkOwnership(datasource, userId)) {
      return res.status(404).json({ message: 'Datasource not found or access denied' });
    }

    // Validate input
    const validation = validateDatasourceUpdateInput({ name, definitionId, config });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = normalizeName(name);
    }

    if (definitionId !== undefined) {
      updateData.definitionId = definitionId;
    }

    if (config !== undefined) {
      // Validate new config using the catalog
      const testDefinitionId = definitionId || datasource.definitionId;
      const configValidation = validateDatasourceConfig(
        datasourceCatalog.createDatasourceInstance.bind(datasourceCatalog),
        testDefinitionId,
        config,
        `test_${Date.now()}`
      );

      if (!configValidation.isValid) {
        return res.status(400).json({ 
          message: 'Invalid datasource configuration', 
          error: configValidation.error 
        });
      }
      
      updateData.config = config;
      updateData.version = datasource.version + 1;
      updateData.testStatus = 'not_tested';
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (environment !== undefined) {
      updateData.environment = environment;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    updateData.updatedAt = new Date();

    await datasource.update(updateData);

    res.json({ 
      message: 'Datasource updated successfully', 
      ...sanitizeDatasource(datasource, true) 
    });
  } catch (error) {
    logger.error('Error updating datasource:', error);
    res.status(500).json({ message: 'Error updating datasource', error: error.message });
  }
};

export const deleteDatasource = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const datasource = await models.Datasource.findByPk(id);
    if (!checkOwnership(datasource, userId)) {
      return res.status(404).json({ message: 'Datasource not found or access denied' });
    }

    await datasource.destroy();
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting datasource:', error);
    res.status(500).json({ message: 'Error deleting datasource', error: error.message });
  }
};

export const testDatasource = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const datasource = await models.Datasource.findByPk(id);
    if (!checkOwnership(datasource, userId)) {
      return res.status(404).json({ message: 'Datasource not found or access denied' });
    }

    // Update test status to pending
    await datasource.update({ 
      testStatus: 'pending',
      lastTestedAt: new Date()
    });

    try {
      // Create datasource instance and test it
      const instance = datasourceCatalog.createDatasourceInstance(
        datasource.definitionId,
        datasource.config,
        `test_${datasource.id}_${Date.now()}`
      );

      // Get available methods for this datasource type
      const availableMethods = Object.keys(instance.methods);

      // Perform primary test
      const { primaryTestMethod, testResult: primaryResult } = await performPrimaryTest(instance);

      // Perform additional tests
      const additionalResults = await performAdditionalTests(instance, datasource.definitionId, availableMethods);

      // Combine all results
      const allResults = [primaryResult, ...additionalResults].filter(Boolean);
      const testResults = createTestResults(primaryResult, additionalResults);
      const testDetails = createTestDetails(datasource.definitionId, availableMethods, allResults);

      // Determine overall test status
      const overallStatus = determineOverallTestStatus(allResults);

      await datasource.update({ 
        testStatus: overallStatus,
        lastTestedAt: new Date()
      });

      res.json({ 
        message: `Datasource test completed with status: ${overallStatus}`,
        testStatus: overallStatus,
        testDetails,
        testResults,
        summary: createTestSummary(allResults, primaryTestMethod)
      });
    } catch (testError) {
      await datasource.update({ 
        testStatus: 'failure',
        lastTestedAt: new Date()
      });

      res.status(400).json({ 
        message: 'Datasource test failed',
        testStatus: 'failure',
        error: testError.message,
        testDetails: {
          datasourceType: datasource.definitionId,
          errorDuringSetup: true,
          setupError: testError.message
        }
      });
    }
  } catch (error) {
    logger.error('Error testing datasource:', error);
    res.status(500).json({ message: 'Error testing datasource', error: error.message });
  }
};

export const listAvailableDefinitions = async (req, res) => {
  try {
    const definitions = datasourceCatalog.listDatasourceDefinitions();
    
    const formattedDefinitions = definitions.map(def => ({
      id: def.id,
      name: def.name,
      description: def.description,
      configSchema: def.configSchema,
      availableMethods: def.availableMethods
    }));

    res.json(formattedDefinitions);
  } catch (error) {
    logger.error('Error listing datasource definitions:', error);
    res.status(500).json({ message: 'Error listing datasource definitions', error: error.message });
  }
};

export const fetchFromDatasource = async (req, res) => {
  // Generate trace-like IDs for correlation
  const { traceId, spanId } = generateCorrelationIds();
  
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    const { methodName = 'default', options = {}, propertyMapping = null } = req.body;

    const datasource = await models.Datasource.findByPk(id);
    if (!checkOwnership(datasource, userId)) {
      return res.status(404).json({ message: 'Datasource not found or access denied' });
    }

    // Capture call start time and generate execution ID
    const callStartTime = new Date();
    const executionId = generateExecutionId(datasource.id, callStartTime.getTime());

    // Create datasource instance
    const instanceId = generateInstanceId(datasource.id, Date.now(), 'fetch');
    const instance = datasourceCatalog.createDatasourceInstance(
      datasource.definitionId,
      datasource.config,
      instanceId
    );

    // Validate method exists
    const methodValidation = validateMethodExists(instance, methodName);
    if (!methodValidation.isValid) {
      return res.status(400).json({ 
        message: methodValidation.error,
        availableMethods: methodValidation.availableMethods
      });
    }

    // Determine the actual HTTP method and endpoint based on datasource type and config
    const httpCallDetails = createHttpCallDetails(datasource.definitionId, datasource.config, options);

    logger.debug(`[${executionId}] Starting datasource fetch`, {
      datasourceId: datasource.id,
      methodName,
      datasourceType: datasource.definitionId,
      httpCallDetails,
      userId,
      requestId: req.requestId || 'unknown',
      traceId,
      spanId,
      propertyMappingProvided: !!propertyMapping,
      mappingRules: propertyMapping || null,
      // Telemetry-style metadata
      'databinder.datasource': datasource.definitionId,
      'databinder.datasource.id': datasource.id,
      'databinder.method': methodName
    });

    // Execute the method and capture timing
    const result = await instance.methods[methodName](options);
    const callEndTime = new Date();
    const executionDuration = callEndTime.getTime() - callStartTime.getTime();

    // Extract data from nested structure if it exists
    const extractedResult = extractResultData(result);

    // Apply property mapping if provided
    const finalResult = propertyMapping ? applyPropertyMapping(extractedResult, propertyMapping) : extractedResult;

    logger.debug(`[${executionId}] Datasource fetch completed successfully`, {
      executionDuration: `${executionDuration}ms`,
      resultSize: JSON.stringify(finalResult).length,
      datasourceId: datasource.id,
      traceId,
      spanId,
      propertyMappingApplied: !!propertyMapping,
      dataExtracted: result !== extractedResult,
      originalStructureHadData: result && typeof result === 'object' && result.data !== undefined
    });

    // Create span attributes
    const spanAttributes = createSpanAttributes({
      httpCallDetails,
      datasource,
      methodName
    });

    // Create call info
    const callInfo = createCallInfo({
      executionId,
      executionDuration: `${executionDuration}ms`,
      callStartTime,
      callEndTime,
      httpCallDetails,
      requestId: req.requestId || 'unknown',
      traceId,
      spanId,
      spanAttributes
    });

    // Create telemetry context
    const telemetryContext = createTelemetryContext({
      traceId,
      spanId,
      operationName: `databinder.fetch.${datasource.definitionId}.${methodName}`,
      correlationId: executionId
    });

    // Create log metadata
    const logMetadata = createLogMetadata({
      datasourceId: datasource.id,
      methodName,
      userId,
      operationType: 'fetch',
      success: true
    });

    // Create mapping metadata
    const mappingMetadata = createMappingMetadata(result, finalResult, propertyMapping);

    // Create response metadata
    const metadata = createResponseMetadata({
      datasource,
      instanceId,
      finalResult,
      originalResult: result,
      extractedResult,
      propertyMapping: mappingMetadata,
      logMetadata,
      telemetryContext
    });

    res.json({
      message: 'Data fetched successfully',
      datasourceId: datasource.id,
      datasourceName: datasource.name,
      methodUsed: methodName,
      result: finalResult,
      callInfo,
      metadata
    });

  } catch (error) {
    const callEndTime = new Date();
    logger.error('Error fetching from datasource:', error);
    
    // Log the error with call context if available
    const errorContext = {
      datasourceId: req.params.id,
      methodName: req.body?.methodName || 'default',
      error: error.message,
      requestId: req.requestId || 'unknown',
      traceId,
      spanId
    };

    // Create error span attributes
    const spanAttributes = createSpanAttributes({
      httpCallDetails: null,
      datasource: { definitionId: req.body?.datasourceType || 'unknown' },
      methodName: req.body?.methodName || 'default',
      error: error.message
    });

    // Create error call info
    const callInfo = createCallInfo({
      executionId: `error_${Date.now()}`,
      executionDuration: '0ms',
      callStartTime: callEndTime,
      callEndTime,
      httpCallDetails: null,
      requestId: req.requestId || 'unknown',
      traceId,
      spanId,
      spanAttributes,
      failed: true,
      errorContext
    });

    // Create error telemetry context
    const telemetryContext = createTelemetryContext({
      traceId,
      spanId,
      operationName: 'databinder.fetch.error',
      correlationId: `error_${Date.now()}`
    });

    // Create error log metadata
    const logMetadata = createLogMetadata({
      datasourceId: req.params.id,
      methodName: req.body?.methodName || 'default',
      userId: req.user?.user_id || 'unknown',
      operationType: 'fetch',
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({ 
      message: 'Error fetching from datasource', 
      error: error.message,
      datasourceId: req.params.id,
      callInfo,
      metadata: {
        timestamp: callEndTime.toISOString(),
        logMetadata,
        telemetryContext
      }
    });
  }
};

export const getDatasourceMethods = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const datasource = await models.Datasource.findByPk(id);
    if (!checkOwnership(datasource, userId)) {
      return res.status(404).json({ message: 'Datasource not found or access denied' });
    }

    // Create a temporary instance to get available methods
    const instance = datasourceCatalog.createDatasourceInstance(
      datasource.definitionId,
      datasource.config,
      `methods_${datasource.id}_${Date.now()}`
    );

    // Create methods info using utility
    const methodsInfo = createMethodsInfo(instance, (methodName) => 
      getMethodDescription(
        datasourceCatalog.listDatasourceDefinitions.bind(datasourceCatalog),
        datasource.definitionId,
        methodName
      )
    );

    res.json({
      datasourceId: datasource.id,
      datasourceName: datasource.name,
      definitionId: datasource.definitionId,
      availableMethods: methodsInfo,
      methodCount: Object.keys(methodsInfo).length
    });

  } catch (error) {
    logger.error('Error getting datasource methods:', error);
    res.status(500).json({ 
      message: 'Error getting datasource methods', 
      error: error.message 
    });
  }
};

export { datasourceCatalog };
