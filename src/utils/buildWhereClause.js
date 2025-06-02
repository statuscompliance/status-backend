/**
 * Builds a WHERE clause for Sequelize queries with validated status filters.
 * @param {Object} query - The query params object.
 * @param {Array<string>} validStatuses - Allowed values for the status field.
 * @returns {Object} Sequelize-compatible where clause.
 */
export const buildWhereClause = (query, validStatuses = ['finalized', 'draft']) => {
  const { status, ...otherFilters } = query;
  const whereClause = { ...otherFilters };

  if (status) {
    if (validStatuses.includes(status)) {
      whereClause.status = status;
    } else {
      throw new Error(
        `Invalid status filter: ${status}. Allowed values are ${validStatuses.join(' or ')}.`
      );
    }
  }

  return whereClause;
};
