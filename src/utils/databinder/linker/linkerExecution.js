/**
 * Linker execution utilities for merging results and creating metadata
 */

/**
 * Merge datasource results from multiple datasources
 * @param {Array<Object>} results - Array of results from different datasources
 * @param {string} mergeStrategy - Strategy to use for merging (concat, merge, override, indexed)
 * @returns {Object|Array} Merged results
 */
export const mergeDatasourceResults = (results, mergeStrategy = 'concat') => {
  if (!results || results.length === 0) {
    return null;
  }

  if (results.length === 1) {
    return results[0].data;
  }

  switch (mergeStrategy) {
    case 'concat':
    // Concatenate arrays
      return results.reduce((acc, result) => {
        if (Array.isArray(result.data)) {
          return acc.concat(result.data);
        }
        return acc;
      }, []);

    case 'merge':
    // Merge objects
      return results.reduce((acc, result) => {
        if (typeof result.data === 'object' && !Array.isArray(result.data)) {
          return { ...acc, ...result.data };
        }
        return acc;
      }, {});

    case 'override':
    // Last result wins
      return results[results.length - 1].data;

    case 'indexed':
    // Return as an object indexed by datasource name (or ID as fallback)
      return results.reduce((acc, result) => {
        const key = result.datasourceName || result.datasourceId;
        acc[key] = result.data;
        return acc;
      }, {});

    default:
      return results.map(r => r.data);
  }
};

/**
 * Create execution metadata for linker operations
 * @param {Object} params - Parameters for metadata
 * @returns {Object} Execution metadata
 */
export const createLinkerExecutionMetadata = ({ linkerId, datasourceIds, executionId, startTime, endTime, results }) => {
  return {
    linkerId,
    executionId,
    datasourceCount: datasourceIds.length,
    datasourceIds,
    executionDuration: endTime - startTime,
    executionDurationMs: `${endTime - startTime}ms`,
    timestamp: new Date(startTime).toISOString(),
    resultCount: results.length,
    successfulDatasources: results.filter(r => r.success).length,
    failedDatasources: results.filter(r => !r.success).length
  };
};

/**
 * Create a summary of linker execution results
 * @param {Array<Object>} results - Array of execution results
 * @returns {Object} Execution summary
 */
export const createLinkerExecutionSummary = (results) => {
  const summary = {
    totalDatasources: results.length,
    successful: 0,
    failed: 0,
    datasourceResults: []
  };

  for (const result of results) {
    if (result.success) {
      summary.successful++;
    } else {
      summary.failed++;
    }

    summary.datasourceResults.push({
      datasourceId: result.datasourceId,
      datasourceName: result.datasourceName,
      success: result.success,
      error: result.error || null,
      dataSize: result.data ? JSON.stringify(result.data).length : 0
    });
  }

  return summary;
};
