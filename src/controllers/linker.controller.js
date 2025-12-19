import { models } from '../models/models.js';
import { getDatabinderCatalog } from '../config/databinder.js';
import logger from '../config/logger.js';
import { 
  generateInstanceId, 
  extractResultData,
  applyPropertyMapping,
  generateCorrelationIds,
  createTelemetryContext,
  normalizeName,
  sanitizeLinker,
  checkLinkerOwnership,
  validateLinkerInput,
  validateLinkerUpdateInput,
  validateDatasourcesExist,
  validateDatasourceConfigs,
  generateLinkerExecutionId,
  mergeDatasourceResults,
  createLinkerExecutionMetadata,
  normalizeDatasourceConfigs,
  createLinkerExecutionSummary,
  cacheLinkerExecution,
  getCachedLinkerExecution,
  invalidateLinkerCache
} from '../utils/databinder/index.js';

// Get the initialized DatasourceCatalog
const datasourceCatalog = getDatabinderCatalog();

/**
 * Internal function to execute linker and fetch data from all datasources
 * This is used both when creating a linker and when executing it via /execute endpoint
 * @param {Object} linker - The linker instance
 * @param {number} userId - The user ID
 * @param {string} executionId - Execution ID for logging
 * @param {string} traceId - Trace ID for telemetry
 * @param {string} spanId - Span ID for telemetry
 * @param {Object} options - Options to pass to datasource methods
 * @returns {Promise<Object>} Execution result with status, data, and metadata
 */
const executeLinkerInternal = async (linker, userId, executionId, traceId, spanId, options = {}) => {
  logger.debug(`[${executionId}] Starting internal linker execution`, {
    linkerId: linker.id,
    linkerName: linker.name,
    datasourceCount: linker.datasourceIds.length,
    userId,
    traceId,
    spanId
  });

  const executionStartTime = Date.now();

  // Fetch all datasources
  const datasources = await models.Datasource.findAll({
    where: {
      id: linker.datasourceIds,
      ownerId: userId
    }
  });

  if (datasources.length !== linker.datasourceIds.length) {
    const foundIds = new Set(datasources.map(ds => ds.id));
    const missingIds = linker.datasourceIds.filter(id => !foundIds.has(id));
    
    throw new Error(`Some datasources are no longer available. Missing: ${missingIds.join(', ')}`);
  }

  // Execute each datasource
  const results = [];
  
  for (const datasource of datasources) {
    try {
      const dsConfig = linker.datasourceConfigs?.[datasource.id];
      
      // Determine method name: runtime options > datasource config > linker default
      let methodName = options?.methodName || dsConfig?.methodConfig?.methodName || linker.defaultMethodName;
      
      // Merge options: runtime options override config options
      const configOptions = dsConfig?.methodConfig?.options || {};
      const methodOptions = { ...configOptions, ...options };
      
      // Remove methodName from options if present (it's not a method parameter)
      delete methodOptions.methodName;
      
      const propertyMapping = dsConfig?.propertyMapping || null;

      // Create datasource instance
      const instanceId = generateInstanceId(datasource.id, Date.now(), 'linker');
      const instance = datasourceCatalog.createDatasourceInstance(
        datasource.definitionId,
        datasource.config,
        instanceId
      );

      // Check if method exists
      if (!instance.methods[methodName]) {
        const availableMethods = instance.listMethods ? instance.listMethods() : Object.keys(instance.methods);
        results.push({
          datasourceId: datasource.id,
          datasourceName: datasource.name,
          success: false,
          error: `Method '${methodName}' not available. Available methods: ${availableMethods.join(', ')}`,
          data: null
        });
        continue;
      }

      // Execute method
      const callStartTime = Date.now();
      const result = await instance.methods[methodName](methodOptions);
      const callEndTime = Date.now();

      // Extract and transform data
      const extractedResult = extractResultData(result);
      const finalResult = propertyMapping ? applyPropertyMapping(extractedResult, propertyMapping) : extractedResult;

      results.push({
        datasourceId: datasource.id,
        datasourceName: datasource.name,
        definitionId: datasource.definitionId,
        methodUsed: methodName,
        success: true,
        error: null,
        data: finalResult,
        executionDuration: `${callEndTime - callStartTime}ms`,
        propertyMappingApplied: !!propertyMapping
      });

    } catch (error) {
      logger.error(`Error executing datasource ${datasource.id} in linker ${linker.id}:`, error);
      results.push({
        datasourceId: datasource.id,
        datasourceName: datasource.name,
        success: false,
        error: error.message,
        data: null
      });
    }
  }

  // Determine overall execution status
  const allSuccessful = results.every(r => r.success);
  const anySuccessful = results.some(r => r.success);
  
  let overallStatus;
  if (allSuccessful) {
    overallStatus = 'success';
  } else if (anySuccessful) {
    overallStatus = 'success';
  } else {
    overallStatus = 'failure';
  }

  const executionEndTime = Date.now();

  // Always use 'indexed' merge strategy for caching
  const mergedData = mergeDatasourceResults(results, 'indexed');

  // Create execution metadata
  const executionMetadata = createLinkerExecutionMetadata({
    linkerId: linker.id,
    datasourceIds: linker.datasourceIds,
    executionId,
    startTime: executionStartTime,
    endTime: executionEndTime,
    results
  });

  // Create execution summary
  const executionSummary = createLinkerExecutionSummary(results);

  logger.debug(`[${executionId}] Internal linker execution completed`, {
    executionStatus: overallStatus,
    executionDuration: `${executionEndTime - executionStartTime}ms`,
    successfulDatasources: executionSummary.successful,
    failedDatasources: executionSummary.failed,
    traceId,
    spanId
  });

  return {
    overallStatus,
    mergedData,
    executionMetadata,
    executionSummary,
    detailedResults: results,
    executionStartTime,
    executionEndTime
  };
};

