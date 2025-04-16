import { describe, it, expect } from 'vitest';
import { createSQLQuery, parseSQLQuery } from '../../../src/utils/sqlQueryBuilder.js';

describe('createSQLQuery', () => {

  it('should handle basic query construction', () => {
    const query = createSQLQuery({
      select: {
        columns: ['id', 'name'],
        aggregations: [{ func: 'COUNT', attr: '*' }],
      },
      where: {
        conditions: [
          { key: 'status', operator: '=', value: 'active' },
          { key: 'value', operator: '>', value: 10 },
        ],
        logic: 'OR',
      },
      groupBy: 'category',
      orderBy: {
        attr: 'timestamp',
        direction: 'DESC',
      },
      from: { table: 'custom_table' }
    });
    expect(query).toBe('SELECT COUNT(*), id, name FROM statusdb.custom_table WHERE (status = active OR value > 10) GROUP BY category ORDER BY timestamp DESC');
  });

  it('should handle default values', () => {
    const query = createSQLQuery({});
    expect(query).toBe('SELECT * FROM statusdb.computation');
  });

  it('should handle multiple aggregations', () => {
    const query = createSQLQuery({
      select: {
        aggregations: [
          { func: 'COUNT', attr: '*' },
          { func: 'AVG', attr: 'value' },
          { func: 'MAX', attr: 'price' },
        ],
        columns: ['category'],
      },
      groupBy: 'category'
    });
    expect(query).toBe('SELECT COUNT(*), AVG(value), MAX(price), category FROM statusdb.computation GROUP BY category');
  });

  it('should handle WHERE conditions with different operators and data types', () => {
    const query = createSQLQuery({
      where: {
        conditions: [
          { key: 'age', operator: '>=', value: 18 },
          { key: 'name', operator: '!=', value: 'John Doe' },
          { key: 'is_active', operator: '=', value: true },
          { key: 'role', operator: 'LIKE', value: '%admin%' }
        ],
        logic: 'AND'
      }
    });
    expect(query).toBe('SELECT * FROM statusdb.computation WHERE (age >= 18 AND name != John Doe AND is_active = true AND role LIKE %admin%)');
  });

  it('should handle ORDER BY with different direction', () => {
    const query = createSQLQuery({
      orderBy: {
        attr: 'name',
        direction: 'ASC'
      }
    });
    expect(query).toBe('SELECT * FROM statusdb.computation ORDER BY name ASC');
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
        { key: 'value', operator: '>', value: 10 },
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

  it('should parse a query with multiple aggregations and columns', () => {
    const query = 'SELECT COUNT(id), AVG(amount), name, email FROM statusdb.users';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [{ func: 'COUNT', attr: 'id' }, { func: 'AVG', attr: 'amount' }],
      columns: ['name', 'email'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'users',
    });
  });

  it('should parse a query with different WHERE operators and data types', () => {
    const query = "SELECT * FROM statusdb.records WHERE (age >= 18 AND name != 'John Doe' AND is_active = true AND role LIKE '%admin%')";
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: 'age', operator: '>=', value: 18 },
        { key: 'name', operator: '!=', value: 'John Doe' },
        { key: 'is_active', operator: '=', value: true },
        { key: 'role', operator: 'LIKE', value: '%admin%' }
      ],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'records',
    });
  });

  it('should parse a query with OR logic in WHERE clause', () => {
    const query = "SELECT * FROM statusdb.errors WHERE (type = 'warning' OR level = 'critical')";
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: 'type', operator: '=', value: 'warning' },
        { key: 'level', operator: '=', value: 'critical' },
      ],
      whereLogic: 'OR',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'errors',
    });
  });
});
