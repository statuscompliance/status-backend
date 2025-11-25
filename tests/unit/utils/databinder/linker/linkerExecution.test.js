import { describe, it, expect } from 'vitest';
import {
  mergeDatasourceResults,
  createLinkerExecutionMetadata,
  createLinkerExecutionSummary
} from '../../../../../src/utils/databinder/linker/linkerExecution.js';

describe('linkerExecution', () => {
  describe('mergeDatasourceResults', () => {
    it('should return null for empty results array', () => {
      const result = mergeDatasourceResults([]);

      expect(result).toBeNull();
    });

    it('should return null for null results', () => {
      const result = mergeDatasourceResults(null);

      expect(result).toBeNull();
    });

    it('should return single result data directly', () => {
      const results = [
        { datasourceId: 'ds-1', data: { users: ['John', 'Jane'] } }
      ];

      const result = mergeDatasourceResults(results);

      expect(result).toEqual({ users: ['John', 'Jane'] });
    });

    describe('concat strategy', () => {
      it('should concatenate array results', () => {
        const results = [
          { datasourceId: 'ds-1', data: [1, 2, 3] },
          { datasourceId: 'ds-2', data: [4, 5, 6] },
          { datasourceId: 'ds-3', data: [7, 8] }
        ];

        const result = mergeDatasourceResults(results, 'concat');

        expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });

      it('should skip non-array results in concat', () => {
        const results = [
          { datasourceId: 'ds-1', data: [1, 2, 3] },
          { datasourceId: 'ds-2', data: { notAnArray: true } },
          { datasourceId: 'ds-3', data: [4, 5] }
        ];

        const result = mergeDatasourceResults(results, 'concat');

        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should handle empty arrays', () => {
        const results = [
          { datasourceId: 'ds-1', data: [] },
          { datasourceId: 'ds-2', data: [1, 2] }
        ];

        const result = mergeDatasourceResults(results, 'concat');

        expect(result).toEqual([1, 2]);
      });
    });

    describe('merge strategy', () => {
      it('should merge object results', () => {
        const results = [
          { datasourceId: 'ds-1', data: { a: 1, b: 2 } },
          { datasourceId: 'ds-2', data: { c: 3, d: 4 } },
          { datasourceId: 'ds-3', data: { e: 5 } }
        ];

        const result = mergeDatasourceResults(results, 'merge');

        expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4, e: 5 });
      });

      it('should override properties with last value', () => {
        const results = [
          { datasourceId: 'ds-1', data: { key: 'value1' } },
          { datasourceId: 'ds-2', data: { key: 'value2' } }
        ];

        const result = mergeDatasourceResults(results, 'merge');

        expect(result).toEqual({ key: 'value2' });
      });

      it('should skip non-object and array results in merge', () => {
        const results = [
          { datasourceId: 'ds-1', data: { a: 1 } },
          { datasourceId: 'ds-2', data: [1, 2, 3] },
          { datasourceId: 'ds-3', data: { b: 2 } }
        ];

        const result = mergeDatasourceResults(results, 'merge');

        expect(result).toEqual({ a: 1, b: 2 });
      });
    });

    describe('override strategy', () => {
      it('should return last result data', () => {
        const results = [
          { datasourceId: 'ds-1', data: { first: true } },
          { datasourceId: 'ds-2', data: { second: true } },
          { datasourceId: 'ds-3', data: { last: true } }
        ];

        const result = mergeDatasourceResults(results, 'override');

        expect(result).toEqual({ last: true });
      });

      it('should work with arrays', () => {
        const results = [
          { datasourceId: 'ds-1', data: [1, 2] },
          { datasourceId: 'ds-2', data: [3, 4] }
        ];

        const result = mergeDatasourceResults(results, 'override');

        expect(result).toEqual([3, 4]);
      });
    });

    describe('indexed strategy', () => {
      it('should return object indexed by datasource name', () => {
        const results = [
          { datasourceId: 'ds-1', datasourceName: 'API1', data: { users: 10 } },
          { datasourceId: 'ds-2', datasourceName: 'API2', data: { users: 20 } },
          { datasourceId: 'ds-3', datasourceName: 'API3', data: { users: 30 } }
        ];

        const result = mergeDatasourceResults(results, 'indexed');

        expect(result).toEqual({
          API1: { users: 10 },
          API2: { users: 20 },
          API3: { users: 30 }
        });
      });

      it('should fallback to datasourceId when datasourceName not available', () => {
        const results = [
          { datasourceId: 'ds-1', data: { count: 1 } },
          { datasourceId: 'ds-2', datasourceName: 'API2', data: { count: 2 } }
        ];

        const result = mergeDatasourceResults(results, 'indexed');

        expect(result).toEqual({
          'ds-1': { count: 1 },
          'API2': { count: 2 }
        });
      });
    });

    describe('default strategy', () => {
      it('should return array of all data values for unknown strategy', () => {
        const results = [
          { datasourceId: 'ds-1', data: { a: 1 } },
          { datasourceId: 'ds-2', data: { b: 2 } }
        ];

        const result = mergeDatasourceResults(results, 'unknown-strategy');

        expect(result).toEqual([{ a: 1 }, { b: 2 }]);
      });

      it('should concatenate arrays for no strategy specified', () => {
        const results = [
          { datasourceId: 'ds-1', data: [1, 2] },
          { datasourceId: 'ds-2', data: [3, 4] }
        ];

        const result = mergeDatasourceResults(results);

        expect(result).toEqual([1, 2, 3, 4]);
      });
    });
  });

  describe('createLinkerExecutionMetadata', () => {
    it('should create comprehensive execution metadata', () => {
      const params = {
        linkerId: 'linker-123',
        datasourceIds: ['ds-1', 'ds-2', 'ds-3'],
        executionId: 'exec-456',
        startTime: 1672531200000,
        endTime: 1672531205000,
        results: [
          { datasourceId: 'ds-1', success: true },
          { datasourceId: 'ds-2', success: true },
          { datasourceId: 'ds-3', success: false }
        ]
      };

      const metadata = createLinkerExecutionMetadata(params);

      expect(metadata).toEqual({
        linkerId: 'linker-123',
        executionId: 'exec-456',
        datasourceCount: 3,
        datasourceIds: ['ds-1', 'ds-2', 'ds-3'],
        executionDuration: 5000,
        executionDurationMs: '5000ms',
        timestamp: '2023-01-01T00:00:00.000Z',
        resultCount: 3,
        successfulDatasources: 2,
        failedDatasources: 1
      });
    });

    it('should handle execution with all successful results', () => {
      const params = {
        linkerId: 'linker-123',
        datasourceIds: ['ds-1', 'ds-2'],
        executionId: 'exec-456',
        startTime: 1672531200000,
        endTime: 1672531202000,
        results: [
          { datasourceId: 'ds-1', success: true },
          { datasourceId: 'ds-2', success: true }
        ]
      };

      const metadata = createLinkerExecutionMetadata(params);

      expect(metadata.successfulDatasources).toBe(2);
      expect(metadata.failedDatasources).toBe(0);
    });

    it('should handle execution with all failed results', () => {
      const params = {
        linkerId: 'linker-123',
        datasourceIds: ['ds-1', 'ds-2'],
        executionId: 'exec-456',
        startTime: 1672531200000,
        endTime: 1672531202000,
        results: [
          { datasourceId: 'ds-1', success: false },
          { datasourceId: 'ds-2', success: false }
        ]
      };

      const metadata = createLinkerExecutionMetadata(params);

      expect(metadata.successfulDatasources).toBe(0);
      expect(metadata.failedDatasources).toBe(2);
    });
  });

  describe('createLinkerExecutionSummary', () => {
    it('should create summary with datasource results', () => {
      const results = [
        {
          datasourceId: 'ds-1',
          datasourceName: 'API1',
          success: true,
          data: { users: 10 }
        },
        {
          datasourceId: 'ds-2',
          datasourceName: 'API2',
          success: false,
          error: 'Connection timeout',
          data: null
        },
        {
          datasourceId: 'ds-3',
          datasourceName: 'API3',
          success: true,
          data: { users: 20 }
        }
      ];

      const summary = createLinkerExecutionSummary(results);

      expect(summary).toEqual({
        totalDatasources: 3,
        successful: 2,
        failed: 1,
        datasourceResults: [
          {
            datasourceId: 'ds-1',
            datasourceName: 'API1',
            success: true,
            error: null,
            dataSize: JSON.stringify({ users: 10 }).length
          },
          {
            datasourceId: 'ds-2',
            datasourceName: 'API2',
            success: false,
            error: 'Connection timeout',
            dataSize: 0
          },
          {
            datasourceId: 'ds-3',
            datasourceName: 'API3',
            success: true,
            error: null,
            dataSize: JSON.stringify({ users: 20 }).length
          }
        ]
      });
    });

    it('should handle empty results array', () => {
      const summary = createLinkerExecutionSummary([]);

      expect(summary).toEqual({
        totalDatasources: 0,
        successful: 0,
        failed: 0,
        datasourceResults: []
      });
    });

    it('should handle results without data', () => {
      const results = [
        {
          datasourceId: 'ds-1',
          datasourceName: 'API1',
          success: true
        }
      ];

      const summary = createLinkerExecutionSummary(results);

      expect(summary.datasourceResults[0].dataSize).toBe(0);
    });

    it('should handle results without error field', () => {
      const results = [
        {
          datasourceId: 'ds-1',
          datasourceName: 'API1',
          success: true,
          data: { test: true }
        }
      ];

      const summary = createLinkerExecutionSummary(results);

      expect(summary.datasourceResults[0].error).toBeNull();
    });
  });
});
