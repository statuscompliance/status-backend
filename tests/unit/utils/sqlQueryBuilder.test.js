import { describe, it, expect } from 'vitest';
import { createSQLQuery, parseSQLQuery } from '../../../src/utils/sqlQueryBuilder.js';

describe('createSQLQuery', () => {

  it('should handle basic query construction', () => {
    const query = createSQLQuery({
      columns: ['id', 'name'],
      aggregations: [{ func: 'COUNT', attr: '*' }],
      whereConditions: [
        { key: 'status', operator: '=', value: 'active' },
        { key: 'value', operator: '>', value: 10 },
      ],
      whereLogic: 'OR',
      groupBy: 'category',
      orderByAttr: 'timestamp',
      orderDirection: 'DESC',
      table: 'custom_table'
    });
    expect(query).toBe("SELECT COUNT(*), id, name FROM statusdb.custom_table WHERE (status = 'active' OR value > 10) GROUP BY category ORDER BY timestamp DESC");
  });

  it('should handle default values', () => {
    const query = createSQLQuery({});
    expect(query).toBe('SELECT * FROM statusdb.computation');
  });
});

describe('parseSQLQuery', () => {

  it('should parse a query with various clauses', () => {
    const query = "SELECT AVG(value), id, COUNT(*) FROM statusdb.data WHERE (status = 'active' AND value > 10) GROUP BY category ORDER BY timestamp DESC";
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [{ func: 'AVG', attr: 'value' }, { func: 'COUNT', attr: '*' }],
      columns: ['id'],
      whereConditions: [
        { key: 'status', operator: '=', value: 'active' },
        { key: 'value', operator: '>', value: '10' },
      ],
      whereLogic: 'AND',
      groupBy: 'category',
      orderByAttr: 'timestamp',
      orderDirection: 'DESC',
      table: 'data',
    });
  });

  it('should parse a basic query', () => {
    const query = 'SELECT * FROM statusdb.logs';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'logs'
    });
  });
});
