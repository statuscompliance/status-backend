const gaugeStructure = {
  datasource: {
    default: true,
    type: 'postgres',
    uid: 'P5E4ECD82955BB660',
  },
  description: '',
  fieldConfig: {
    defaults: {
      color: {
        mode: 'thresholds',
      },
      custom: {
        neutral: 0,
      },
      decimals: 1,
      displayName: 'Control name',
      mappings: [],
      max: 100,
      min: 0,
      thresholds: {
        mode: 'percentage',
        steps: [
          {
            color: 'red',
            value: null,
          },
          {
            color: 'orange',
            value: 50,
          },
          {
            color: 'yellow',
            value: 70,
          },
          {
            color: 'green',
            value: 80,
          },
        ],
      },
    },
    overrides: [],
  },
  gridPos: {
    h: 8,
    w: 12,
    x: 0,
    y: 0,
  },
  id: 1,
  options: {
    minVizHeight: 75,
    minVizWidth: 75,
    orientation: 'auto',
    reduceOptions: {
      calcs: ['lastNotNull'],
      fields: '',
      values: false,
    },
    showThresholdLabels: true,
    showThresholdMarkers: true,
    sizing: 'auto',
    text: {},
  },
  pluginVersion: '11.2.1',
  targets: [
    {
      datasource: {
        type: 'grafana-postgresql-datasource',
        uid: 'P5E4ECD82955BB660',
      },
      editorMode: 'builder',
      format: 'table',
      rawQuery: true,
      rawSql: 'SELECT "agreementId", "guaranteeValue", "timestamp" FROM "Points"',
      refId: 'A',
      sql: {
        columns: [
          {
            parameters: [
              {
                name: '"agreementId"',
                type: 'functionParameter',
              },
            ],
            type: 'function',
          },{
            parameters: [
              {
                'name': '"guaranteeValue"',
                'type': 'functionParameter'
              }
            ],
            type: 'function'
          },
          {
            parameters: [
              {
                'name': '"timestamp"',
                'type': 'functionParameter'
              }
            ],
            type: 'function'
          }
        ],
        groupBy: [],
        limit: 50,
      },
      table: '"Points"',
    },
  ],
  title: 'Panel Title',
  type: 'gauge',
};

export default gaugeStructure;
