import { describe, it, expect, vi} from 'vitest';
import { parseSQLQuery, getSQLFromSequelize } from '../../../src/utils/sqlQueryBuilder.js';
import { models } from '../../../src/models/models.js';

// Mock for sequelize
vi.mock('../../../src/db/database.js', () => ({
  sequelize: {
    transaction: vi.fn().mockImplementation(() => ({
      rollback: vi.fn().mockResolvedValue(undefined)
    }))
  }
}));

describe('parseSQLQuery', () => {

  it('should parse a query with various clauses', () => {
    const query = 'SELECT AVG(guaranteeValue), id, COUNT(*) FROM points WHERE (guaranteeResult = true AND guaranteeValue > 0.95) GROUP BY guaranteeId ORDER BY timestamp DESC';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [{ func: 'AVG', attr: 'guaranteeValue' }, { func: 'COUNT', attr: '*' }],
      columns: ['id'],
      whereConditions: [
        { key: 'guaranteeResult', operator: '=', value: true },
        { key: 'guaranteeValue', operator: '>', value: 0.95 },
      ],
      whereLogic: 'AND',
      groupBy: 'guaranteeId',
      orderByAttr: 'timestamp',
      orderDirection: 'DESC',
      table: 'points',
      alias: null
    });
  });

  it('should parse a basic query', () => {
    const query = 'SELECT * FROM points';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with multiple aggregations and columns', () => {
    const query = 'SELECT COUNT(id), AVG(guaranteeValue), agreementId, guaranteeId FROM points';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [{ func: 'COUNT', attr: 'id' }, { func: 'AVG', attr: 'guaranteeValue' }],
      columns: ['agreementId', 'guaranteeId'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with different WHERE operators and data types', () => {
    const query = "SELECT * FROM points WHERE (guaranteeValue >= 0.9 AND agreementId != 'SLA-001' AND guaranteeResult = true AND scope LIKE '%region%')";
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: 'guaranteeValue', operator: '>=', value: 0.9 },
        { key: 'agreementId', operator: '!=', value: 'SLA-001' },
        { key: 'guaranteeResult', operator: '=', value: true },
        { key: 'scope', operator: 'LIKE', value: '%region%' }
      ],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with OR logic in WHERE clause', () => {
    const query = 'SELECT * FROM points WHERE (guaranteeResult = true OR guaranteeValue > 0.95)';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: 'guaranteeResult', operator: '=', value: true },
        { key: 'guaranteeValue', operator: '>', value: 0.95 },
      ],
      whereLogic: 'OR',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with alias', () => {
    const query = 'SELECT * FROM "points" AS "p"';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: 'p'
    });
  });

  it('should parse a query with a single WHERE condition', () => {
    const query = 'SELECT * FROM "points" WHERE ("agreementId" = \'SLA-002\')';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: '"agreementId"', operator: '=', value: 'SLA-002' }
      ],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with LIKE operator', () => {
    const query = 'SELECT * FROM "points" WHERE ("metrics" LIKE \'%availability%\')';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: '"metrics"', operator: 'LIKE', value: '%availability%' }
      ],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with limit and offset', () => {
    const query = 'SELECT * FROM "points" LIMIT 10 OFFSET 20';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null,
      limit: 10,
      offset: 20
    });
  });

  it('should handle numeric values correctly', () => {
    const query = 'SELECT * FROM "points" WHERE ("guaranteeValue" > 0.98)';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: '"guaranteeValue"', operator: '>', value: 0.98 }
      ],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with * in select fields', () => {
    const query = 'SELECT id, *, guaranteeId FROM points';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['id', '*', 'guaranteeId'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should parse a query with ORDER BY clause with default ASC direction', () => {
    const query = 'SELECT * FROM points ORDER BY guaranteeValue';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: 'guaranteeValue',
      orderDirection: 'ASC',
      table: 'points',
      alias: null
    });
  });

  it('should handle boolean false values correctly', () => {
    const query = 'SELECT * FROM points WHERE (guaranteeResult = false)';
    const result = parseSQLQuery(query);
    expect(result).toEqual({
      aggregations: [],
      columns: ['*'],
      whereConditions: [
        { key: 'guaranteeResult', operator: '=', value: false }
      ],
      whereLogic: 'AND',
      groupBy: null,
      orderByAttr: null,
      orderDirection: null,
      table: 'points',
      alias: null
    });
  });

  it('should handle queries with only the SELECT keyword', () => {
    const query = 'SELECT';
    const result = parseSQLQuery(query);
    expect(result.columns).toEqual([]);
    expect(result.table).toBeNull();
  });

  it('should extract table name without quotes', () => {
    const query = 'FROM points_table';
    const result = parseSQLQuery(query);
    expect(result.table).toBe('points_table');
    expect(result.columns).toEqual([]);
  });

  it('should handle SELECT without explicit columns and add *', () => {
    const query = 'SELECT FROM points';
    const result = parseSQLQuery(query);
    expect(result.columns).toEqual([]);
    expect(result.table).toBe('points');
  });
});

describe('getSQLFromSequelize', () => {

  it('should extract SQL from findAll call', async () => {
    const sql = await getSQLFromSequelize(models.Point, 'findAll', { where: { guaranteeResult: true } });
    expect(sql).toBe('SELECT "id", "agreementId", "guaranteeId", "guaranteeValue", "guaranteeResult", "timestamp", "metrics", "scope", "computationGroup", "createdAt", "updatedAt" FROM "points" AS "Point" WHERE "Point"."guaranteeResult" = true;');
  });

  it('should extract SQL from findOne call', async () => {
    const sql = await getSQLFromSequelize(models.Point, 'findOne', { 
      where: { id: '123e4567-e89b-12d3-a456-426614174000' }
    });
    expect(sql).toBe('SELECT "id", "agreementId", "guaranteeId", "guaranteeValue", "guaranteeResult", "timestamp", "metrics", "scope", "computationGroup", "createdAt", "updatedAt" FROM "points" AS "Point" WHERE "Point"."id" = \'123e4567-e89b-12d3-a456-426614174000\';');
  });
  
  it('should handle a primitive parameter by pushing it into callParams', async () => {
    const sql = await getSQLFromSequelize(models.Point, 'findByPk', '123e4567-e89b-12d3-a456-426614174000');
    console.log(sql);
    expect(sql).toBe('SELECT "id", "agreementId", "guaranteeId", "guaranteeValue", "guaranteeResult", "timestamp", "metrics", "scope", "computationGroup", "createdAt", "updatedAt" FROM "points" AS "Point" WHERE "Point"."id" = \'123e4567-e89b-12d3-a456-426614174000\';');
  });

  it('should handle SQL without colon separator', async () => {
    const mockModel = {
      findAll: async (options) => {
        if (options.logging) {
          // Llamar a logging con SQL sin el separador de dos puntos
          options.logging('SELECT * FROM points');
        }
        return [];
      }
    };
    
    const sql = await getSQLFromSequelize(mockModel, 'findAll', {});
    expect(sql).toBe('SELECT * FROM points');
  });
  
});