export const listLinkers = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const linkers = await models.Linker.findAll({
      where: { ownerId: userId },
    });

    const sanitized = linkers.map((linker) => sanitizeLinker(linker));
    res.json(sanitized);
  } catch (error) {
    logger.error('Error listing linkers:', error);
    res.status(500).json({ message: 'Error listing linkers', error: error.message });
  }
};

export const getLinker = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const linker = await models.Linker.findByPk(id);

    if (!checkLinkerOwnership(linker, userId)) {
      return res.status(404).json({ message: 'Linker not found or access denied' });
    }

    res.json(sanitizeLinker(linker, true));
  } catch (error) {
    logger.error('Error fetching linker:', error);
    res.status(500).json({ message: 'Error fetching linker', error: error.message });
  }
};

export const createLinker = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, defaultMethodName, datasourceIds, datasourceConfigs, description, environment } = req.body;

    // Validate input
    const validation = validateLinkerInput({ datasourceIds, defaultMethodName, datasourceConfigs });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Validate that all datasource IDs exist and belong to the user
    const dsValidation = await validateDatasourcesExist(datasourceIds, models.Datasource, userId);
    if (!dsValidation.isValid) {
      return res.status(400).json({ error: dsValidation.errors.join(', ') });
    }

    // Validate datasource configs structure (now mandatory)
    const configValidation = validateDatasourceConfigs(datasourceConfigs, datasourceIds);
    if (!configValidation.isValid) {
      return res.status(400).json({ error: configValidation.errors.join(', ') });
    }

    // Normalize and check for existing linker with same name
    const normalizedName = name ? normalizeName(name) : null;
    if (normalizedName) {
      const existing = await models.Linker.findOne({
        where: { name: normalizedName, ownerId: userId }
      });
      if (existing) {
        return res.status(409).json({ message: 'A linker with this name already exists.' });
      }
    }

    // Normalize datasource configs
    const normalizedConfigs = normalizeDatasourceConfigs(datasourceConfigs, datasourceIds);

    // Create linker
    const linkerData = {
      name: normalizedName,
      defaultMethodName: defaultMethodName || 'default',
      datasourceIds,
      datasourceConfigs: normalizedConfigs, // Always required, never null
      description: description || null,
      environment: environment || 'production',
      isActive: true,
      createdBy: req.user.username,
      version: 1,
      ownerId: userId,
    };

    const newLinker = await models.Linker.create(linkerData);

    // Execute linker immediately after creation and cache the results
    try {
      const { traceId, spanId } = generateCorrelationIds();
      const executionId = generateLinkerExecutionId(newLinker.id, Date.now());
      
      logger.info(`Executing linker immediately after creation: ${newLinker.id}`);
      
      const executionResult = await executeLinkerInternal(
        newLinker,
        userId,
        executionId,
        traceId,
        spanId,
        {}
      );

      // Update linker execution status
      await newLinker.update({
        executionStatus: executionResult.overallStatus,
        lastExecutedAt: new Date()
      });

      // Cache the execution result with 2 weeks expiration
      await cacheLinkerExecution(newLinker.id, executionResult.mergedData, {
        executionId,
        executionStatus: executionResult.overallStatus,
        executionSummary: executionResult.executionSummary,
        traceId,
        spanId
      });

      logger.info(`Linker ${newLinker.id} executed and cached successfully`, {
        linkerId: newLinker.id,
        executionStatus: executionResult.overallStatus
      });

    } catch (execError) {
      // Log error but don't fail the creation
      logger.error(`Error executing linker after creation: ${newLinker.id}`, execError);
      await newLinker.update({
        executionStatus: 'failure',
        lastExecutedAt: new Date()
      });
    }

    const response = sanitizeLinker(newLinker, true);
    res.status(201).json({ 
      message: 'Linker created successfully',
      datasourceCount: datasourceIds.length,
      ...response 
    });
  } catch (error) {
    logger.error('Error creating linker:', error);
    res.status(500).json({ message: 'Error creating linker', error: error.message });
  }
};

