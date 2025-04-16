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

  // Table
  const tableMatch = query.match(/FROM\s+statusdb\.(\w+)/i);
  if (tableMatch) {
    result.table = tableMatch[1];
  }

  // Columns and Aggregations
  const selectMatch = query.match(/SELECT\s+([\s\w\d_(),.*]+)\s+FROM/i);
  if (selectMatch) {
    const selectFields = selectMatch[1].split(',');
    selectFields.forEach((field) => {
      field = field.trim();
      const aggMatch = field.match(/(\w+)\(([^)]+)\)/);
      if (aggMatch) {
        result.aggregations.push({
          func: aggMatch[1],
          attr: aggMatch[2],
        });
      } else if (field !== '*') {
        result.columns.push(field);
      }
    });
  }

  // WHERE
  const whereMatch = query.match(/WHERE\s+\((.+?)\)/i);
  if (whereMatch) {
    const conditionsString = whereMatch[1];
    const conditionParts = conditionsString.split(/\s+(AND|OR)\s+/i);
    if (conditionParts.length === 1) {
      const [key, operator, ...valueParts] = conditionParts[0].split(/\s+(=|>|<|>=|<=|!=|LIKE)\s+/i); // Añadido LIKE
      if (key && operator && valueParts.length > 0) {
        result.whereConditions.push({
          key: key.trim(),
          operator: operator.trim(),
          value: parseWhereValue(valueParts.join(' ').trim()),
        });
      }
    } else {
      result.whereLogic = conditionParts[1]?.toUpperCase() || 'AND';
      for (let i = 0; i < conditionParts.length; i += 2) {
        const condition = conditionParts[i];
        const [key, operator, ...valueParts] = condition.split(/\s+(=|>|<|>=|<=|!=|LIKE)\s+/i); // Añadido LIKE
        if (key && operator && valueParts.length > 0) {
          result.whereConditions.push({
            key: key.trim(),
            operator: operator.trim(),
            value: parseWhereValue(valueParts.join(' ').trim()),
          });
        }
      }
    }
  }

  // GROUP BY
  const groupByMatch = query.match(/GROUP\s+BY\s+(\w+)/i);
  if (groupByMatch) {
    result.groupBy = groupByMatch[1];
  }

  // ORDER BY
  const orderByMatch = query.match(/ORDER\s+BY\s+([^(\s]+(?:\([^)]*\))?)\s*(?:(ASC|DESC))?/i);
  if (orderByMatch) {
    result.orderByAttr = orderByMatch[1];
    result.orderDirection = orderByMatch[2]?.toUpperCase() || 'ASC';
  }

  return result;
}

function parseWhereValue(value) {
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  if (!isNaN(value)) {
    return Number(value);
  }
  const quotedMatch = value.match(/^'(.*)'$/);
  return quotedMatch ? quotedMatch[1] : value;
}

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
