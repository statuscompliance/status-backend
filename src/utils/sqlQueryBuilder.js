/**
 * Genera una consulta SQL dinámica basada en los parámetros proporcionados.
 *
 * @param {Object} params - Objeto con los parámetros para construir la consulta.
 * @param {Object} [params.select] - Objeto que define la parte SELECT de la consulta.
 * @param {Array<{func: string, attr: string}>} [params.select.aggregations=[]] - Lista de agregaciones, cada una con su función (COUNT, AVG, etc.) y el atributo correspondiente.
 * @param {Array<string>} [params.select.columns=[]] - Lista de columnas a seleccionar en la consulta.
 * @param {Object} [params.from] - Objeto que define la parte FROM de la consulta.
 * @param {string} [params.from.table='computation'] - Nombre de la tabla.
 * @param {Object} [params.where] - Objeto que define la parte WHERE de la consulta.
 * @param {Array<{key: string, operator: string, value: any}>} [params.where.conditions=[]] - Lista de condiciones para la cláusula WHERE.
 * @param {string} [params.where.logic='AND'] - Operador lógico que une las condiciones WHERE ('AND' o 'OR').
 * @param {string} [params.groupBy] - Columna por la que se agruparán los resultados.
 * @param {Object} [params.orderBy] - Objeto que define la parte ORDER BY de la consulta.
 * @param {string} [params.orderBy.attr] - Columna por la que se ordenarán los resultados.
 * @param {string} [params.orderBy.direction='ASC'] - Dirección de orden (ASC o DESC).
 *
 * @returns {string} - La consulta SQL generada.
 */

function createSQLQuery(params = {}) {
  const {
    select = { aggregations: [], columns: [] },
    from = { table: 'computation' },
    where = { conditions: [], logic: 'AND' },
    groupBy,
    orderBy = {}
  } = params;

  const selectClause = buildSelectClause(select.aggregations, select.columns);
  const fromClause = buildFromClause(from.table);
  const whereClause = buildWhereClause(where.conditions, where.logic);
  const groupByClause = buildGroupByClause(groupBy);
  const orderByClause = buildOrderByClause(orderBy.attr, orderBy.direction);

  return [
    selectClause,
    fromClause,
    whereClause,
    groupByClause,
    orderByClause
  ].filter(clause => clause !== '').join(' ');
}

/**
 * Construye la cláusula SELECT de la consulta.
 *
 * @param {Array<{func: string, attr: string}>} aggregations - Lista de agregaciones.
 * @param {Array<string>} columns - Lista de columnas.
 *
 * @returns {string} - La cláusula SELECT.
 */

function buildSelectClause(aggregations, columns) {
  let selectClause = 'SELECT ';
  if (aggregations.length === 0 && columns.length === 0) {
    selectClause += '*';
  } else {
    const selectParts = [];
    aggregations.forEach(agg => {
      const attr = agg.func.toUpperCase() === 'COUNT' && agg.attr === '*' ? '*' : sanitizeIdentifier(agg.attr);
      selectParts.push(`${sanitizeIdentifier(agg.func)}(${attr})`);
    });
    columns.forEach(col => {
      selectParts.push(sanitizeIdentifier(col));
    });
    selectClause += selectParts.join(', ');
  }
  return selectClause;
}

/**
 * Construye la cláusula FROM de la consulta.
 *
 * @param {string} table - Nombre de la tabla.
 *
 * @returns {string} - La cláusula FROM.
 */
function buildFromClause(table) {
  return `FROM statusdb.${sanitizeIdentifier(table)}`;
}

/**
 * Construye la cláusula WHERE de la consulta.
 *
 * @param {Array<{key: string, operator: string, value: any}>} conditions - Lista de condiciones.
 * @param {string} logic - Operador lógico ('AND' o 'OR').
 *
 * @returns {string} - La cláusula WHERE.
 */
function buildWhereClause(conditions, logic) {
  if (conditions.length === 0) {
    return '';
  }
  const whereClauses = conditions.map(condition => {
    const value = sanitizeValue(condition.value);
    const operator = sanitizeOperator(condition.operator);
    const key = sanitizeIdentifier(condition.key);
    return `${key} ${operator} ${value}`;
  });
  return `WHERE (${whereClauses.join(` ${logic} `)})`;
}

/**
 * Construye la cláusula GROUP BY de la consulta.
 *
 * @param {string} groupBy - Columna para agrupar.
 *
 * @returns {string} - La cláusula GROUP BY.
 */
function buildGroupByClause(groupBy) {
  if (!groupBy) {
    return '';
  }
  return `GROUP BY ${sanitizeIdentifier(groupBy)}`;
}

/**
 * Construye la cláusula ORDER BY de la consulta.
 *
 * @param {string} attr - Columna para ordenar.
 * @param {string} direction - Dirección de orden ('ASC' o 'DESC').
 *
 * @returns {string} - La cláusula ORDER BY.
 */