/**
 * Validate and prepare name update
 * @param {string} name - New name
 * @param {Object} linker - Current linker
 * @param {number} userId - User ID
 * @param {string} linkerId - Linker ID
 * @returns {Promise<Object>} Result with normalized name or error
 */
const validateNameUpdate = async (name, linker, userId, linkerId) => {
  const normalizedName = normalizeName(name);
  
  if (normalizedName === linker.name) {
    return { normalizedName, isValid: true };
  }

  const existing = await models.Linker.findOne({
    where: { name: normalizedName, ownerId: userId }
  });

  if (existing && existing.id !== linkerId) {
    return {
      isValid: false,
      error: { status: 409, message: 'A linker with this name already exists.' }
    };
  }

  return { normalizedName, isValid: true };
};

/**
 * Process datasource IDs update
 * @param {Array<string>} datasourceIds - New datasource IDs
 * @param {Object} linker - Current linker
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Update data and cache invalidation flag
 */
const processDatasourceIdsUpdate = async (datasourceIds, linker, userId) => {
  const dsValidation = await validateDatasourcesExist(datasourceIds, models.Datasource, userId);
  
  if (!dsValidation.isValid) {
    return {
      isValid: false,
      error: { status: 400, message: dsValidation.errors.join(', ') }
    };
  }

  return {
    isValid: true,
    updateData: {
      datasourceIds,
      version: linker.version + 1,
      executionStatus: 'not_executed'
    },
    shouldInvalidateCache: true
  };
};

/**
 * Process datasource configs update
 * @param {Object} datasourceConfigs - New datasource configs
 * @param {Array<string>} targetDatasourceIds - Target datasource IDs
 * @param {Object} linker - Current linker
 * @param {Object} currentUpdateData - Current update data
 * @returns {Object} Update data and cache invalidation flag
 */
const processDatasourceConfigsUpdate = (datasourceConfigs, targetDatasourceIds, linker, currentUpdateData) => {
  const configValidation = validateDatasourceConfigs(datasourceConfigs, targetDatasourceIds);
  
  if (!configValidation.isValid) {
    return {
      isValid: false,
      error: { status: 400, message: configValidation.errors.join(', ') }
    };
  }

  const updateData = {
    datasourceConfigs: normalizeDatasourceConfigs(datasourceConfigs, targetDatasourceIds)
  };

  if (currentUpdateData.version === undefined) {
    updateData.version = linker.version + 1;
  }

  return {
    isValid: true,
    updateData,
    shouldInvalidateCache: true
  };
};

/**
 * Build update data from request body
 * @param {Object} body - Request body
 * @param {Object} linker - Current linker
 * @param {number} userId - User ID
 * @param {string} linkerId - Linker ID
 * @returns {Promise<Object>} Update data and flags
 */
