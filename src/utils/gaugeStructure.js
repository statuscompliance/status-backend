const gaugeStructure = {
  datasource: {
    default: true,
    type: 'mysql',
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
      dataset: 'statusdb',
      datasource: {
        type: 'mysql',
        uid: 'P5E4ECD82955BB660',
      },
      editorMode: 'builder',
      format: 'table',
      rawQuery: true,
      rawSql: 'SELECT COUNT(`limit`) FROM statusdb.Configurations WHERE `limit` = 1 LIMIT 50 ',
      refId: 'A',
      sql: {
        columns: [
          {
            name: 'COUNT',
            parameters: [
              {
                name: '`limit`',
                type: 'functionParameter',
              },
            ],
            type: 'function',
          },
        ],
        groupBy: [],
        limit: 50,
        whereJsonTree: {
          children1: [
            {
              id: 'aabbbb8b-0123-4456-b89a-b192488a102c',
              properties: {
                field: '`limit`',
                fieldSrc: 'field',
                operator: 'equal',
                value: [1],
                valueError: [null],
                valueSrc: ['value'],
                valueType: ['number'],
              },
              type: 'rule',
            },
          ],
          id: '998a889b-0123-4456-b89a-b1924882e862',
          properties: {
            conjunction: 'AND',
          },
          type: 'group',
        },
        whereString: '`limit` = 1',
      },
      table: 'Configurations',
    },
  ],
  title: 'Panel Title',
  type: 'gauge',
};

export default gaugeStructure;