function buildOrderByClause(attr, direction = 'ASC') {
  if (!attr) {
    return '';
  }
  const orderDirection = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return `ORDER BY ${sanitizeIdentifier(attr)} ${orderDirection}`;
}

function parseSQLQuery(query) {
  const result = {
    aggregations: [],
    columns: [],
    whereConditions: [],
    whereLogic: 'AND',
    groupBy: null,
    orderByAttr: null,
    orderDirection: null,
    table: 'computation',
  };

  try {
    // Table
    result.table = parseTable(query);

    // Columns and Aggregations
    const selectClause = extractSelectClause(query);
    if (selectClause) {
      parseSelectClause(selectClause, result);
    }

    // WHERE
    const whereClause = extractWhereClause(query);
    if (whereClause) {
      parseWhereClause(whereClause, result);
    }

    // GROUP BY
    result.groupBy = parseGroupBy(query);

    // ORDER BY
    parseOrderBy(query, result);
  } catch (error) {
    console.error('Error parsing SQL query:', error);
    return result;
  }

  return result;
}

function extractSelectClause(query) {
  const fromIndex = query.toUpperCase().indexOf(' FROM ');
  if (fromIndex > -1) {
    const selectStart = query.toUpperCase().indexOf('SELECT ') + 7;
    return query.substring(selectStart, fromIndex).trim();
  }
  return null;
}


function parseTable(query) {
  const tableMatch = query.match(/FROM\s+statusdb\.(\w+)/i);
  return tableMatch ? tableMatch[1] : 'computation';
}

function parseSelectClause(selectClause, result) {
  if (!selectClause) return;

  const fields = selectClause.split(',').map(s => s.trim());
  fields.forEach(field => {
    const aggregation = parseAggregation(field);
    if (aggregation) {
      result.aggregations.push(aggregation);
    } else {
      result.columns.push(field);
    }
  });
}

function parseAggregation(field) {
  const funcMatch = field.match(/^(\w+)\((.+)\)$/);
  if (!funcMatch) {
    return null;
  }

  const func = funcMatch[1].toUpperCase();
  const attr = funcMatch[2].trim();

  if (!isValidAggregationFunction(func)) {
    throw new Error(`Invalid aggregation function: ${func}`);
  }

  return { func, attr: attr };
}

function isValidAggregationFunction(func) {
  const validFunctions = ['COUNT', 'AVG', 'SUM', 'MIN', 'MAX'];
  return validFunctions.includes(func);
}


function extractWhereClause(query) {
  const whereMatch = query.match(/WHERE\s+\((.+)\)/i);
  return whereMatch ? whereMatch[1] : null;
}

function parseWhereClause(whereClause, result) {
  const conditions = whereClause.split(/\s+(AND|OR)\s+/i);
  let previousLogic = 'AND';

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i].trim();
    if (condition.toUpperCase() === 'AND' || condition.toUpperCase() === 'OR') {
      previousLogic = condition.toUpperCase();
      if (i > 0) {
        result.whereLogic = previousLogic;
      }
    } else {
      const match = condition.match(/([\w\d_]+)\s+(=|>|<|>=|<=|!=|LIKE)\s+('[^']*'|\d+|true|false|[^\s()]+)/i);
      if (match) {
        const key = match[1].trim();
        const operator = match[2].trim();
        const value = parseWhereValue(match[3].trim());
        result.whereConditions.push({ key, operator, value });
      }
    }
  }
}


function parseWhereValue(value) {
  if (value.toLowerCase() === 'true') {
    return true;
  }
  if (value.toLowerCase() === 'false') {
    return false;
  }
  if (!isNaN(value)) {
    return Number(value);
  }
  return value.replace(/['"]/g, '');
}

function parseGroupBy(query) {
  const groupByMatch = query.match(/GROUP\s+BY\s+(\w+)/i);
  if (groupByMatch) {
    return groupByMatch[1];
  }
  return null;
}

function parseOrderBy(query, result) {
  const orderByMatch = query.match(/ORDER\s+BY\s+(\w+)\s+(ASC|DESC)?/i);
  if (orderByMatch) {
    result.orderByAttr = orderByMatch[1];
    result.orderDirection = orderByMatch[2] ? orderByMatch[2].toUpperCase() : 'ASC';
  }
}

// Helper functions for sanitization
function sanitizeIdentifier(identifier) {
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

function sanitizeValue(value) {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return String(value).replace(/['"]/g, '');
}

function sanitizeOperator(operator) {
  const validOperators = ['=', '>', '<', '>=', '<=', '!=', 'LIKE'];
  return validOperators.includes(operator.toUpperCase()) ? operator : '=';
}

export { createSQLQuery, parseSQLQuery };
