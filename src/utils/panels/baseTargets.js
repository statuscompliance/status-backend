/**
 * Base configuration for Grafana SQL targets
 * @param {string} rawSql - SQL query to execute
 * @returns {Object} - Base configuration of the target
 */
export function createBaseTarget(rawSql = 'SELECT "agreementId", "guaranteeValue", "timestamp", scope FROM "Points" LIMIT 50') {
  return {
    datasource: {
      type: 'grafana-postgresql-datasource',
      uid: 'P5E4ECD82955BB660'
    },
    refId: 'A',
    format: 'table',
    rawSql,
    editorMode: 'builder',
    sql: {
      columns: [
        {
          type: 'function',
          parameters: [
            {
              type: 'functionParameter',
              name: '"agreementId"'
            }
          ]
        },
        {
          type: 'function',
          parameters: [
            {
              type: 'functionParameter',
              name: '"guaranteeValue"'
            }
          ]
        },
        {
          type: 'function',
          parameters: [
            {
              type: 'functionParameter',
              name: '"timestamp"'
            }
          ]
        },
        {
          type: 'function',
          parameters: [
            {
              type: 'functionParameter',
              name: 'scope'
            }
          ]
        }
      ],
      groupBy: [
        {
          type: 'groupBy',
          property: {
            type: 'string'
          }
        }
      ],
      limit: 50
    },
    table: '"Points"'
  };
}
