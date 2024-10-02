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
 * @param {string} [sql.table='Computations'] - Nombre de la tabla, por defecto 'Computations'.
 *
 * @returns {string} - La consulta SQL generada.
 */

function createSQLQuery({
    aggregations = [],
    columns = [],
    whereConditions = [],
    whereLogic = "AND",
    groupBy,
    orderByAttr,
    orderDirection,
    table = "Computations",
}) {
    let query = `SELECT `;

    // Aggregations
    if (aggregations.length > 0) {
        query += aggregations
            .map((agg) => `${agg.func}(${agg.attr})`)
            .join(", ");
    }

    // Raw columns
    if (columns.length > 0) {
        if (aggregations.length > 0) query += ", ";
        query += columns.map((col) => `${col}`).join(", ");
    }

    // Default to select all columns if none are provided
    if (aggregations.length === 0 && columns.length === 0) {
        query += "*";
    }

    query += ` FROM statusdb.${table}`;

    // WHERE
    if (whereConditions.length > 0) {
        const whereClause = whereConditions
            .map((cond) => `${cond.key} ${cond.operator} '${cond.value}'`)
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
            orderDirection && orderDirection.toUpperCase() === "DESC"
                ? "DESC"
                : "ASC";
        query += ` ORDER BY ${orderByAttr} ${direction}`;
    }

    return query;
}

export default createSQLQuery;

/* EJEMPLOS
SELECT * FROM statusdb.Computations
{}

SELECT id, date FROM statusdb.Computations WHERE (id > '5' AND limit < '5')
{
    "columns": ["id", "date"],
    "whereConditions": [
        { "key": "id", "operator": ">", "value": 5 },
        { "key": "limit", "operator": "<", "value": 5 }
    ],
    "whereLogic": "AND"
}

SELECT COUNT(limit), MAX(date) FROM statusdb.Computations
{
    "aggregations": [
        { "func": "COUNT", "attr": "limit" },
        { "func": "MAX", "attr": "date" }
    ]
}

SELECT COUNT(limit) FROM statusdb.Computations WHERE (available != '5' OR active = '1') GROUP BY limit
{
    "aggregations": [
        { "func": "COUNT", "attr": "limit" }
    ],
    "whereConditions": [
        { "key": "available", "operator": "!=", "value": "5" },
        { "key": "active", "operator": "=", "value": "1" }
    ],
    "whereLogic": "OR",
    "groupBy": "limit"
}

SELECT id FROM statusdb.Computations ORDER BY limit ASC
{
    "columns": ["id"],
    "orderByAttr": "limit",
    "orderDirection": "ASC"
}

SELECT COUNT(limit), id FROM statusdb.Computations WHERE (id > '5' AND limit <= '10')
{
    "columns": ["id"],
    "aggregations": [
        { "func": "COUNT", "attr": "limit" }
    ],
    "whereConditions": [
        { "key": "id", "operator": ">", "value": 5 },
        { "key": "limit", "operator": "<=", "value": 10 }
    ],
    "whereLogic": "AND"
}
*/