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
      .map((agg) => `${agg.func}(${agg.attr})`)
      .join(', ');
  }

  // Raw columns
  if (columns.length > 0) {
    if (aggregations.length > 0) query += ', ';
    query += columns.map((col) => `${col}`).join(', ');
  }

  if (aggregations.length === 0 && columns.length === 0) {
    query += '*';
  }

  query += ` FROM statusdb.${table}`;

  // WHERE
  if (whereConditions.length > 0) {
    const whereClause = whereConditions
      .map((cond) => {
        const value =
                    typeof cond.value === 'number' ||
                    cond.value === true ||
                    cond.value === false
                      ? cond.value
                      : `'${cond.value}'`;
        return `${cond.key} ${cond.operator} ${value}`;
      })
      .join(` ${whereLogic} `);
    query += ` WHERE (${whereClause})`;
  }

  // GROUP BY
  if (groupBy) {
    query += ` GROUP BY ${groupBy}`;
  }

  // ORDER BY
  if (orderByAttr) {
    const direction =
            orderDirection && orderDirection.toUpperCase() === 'DESC'
              ? 'DESC'
              : 'ASC';
    query += ` ORDER BY ${orderByAttr} ${direction}`;
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

  result.table = parseTable(query);
  parseSelect(query, result);
  parseWhere(query, result);
  result.groupBy = parseGroupBy(query);
  parseOrderBy(query, result);

  return result;
}

function parseTable(query) {
  const tableMatch = query.match(/FROM\s+statusdb\.(\w+)/i);
  return tableMatch ? tableMatch[1] : 'computation';
}

function parseSelect(query, result) {
  const selectMatch = query.match(/SELECT\s+([\s\w\d_(),.*]+)\s+FROM/i);
  if (selectMatch) {
    const selectFieldsString = selectMatch[1];
    let currentIndex = 0;
    let field = '';
    let parenCount = 0;

    while (currentIndex < selectFieldsString.length) {
      const char = selectFieldsString[currentIndex];
      if (char === '(') {
        parenCount++;
        field += char;
      } else if (char === ')') {
        parenCount--;
        field += char;
      } else if (char === ',' && parenCount === 0) {
        processSelectField(field.trim(), result);
        field = '';
      } else {
        field += char;
      }
      currentIndex++;
    }
    processSelectField(field.trim(), result); // Process the last field
  }
}

function processSelectField(field, result) {
  const aggMatch = field.match(/(\w+)\(([^)]+)\)/);
  if (aggMatch) {
    result.aggregations.push({
      func: aggMatch[1],
      attr: aggMatch[2],
    });
  } else if (field !== '*') {
    result.columns.push(field);
  }
}

function parseWhere(query, result) {
  const whereMatch = query.match(/WHERE\s+\((.+?)\)/i);
  if (whereMatch) {
    const conditionsString = whereMatch[1];
    let currentIndex = 0;
    let condition = '';
    let logicOp = 'AND';

    while (currentIndex < conditionsString.length) {
      const char = conditionsString[currentIndex];

      if (char === 'A' || char === 'O') {
        if (conditionsString.substring(currentIndex, currentIndex + 3) === 'AND') {
          logicOp = 'AND';
          currentIndex += 3;
          if (condition.trim() !== '') {
            processCondition(condition.trim(), result, logicOp);
            condition = '';
          }
          continue;
        } else if (conditionsString.substring(currentIndex, currentIndex + 2) === 'OR') {
          logicOp = 'OR';
          currentIndex += 2;
          if (condition.trim() !== '') {
            processCondition(condition.trim(), result, logicOp);
            condition = '';
          }
          continue;
        }
      }
      condition += char;
      currentIndex++;
    }
    if (condition.trim() !== '') {
      processCondition(condition.trim(), result, logicOp);
    }
  }
}

function processCondition(condition, result, logicOp) {
  const comparisonMatch = condition.match(/([\w\d_]+)\s+(=|>|<|>=|<=|!=)\s+([\s\S]+)/);
  if (comparisonMatch) {
    const key = comparisonMatch[1].trim();
    const operator = comparisonMatch[2].trim();
    const value = parseWhereValue(comparisonMatch[3].trim());
    result.whereConditions.push({ key, operator, value });
    result.whereLogic = logicOp;
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
    return value;
  }
  const quotedMatch = value.match(/^['"](.*)['"]$/);
  return quotedMatch ? quotedMatch[1] : value;
}

function parseGroupBy(query) {
  const groupByMatch = query.match(/GROUP\s+BY\s+(\w+)/i);
  return groupByMatch ? groupByMatch[1] : null;
}

function parseOrderBy(query, result) {
  const orderByMatch = query.match(/ORDER\s+BY\s+([^(\s]+(?:\([^)]*\))?)\s*(?:(ASC|DESC))?/i);
  if (orderByMatch) {
    result.orderByAttr = orderByMatch[1];
    result.orderDirection = orderByMatch[2]?.toUpperCase() || 'ASC';
  }
}

export { createSQLQuery, parseSQLQuery };
