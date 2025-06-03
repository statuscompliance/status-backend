/**
 * Constructs a Sequelize WHERE clause from query parameters.
 * Validates parameters based on allowed values defined in a dictionary.
 *
 * @param {Object} query - Query params (e.g., from req.query).
 * @param {Object} validParamsMap - Dictionary with keys as param names and values as arrays of valid options.
 * @returns {Object} Sequelize-compatible where clause.
 * @throws {Error} If any param has an invalid value.
 */
export const buildWhereClause = (query, validParamsMap = {}) => {
  const whereClause = {};

  for (const [key, value] of Object.entries(query)) {
    if (validParamsMap[key]) {
      if (validParamsMap[key].includes(value)) {
        whereClause[key] = value;
      } else {
        throw new Error(
          `Invalid value for "${key}": "${value}". Allowed values are ${validParamsMap[key].join(' or ')}.`
        );
      }
    } else {
      // Include param as-is if not restricted
      whereClause[key] = value;
    }
  }

  return whereClause;
};
