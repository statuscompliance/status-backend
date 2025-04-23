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

function buildSelectClause(aggregations, columns) {
  let selectClause = 'SELECT ';
  const aggs = Array.isArray(aggregations) ? aggregations : [];
  const cols = Array.isArray(columns) ? columns : [];

  if (aggs.length === 0 && cols.length === 0) {
    selectClause += '*';
  } else {
    const selectParts = [];
    aggs.forEach(agg => {
      const attr = agg.func.toUpperCase() === 'COUNT' && agg.attr === '*' ? '*' : sanitizeIdentifier(agg.attr);
      selectParts.push(`${sanitizeIdentifier(agg.func)}(${attr})`);
    });
    cols.forEach(col => {
      selectParts.push(sanitizeIdentifier(col));
    });
    selectClause += selectParts.join(', ');
  }
  return selectClause;
}

function buildFromClause(table) {
  return `FROM statusdb.${sanitizeIdentifier(table)}`;
}

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
  const separator = ` ${logic} `;

  return `WHERE (${whereClauses.join(separator)})`;
}

function buildGroupByClause(groupBy) {
  if (!groupBy) {
    return '';
  }
  return `GROUP BY ${sanitizeIdentifier(groupBy)}`;
}

function buildOrderByClause(attr, direction = 'ASC') {
  if (!attr) {
    return '';
  }
  const orderDirection = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return `ORDER BY ${sanitizeIdentifier(attr)} ${orderDirection}`;
}

function parseSelectClause(selectPart, result) {
  result.aggregations = [];
  result.columns = [];

  if (!selectPart || selectPart.trim() === '' || selectPart.trim() === '*') {
    return;
  }

  const selectFields = selectPart.split(',');

  selectFields.forEach(field => {
    field = field.trim();
    const aggMatch = field.match(/^(\w+)\(([^)]+)\)$/i);

    if (aggMatch && aggMatch[1] && aggMatch[2] !== undefined) {
      const funcName = aggMatch[1].toUpperCase();
      const attrName = aggMatch[2].trim();
      if (funcName === 'COUNT' && attrName === '*') {
        result.aggregations.push({ func: 'COUNT', attr: '*' });
      } else {
        result.aggregations.push({ func: funcName, attr: attrName });
      }
    } else if (field) {
      result.columns.push(field);
    }
  });
}

function parseFromClause(fromPart, result) {
  result.table = 'computation';

  if (!fromPart || fromPart.trim() === '') {
    console.warn('WARNING: FROM part empty, using default table.');
    return;
  }

  const fromPartTrimmed = fromPart.trim();

  const tableMatch = fromPartTrimmed.match(/^statusdb\.(\w+)$/i);
  if (tableMatch && tableMatch[1]) {
    result.table = tableMatch[1];
  } else {
    console.warn(`WARNING: Unexpected FROM format: "${fromPartTrimmed}", using default table.`);
  }
}

function parseWhereClause(whereContentPart, result) {
  result.whereConditions = [];
  result.whereLogic = 'AND'; // Default logic

  if (!whereContentPart || whereContentPart.trim() === '') {
    return;
  }

  const conditionsString = whereContentPart.trim();

  const tokens = conditionsString.split(/\s+/);

  const currentConditionTokens = [];
  const conditionsAndLogicTokens = []; 

  for (const token of tokens) {
    const upperToken = token.toUpperCase();
    if (upperToken === 'AND' || upperToken === 'OR') {
      if (currentConditionTokens.length > 0) {
        conditionsAndLogicTokens.push(currentConditionTokens.join(' '));
        currentConditionTokens.length = 0;
      }
      conditionsAndLogicTokens.push(upperToken);
    } else if (token) {
      currentConditionTokens.push(token);
    }
  }
  if (currentConditionTokens.length > 0) {
    conditionsAndLogicTokens.push(currentConditionTokens.join(' '));
  }

  if (conditionsAndLogicTokens.length === 0) {
    return;
  }

  const firstLogicToken = conditionsAndLogicTokens.find((_, index) => index % 2 !== 0);
  if (firstLogicToken) {
    result.whereLogic = firstLogicToken;
  }

  conditionsAndLogicTokens.forEach((part, index) => {
    if (index % 2 === 0) {
      const conditionString = part;

      const conditionTrimmed = conditionString.trim();

      if (!conditionTrimmed) return; // Skip empty strings

      const operatorRegex = /\s*(>=|<=|!=|=|>|<|LIKE)\s*/i;

      const operatorMatch = operatorRegex.exec(conditionTrimmed);

      if (operatorMatch) {

        const fullMatch = operatorMatch[0];
        const operator = operatorMatch[1];
        const matchIndex = operatorMatch.index;

        const key = conditionTrimmed.substring(0, matchIndex).trim();
        const valueString = conditionTrimmed.substring(matchIndex + fullMatch.length).trim();

        const rawOperatorFound = operator.toUpperCase();
        const isValidOperator = ['>=', '<=', '!=', '=', '>', '<', 'LIKE'].includes(rawOperatorFound);


        if (key && isValidOperator && valueString !== '') {
          result.whereConditions.push({
            key: key,
            operator: rawOperatorFound,
            value: parseWhereValue(valueString),
          });
        } else {
          console.warn(`WARNING: Malformed condition part after finding operator "${operator}": "${conditionTrimmed}"`);
        }

      } else {
        console.warn(`WARNING: No valid operator found in condition part: "${conditionTrimmed}"`);
      }

    }
  });
}