const buildUpdateData = async (body, linker, userId, linkerId) => {
  const { name, defaultMethodName, datasourceIds, datasourceConfigs, description, environment, isActive } = body;
  const updateData = {};
  let shouldInvalidateCache = false;

  // Handle name update
  if (name !== undefined) {
    const nameResult = await validateNameUpdate(name, linker, userId, linkerId);
    if (!nameResult.isValid) {
      return nameResult;
    }
    updateData.name = nameResult.normalizedName;
  }

  // Handle defaultMethodName update
  if (defaultMethodName !== undefined) {
    updateData.defaultMethodName = defaultMethodName;
  }

  // Handle datasourceIds update
  if (datasourceIds !== undefined) {
    const dsResult = await processDatasourceIdsUpdate(datasourceIds, linker, userId);
    if (!dsResult.isValid) {
      return dsResult;
    }
    Object.assign(updateData, dsResult.updateData);
    shouldInvalidateCache = dsResult.shouldInvalidateCache;
  }

  // Handle datasourceConfigs update
  if (datasourceConfigs !== undefined) {
    const targetDatasourceIds = datasourceIds || linker.datasourceIds;    
    // datasourceConfigs cannot be null or undefined
    if (datasourceConfigs === null) {
      return {
        isValid: false,
        error: 'datasourceConfigs is required and cannot be null'
      };
    }
    const configResult = processDatasourceConfigsUpdate(datasourceConfigs, targetDatasourceIds, linker, updateData);
    if (!configResult.isValid) {
      return configResult;
    }
    Object.assign(updateData, configResult.updateData);
    shouldInvalidateCache = shouldInvalidateCache || configResult.shouldInvalidateCache;
  }

  // Handle simple fields
  if (description !== undefined) {
    updateData.description = description;
  }

  if (environment !== undefined) {
    updateData.environment = environment;
  }

  if (isActive !== undefined) {
    updateData.isActive = Boolean(isActive);
  }

  return {
    isValid: true,
    updateData,
    shouldInvalidateCache
  };
};

export const updateLinker = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const linker = await models.Linker.findByPk(id);
    if (!checkLinkerOwnership(linker, userId)) {
      return res.status(404).json({ message: 'Linker not found or access denied' });
    }

    // Validate input
    const validation = validateLinkerUpdateInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.join(', ') });
    }

    // Build update data
    const result = await buildUpdateData(req.body, linker, userId, id);
    if (!result.isValid) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    if (Object.keys(result.updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    result.updateData.updatedAt = new Date();

    await linker.update(result.updateData);

    // Invalidate cache if needed
    if (result.shouldInvalidateCache) {
      await invalidateLinkerCache(linker.id);
      logger.info(`Invalidated cache for linker ${linker.id} due to configuration changes`);
    }

    res.json({ 
      message: 'Linker updated successfully', 
      ...sanitizeLinker(linker, true) 
    });
  } catch (error) {
    logger.error('Error updating linker:', error);
    res.status(500).json({ message: 'Error updating linker', error: error.message });
  }
};

export const deleteLinker = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const linker = await models.Linker.findByPk(id);
    if (!checkLinkerOwnership(linker, userId)) {
      return res.status(404).json({ message: 'Linker not found or access denied' });
    }

    // Invalidate cache before deleting
    await invalidateLinkerCache(linker.id);
    logger.info(`Invalidated cache for linker ${linker.id} before deletion`);

    await linker.destroy();
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting linker:', error);
    res.status(500).json({ message: 'Error deleting linker', error: error.message });
  }
};

