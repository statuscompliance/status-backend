import { describe, it, expect } from 'vitest';
import { createSQLQuery, parseSQLQuery } from '../../../src/utils/sqlQueryBuilder.js';

describe('createSQLQuery', () => {
  it('should return a basic SELECT * query from the default table', () => {
    const query = createSQLQuery({});
    expect(query).toBe('SELECT * FROM statusdb.computation');
  });

  it.each([
    {
      description: 'should select specified columns',
      input: { columns: ['id', 'name'] },
      expected: 'SELECT id, name FROM statusdb.computation',
    },
    {
      description: 'should apply aggregations',
      input: { aggregations: [{ func: 'COUNT', attr: '*' }] },
      expected: 'SELECT COUNT(*) FROM statusdb.computation',
    },
    {
      description: 'should select columns and apply aggregations',
      input: {
        aggregations: [{ func: 'AVG', attr: 'value' }],
        columns: ['timestamp'],
      },
      expected: 'SELECT AVG(value), timestamp FROM statusdb.computation',
    },
    {
      description: 'should apply WHERE conditions with AND logic (default)',
      input: {
        whereConditions: [
          { key: 'status', operator: '=', value: 'active' },
          { key: 'value', operator: '>', value: 10 },
        ],
      },
      expected: "SELECT * FROM statusdb.computation WHERE (status = 'active' AND value > 10)",
    },
    {
      description: 'should apply WHERE conditions with OR logic',
      input: {
        whereConditions: [
          { key: 'type', operator: '=', value: 'error' },
          { key: 'level', operator: '=', value: 'critical' },
        ],
        whereLogic: 'OR',
      },
      expected: "SELECT * FROM statusdb.computation WHERE (type = 'error' OR level = 'critical')",
    },
    {
      description: 'should handle different data types in WHERE conditions',
      input: {
        whereConditions: [
          { key: 'isActive', operator: '=', value: true },
          { key: 'count', operator: '>=', value: 5 },
          { key: 'name', operator: '!=', value: 'test' },
        ],
      },
      expected: "SELECT * FROM statusdb.computation WHERE (isActive = true AND count >= 5 AND name != 'test')",
    },
    {
      description: 'should apply GROUP BY clause',
      input: { groupBy: 'category' },
      expected: 'SELECT * FROM statusdb.computation GROUP BY category',
    },
    {
      description: 'should apply ORDER BY clause with default ASC direction',
      input: { orderByAttr: 'timestamp' },
      expected: 'SELECT * FROM statusdb.computation ORDER BY timestamp ASC'
    },
    {
      description: 'should apply ORDER BY clause with DESC direction',
      input: { orderByAttr: 'value', orderDirection: 'DESC' },
      expected: 'SELECT * FROM statusdb.computation ORDER BY value DESC',
    },
    {
      description: 'should combine all clauses',
      input: {
        aggregations: [{ func: 'MAX', attr: 'score' }],
        columns: ['userId'],
        whereConditions: [{ key: 'gameId', operator: '=', value: 123 }],
        groupBy: 'userId',
        orderByAttr: 'score',
        orderDirection: 'DESC',
        table: 'scores',
      },
      expected: 'SELECT MAX(score), userId FROM statusdb.scores WHERE (gameId = 123) GROUP BY userId ORDER BY score DESC',
    },
  ])(
    '%s',
    ({ input, expected }) => {
      const query = createSQLQuery(input);
      expect(query).toBe(expected);
    },
  );
});