function parseGroupByClause(groupByPart, result) {
  result.groupBy = null;

  if (!groupByPart || groupByPart.trim() === '') {
    return;
  }

  const groupByPartTrimmed = groupByPart.trim();

  const columnMatch = groupByPartTrimmed.match(/^(\w+)$/);
  if (columnMatch && columnMatch[1]) {
    result.groupBy = columnMatch[1];
  } else {
    console.warn(`WARNING: Unexpected GROUP BY format: "${groupByPartTrimmed}", expecting single identifier.`);
  }
}

function parseOrderByClause(orderByPart, result) {
  result.orderByAttr = null;
  result.orderDirection = null;

  if (!orderByPart || orderByPart.trim() === '') {
    return;
  }

  const orderByPartTrimmed = orderByPart.trim();

  const orderByMatch = orderByPartTrimmed.match(/^([a-zA-Z0-9_.]+)\s*(ASC|DESC)?$/i);

  if (orderByMatch && orderByMatch[1]) {
    result.orderByAttr = orderByMatch[1];
    result.orderDirection = orderByMatch[2]?.toUpperCase() || 'ASC';
  } else {
    console.warn(`WARNING: Unexpected ORDER BY format: "${orderByPartTrimmed}", expecting identifier [ASC|DESC].`);
  }
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

  if (!query || typeof query !== 'string') {
    return result;
  }

  const upperQuery = query.toUpperCase();

  const keywords = ['SELECT ', ' FROM ', ' WHERE ', ' GROUP BY ', ' ORDER BY '];
  const indices = {};
  let currentPos = 0;

  for (const keyword of keywords) {
    const keywordUpper = keyword.toUpperCase();
    const index = upperQuery.indexOf(keywordUpper, currentPos);

    if (index !== -1) {
      indices[keyword.trim()] = index;
      currentPos = index + keyword.length;
    } else {
      console.warn(`WARNING: Keyword "${keyword.trim()}" not found after position ${currentPos}`);
      break;
    }
  }

  if (indices['SELECT'] === 0) {
    const endSelect = indices['FROM'] !== undefined ? indices['FROM'] : query.length;
    const selectPart = query.substring(indices['SELECT'] + keywords[0].length, endSelect).trim();
    parseSelectClause(selectPart, result);
  }

  if (indices['FROM'] !== undefined) {
    const endFrom = indices['WHERE'] !== undefined ? indices['WHERE'] : indices['GROUP BY'] !== undefined ? indices['GROUP BY'] : indices['ORDER BY'] !== undefined ? indices['ORDER BY'] : query.length;
    const fromPart = query.substring(indices['FROM'] + keywords[1].length, endFrom).trim();
    parseFromClause(fromPart, result);
  }

  if (indices['WHERE'] !== undefined) {
    const endWhere = indices['GROUP BY'] !== undefined ? indices['GROUP BY'] : indices['ORDER BY'] !== undefined ? indices['ORDER BY'] : query.length;
    const wherePartWithParens = query.substring(indices['WHERE'] + keywords[2].length, endWhere).trim();

    const whereContentMatch = wherePartWithParens.match(/^\s*\((.+?)\)$/);
    if (whereContentMatch && whereContentMatch[1]) {
      const whereContent = whereContentMatch[1].trim();
      parseWhereClause(whereContent, result);
    } else {
      console.warn(`WARNING: WHERE clause format unexpected (missing or malformed parentheses): "${wherePartWithParens}"`);
    }
  }

  if (indices['GROUP BY'] !== undefined) {
    const endGroupBy = indices['ORDER BY'] !== undefined ? indices['ORDER BY'] : query.length;
    const groupByPart = query.substring(indices['GROUP BY'] + keywords[3].length, endGroupBy).trim();
    parseGroupByClause(groupByPart, result);
  }

  if (indices['ORDER BY'] !== undefined) {
    const orderByPart = query.substring(indices['ORDER BY'] + keywords[4].length).trim(); // Hasta el final
    parseOrderByClause(orderByPart, result);
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

//Helpers
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

