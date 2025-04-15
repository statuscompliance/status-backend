/**
 * Genera una consulta SQL dinámica basada en los parámetros proporcionados.
 *
 * @param {Object} sql - Objeto con los parámetros para construir la consulta.
 * @param {Array<{func: string, attr: string}>} [sql.aggregations=[]] - Lista de agregaciones, cada una con su función (COUNT, AVG, etc.) y el atributo correspondiente.
 * @param {Array<string>} [sql.columns=[]] - Lista de columnas a seleccionar en la consulta.
 * @param {Array<{key: string, operator: string, value: any}>} [sql.whereConditions=[]] - Lista de condiciones para la cláusula WHERE, cada una con una clave, un operador y un valor.
 * @param {string} [sql.whereLogic='AND'] - Operador lógico que une las condiciones WHERE ('AND' o 'OR').
 * @param {string} [sql.groupBy] - Columna por la que se agruparán los resultados.
 * @param {string} [sql.orderByAttr] - Columna por la que se ordenarán los resultados.
 * @param {string} [sql.orderDirection='ASC'] - Dirección de orden (ASC o DESC).
 * @param {string} [sql.table='computation'] - Nombre de la tabla, por defecto 'computation'.
 *
 * @returns {string} - La consulta SQL generada.
 */
function createSQLQuery({
  aggregations = [],
  columns = [],
  whereConditions = [],
  whereLogic = 'AND',
  groupBy,
  orderByAttr,
  orderDirection,
  table = 'computation',
}) {
  let query = 'SELECT ';

  // Aggregations
  if (aggregations.length > 0) {
    query += aggregations
      .map(agg => `${sanitizeIdentifier(agg.func)}(${sanitizeIdentifier(agg.attr)})`) // Sanitize aggregations
      .join(', ');
  }

  // Columns
  if (columns.length > 0) {
    if (aggregations.length > 0) query += ', ';
    query += columns.map(col => sanitizeIdentifier(col)).join(', '); // Sanitize columns
  }

  if (aggregations.length === 0 && columns.length === 0) {
    query += '*';
  }

  query += ` FROM statusdb.${sanitizeIdentifier(table)}`; // Sanitize table name

  // WHERE
  if (whereConditions.length > 0) {
    const whereClause = whereConditions
      .map(cond => {
        const value = sanitizeValue(cond.value); // Sanitize values
        const operator = sanitizeOperator(cond.operator); // Sanitize operator
        return `${sanitizeIdentifier(cond.key)} ${operator} ${value}`; // Sanitize key
      })
      .join(` ${whereLogic} `);
    query += ` WHERE (${whereClause})`;
  }

  // GROUP BY
  if (groupBy) {
    query += ` GROUP BY ${sanitizeIdentifier(groupBy)}`; // Sanitize groupBy
  }

  // ORDER BY
  if (orderByAttr) {
    const direction =
      orderDirection && orderDirection.toUpperCase() === 'DESC'
        ? 'DESC'
        : 'ASC';
    query += ` ORDER BY ${sanitizeIdentifier(orderByAttr)} ${direction}`; // Sanitize orderByAttr
  }

  return query;
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
    const fromClause = extractFromClause(query);
    if (fromClause) {
      result.table = parseTable(fromClause);
    }

    const selectClause = extractSelectClause(query);
    if (selectClause) {
      parseSelect(selectClause, result);
    }

    const whereClause = extractWhereClause(query);
    if (whereClause) {
      parseWhere(whereClause, result);
    }

    const groupByClause = extractGroupByClause(query);
    if (groupByClause) {
      result.groupBy = parseGroupBy(groupByClause);
    }

    const orderByClause = extractOrderByClause(query);
    if (orderByClause) {
      parseOrderBy(orderByClause, result);
    }
  } catch (error) {
    console.error('Error al analizar la consulta SQL:', error);
    // Considerar lanzar el error o devolver un objeto/valor por defecto
    return result; // Devolver el resultado parcialmente analizado
  }

  return result;
}

function extractFromClause(query) {
  const match = query.match(/FROM\s+statusdb\.\w+/i);
  return match ? match[0] : null;
}

function extractSelectClause(query) {
  const match = query.match(/SELECT\s+[\s\w\d_(),.*]+?\s+FROM/i);
  return match ? match[0] : null;
}

function extractWhereClause(query) {
  const match = query.match(/WHERE\s+\([^)]+\)/i);
  return match ? match[0] : null;
}


function extractGroupByClause(query) {
  const match = query.match(/GROUP\s+BY\s+[\w\d_]+/i);
  return match ? match[0] : null;
}

function extractOrderByClause(query) {
  const match = query.match(/ORDER\s+BY\s+[\w\d_]+(?:\s+ASC|\s+DESC)?/i);
  return match ? match[0] : null;
}


function parseTable(fromClause) {
  const tableMatch = fromClause.match(/statusdb\.(\w+)/i);
  return tableMatch ? tableMatch[1] : 'computation';
}

function parseSelect(selectClause, result) {
  const selectFieldsString = selectClause.replace(/SELECT\s+/i, '').replace(/\s+FROM/i, '').split(',').map(s => s.trim());

  selectFieldsString.forEach(field => {
    const aggMatch = field.match(/^(\w+)\(([\w\d_.*]+)\)$/);
    if (aggMatch) {
      result.aggregations.push({
        func: aggMatch[1].toUpperCase(),
        attr: aggMatch[2],
      });
    } else if (field !== '*') {
      result.columns.push(field);
    }
  });
}


function parseWhere(whereClause, result) {
  const conditionsString = whereClause.replace(/WHERE\s+\(/i, '').replace(/\)/i, '');
  const atomicConditionRegex = /([\w\d_]+)\s+(=|>|<|>=|<=|!=|LIKE)\s+('[^']*'|\d+|true|false|[^\s()]+)/gi;
  let match;
  let previousLogic = 'AND';
  let firstCondition = true;

  while ((match = atomicConditionRegex.exec(conditionsString)) !== null) {
    const key = match[1];
    const operator = match[2];
    const value = parseWhereValue(match[3]);

    if (!firstCondition) {
      result.whereLogic = previousLogic;
    }
    result.whereConditions.push({ key, operator, value });
    firstCondition = false;

    const andOrRegex = /\s(AND|OR)\s/gi;
    andOrRegex.lastIndex = atomicConditionRegex.lastIndex;
    const logicMatch = andOrRegex.exec(conditionsString);
    if (logicMatch) {
      previousLogic = logicMatch[1].toUpperCase();
      atomicConditionRegex.lastIndex = andOrRegex.lastIndex;
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
  const quotedMatch = value.match(/^'([^']*)'$/);
  return quotedMatch ? quotedMatch[1] : value;
}


function parseGroupBy(groupByClause) {
  const groupByMatch = groupByClause.match(/GROUP\s+BY\s+([\w\d_]+)/i);
  return groupByMatch ? groupByMatch[1] : null;
}

function parseOrderBy(orderByClause, result) {
  const orderByMatch = orderByClause.match(/ORDER\s+BY\s+([\w\d_]+)\s*(?:(ASC|DESC))?/i);
  if (orderByMatch) {
    result.orderByAttr = orderByMatch[1];
    result.orderDirection = orderByMatch[2]?.toUpperCase() || 'ASC';
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