export const executeLinker = async (req, res) => {
  // Generate trace-like IDs for correlation
  const { traceId, spanId } = generateCorrelationIds();
  
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    const { options = {}, mergeStrategy = 'indexed' } = req.body;

    const linker = await models.Linker.findByPk(id);
    if (!checkLinkerOwnership(linker, userId)) {
      return res.status(404).json({ message: 'Linker not found or access denied' });
    }

    // Capture execution start time
    const executionStartTime = Date.now();
    const executionId = generateLinkerExecutionId(linker.id, executionStartTime);

    logger.debug(`[${executionId}] Starting linker execution`, {
      linkerId: linker.id,
      linkerName: linker.name,
      datasourceCount: linker.datasourceIds.length,
      userId,
      requestId: req.requestId || 'unknown',
      traceId,
      spanId,
      mergeStrategy
    });

    // Check cache first
    const cachedResult = await getCachedLinkerExecution(linker.id);
    
    // If cache is valid (exists and not stale - less than 1 hour old), use it
    if (cachedResult.data && !cachedResult.isStale) {
      logger.info(`Using cached data for linker ${linker.id}`, {
        linkerId: linker.id,
        cacheAge: cachedResult.cacheAge,
        cacheAgeMinutes: Math.floor(cachedResult.cacheAge / 60000)
      });

      // Always use indexed merge strategy for cached data
      const cachedMergedData = cachedResult.data;

      // Create telemetry context
      const telemetryContext = createTelemetryContext({
        traceId,
        spanId,
        operationName: `linker.execute.cached.${linker.id}`,
        correlationId: executionId
      });

      return res.json({
        message: 'Linker executed from cache',
        linkerId: linker.id,
        linkerName: linker.name,
        executionStatus: 'success',
        mergeStrategy: 'indexed',
        mergedData: cachedMergedData,
        fromCache: true,
        cacheAge: cachedResult.cacheAge,
        cacheAgeMinutes: Math.floor(cachedResult.cacheAge / 60000),
        cachedMetadata: cachedResult.metadata,
        telemetryContext
      });
    }

    // If cache is stale or doesn't exist, delete old cache and execute fresh
    if (cachedResult.data && cachedResult.isStale) {
      logger.info(`Cache is stale for linker ${linker.id}, invalidating and re-executing`, {
        linkerId: linker.id,
        cacheAge: cachedResult.cacheAge,
        cacheAgeMinutes: Math.floor(cachedResult.cacheAge / 60000)
      });
      await invalidateLinkerCache(linker.id);
    }

    // Update execution status to pending
    await linker.update({ 
      executionStatus: 'pending',
      lastExecutedAt: new Date()
    });

    // Execute linker using internal function
    const executionResult = await executeLinkerInternal(
      linker,
      userId,
      executionId,
      traceId,
      spanId,
      options
    );

    // Update linker execution status
    await linker.update({ 
      executionStatus: executionResult.overallStatus,
      lastExecutedAt: new Date()
    });

    // Cache the execution result with 2 weeks expiration (always using indexed strategy)
    await cacheLinkerExecution(linker.id, executionResult.mergedData, {
      executionId,
      executionStatus: executionResult.overallStatus,
      executionSummary: executionResult.executionSummary,
      traceId,
      spanId
    });

    logger.info(`Linker ${linker.id} executed and cached successfully`, {
      linkerId: linker.id,
      executionStatus: executionResult.overallStatus
    });

    // User requested merge strategy may differ from cached (indexed) strategy
    // Apply the user's requested merge strategy to the detailed results
    const userMergedData = mergeStrategy === 'indexed' 
      ? executionResult.mergedData 
      : mergeDatasourceResults(executionResult.detailedResults, mergeStrategy);

    // Create telemetry context
    const telemetryContext = createTelemetryContext({
      traceId,
      spanId,
      operationName: `linker.execute.${linker.id}`,
      correlationId: executionId
    });

    res.json({
      message: `Linker executed with status: ${executionResult.overallStatus}`,
      linkerId: linker.id,
      linkerName: linker.name,
      executionStatus: executionResult.overallStatus,
      mergeStrategy,
      mergedData: userMergedData,
      fromCache: false,
      executionMetadata: executionResult.executionMetadata,
      executionSummary: executionResult.executionSummary,
      detailedResults: executionResult.detailedResults,
      telemetryContext
    });

  } catch (error) {
    logger.error('Error executing linker:', error);
    
    // Update linker status to failure
    try {
      const linker = await models.Linker.findByPk(req.params.id);
      if (linker) {
        await linker.update({ executionStatus: 'failure' });
      }
    } catch (updateError) {
      logger.error('Error updating linker status after failure:', updateError);
    }

    // Create error telemetry context
    const telemetryContext = createTelemetryContext({
      traceId,
      spanId,
      operationName: 'linker.execute.error',
      correlationId: `error_${Date.now()}`
    });

    res.status(500).json({ 
      message: 'Error executing linker', 
      error: error.message,
      linkerId: req.params.id,
      telemetryContext
    });
  }
};

export const getLinkerDatasources = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const linker = await models.Linker.findByPk(id);
    if (!checkLinkerOwnership(linker, userId)) {
      return res.status(404).json({ message: 'Linker not found or access denied' });
    }

    // Fetch all datasources
    const datasources = await models.Datasource.findAll({
      where: {
        id: linker.datasourceIds,
        ownerId: userId
      }
    });

    // Map datasources with their configs from the linker
    const datasourcesWithConfigs = datasources.map(ds => {
      const config = linker.datasourceConfigs?.[ds.id];
      return {
        id: ds.id,
        name: ds.name,
        definitionId: ds.definitionId,
        description: ds.description,
        environment: ds.environment,
        isActive: ds.isActive,
        testStatus: ds.testStatus,
        linkerConfig: config || null
      };
    });

    res.json({
      linkerId: linker.id,
      linkerName: linker.name,
      datasourceCount: datasources.length,
      datasources: datasourcesWithConfigs
    });

  } catch (error) {
    logger.error('Error getting linker datasources:', error);
    res.status(500).json({ 
      message: 'Error getting linker datasources', 
      error: error.message 
    });
  }
};

export { datasourceCatalog };