describe('parseSQLQuery', () => {
  it.each([
    {
      description: 'should parse a basic SELECT * query',
      query: 'SELECT * FROM statusdb.logs',
      expected: {
        aggregations: [],
        columns: ['*'],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'logs',
      },
    },
    {
      description: 'should parse a query with specified columns',
      query: 'SELECT id, email FROM statusdb.users',
      expected: {
        aggregations: [],
        columns: ['id', 'email'],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'users',
      },
    },
    {
      description: 'should parse a query with aggregations',
      query: 'SELECT COUNT(*) FROM statusdb.events',
      expected: {
        aggregations: [{ func: 'COUNT', attr: '*' }],
        columns: [],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'events',
      },
    },
    {
      description: 'should parse a query with columns and aggregations',
      query: 'SELECT SUM(amount), transaction_id FROM statusdb.payments',
      expected: {
        aggregations: [{ func: 'SUM', attr: 'amount' }],
        columns: ['transaction_id'],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'payments',
      },
    },
    {
      description: 'should parse a query with WHERE clause and AND logic',
      query: "SELECT * FROM statusdb.items WHERE (category = 'books' AND price < 20)",
      expected: {
        aggregations: [],
        columns: ['*'],
        whereConditions: [
          { key: 'category', operator: '=', value: 'books' },
          { key: 'price', operator: '<', value: '20' },
        ],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'items',
      },
    },
    {
      description: 'should parse a query with WHERE clause and OR logic',
      query: "SELECT * FROM statusdb.notifications WHERE (userId = 1 OR type = 'alert')",
      expected: {
        aggregations: [],
        columns: ['*'],
        whereConditions: [
          { key: 'userId', operator: '=', value: '1' },
          { key: 'type', operator: '=', value: 'alert' },
        ],
        whereLogic: 'OR',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'notifications',
      },
    },
    {
      description: 'should parse a query with different data types in WHERE clause',
      query: "SELECT * FROM statusdb.config WHERE (isEnabled = true AND value >= 10 AND name != 'default')",
      expected: {
        aggregations: [],
        columns: ['*'],
        whereConditions: [
          { key: 'isEnabled', operator: '=', value: true },
          { key: 'value', operator: '>=', value: '10' },
          { key: 'name', operator: '!=', value: 'default' },
        ],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'config',
      },
    },
    {
      description: 'should parse a query with GROUP BY clause',
      query: 'SELECT COUNT(*), status FROM statusdb.orders GROUP BY status',
      expected: {
        aggregations: [{ func: 'COUNT', attr: '*' }],
        columns: ['status'],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: 'status',
        orderByAttr: null,
        orderDirection: null,
        table: 'orders',
      },
    },
    {
      description: 'should parse a query with ORDER BY clause and default ASC direction',
      query: 'SELECT * FROM statusdb.products ORDER BY price',
      expected: {
        aggregations: [],
        columns: ['*'],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: 'price',
        orderDirection: 'ASC',
        table: 'products',
      },
    },
    {
      description: 'should parse a query with ORDER BY clause and DESC direction',
      query: 'SELECT * FROM statusdb.results ORDER BY score DESC',
      expected: {
        aggregations: [],
        columns: ['*'],
        whereConditions: [],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: 'score',
        orderDirection: 'DESC',
        table: 'results',
      },
    },
    {
      description: 'should parse a complex query with all clauses',
      query: "SELECT AVG(rating), productId, COUNT(reviews) FROM statusdb.product_data WHERE (category = 'electronics' AND price > 50) GROUP BY productId ORDER BY AVG(rating) DESC",
      expected: {
        aggregations: [{ func: 'AVG', attr: 'rating' }, { func: 'COUNT', attr: 'reviews' }],
        columns: ['productId'],
        whereConditions: [
          { key: 'category', operator: '=', value: 'electronics' },
          { key: 'price', operator: '>', value: '50' },
        ],
        whereLogic: 'AND',
        groupBy: 'productId',
        orderByAttr: 'AVG(rating)',
        orderDirection: 'DESC',
        table: 'product_data',
      },
    },
    {
      description: 'should handle queries with COUNT(*) aggregation',
      query: 'SELECT COUNT(*) FROM statusdb.users WHERE (age > 18)',
      expected: {
        aggregations: [{ func: 'COUNT', attr: '*' }],
        columns: [],
        whereConditions: [{ key: 'age', operator: '>', value: '18' }],
        whereLogic: 'AND',
        groupBy: null,
        orderByAttr: null,
        orderDirection: null,
        table: 'users',
      },
    },
  ])(
    '%s',
    ({ query, expected }) => {
      const result = parseSQLQuery(query);
      expect(result).toEqual(expected);
    },
  );
});
