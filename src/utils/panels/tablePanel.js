const tablePanel = {
  datasource: {
    type: 'grafana-postgresql-datasource',
    uid: 'P5E4ECD82955BB660'
  },
  fieldConfig: {
    defaults: {
      color: {
        mode: 'thresholds'
      },
      custom: {
        align: 'auto',
        cellOptions: {
          type: 'auto'
        },
        filterable: true,
        inspect: false
      },
      mappings: [],
      thresholds: {
        mode: 'absolute',
        steps: [
          {
            color: 'green',
            value: null
          },
          {
            color: 'red',
            value: 80
          }
        ]
      },
      displayName: 'Value'
    },
    overrides: []
  },
  gridPos: {
    h: 8,
    w: 12,
    x: 0,
    y: 0
  },
  options: {
    cellHeight: 'sm',
    footer: {
      countRows: false,
      fields: '',
      reducer: ['sum'],
      show: false
    },
    showHeader: true
  },
  targets: [
    {
      'datasource': {
        'type': 'grafana-postgresql-datasource',
        'uid': 'P5E4ECD82955BB660'
      },
      'refId': 'A',
      'format': 'table',
      'rawSql': 'SELECT "agreementId", "guaranteeValue", "timestamp", scope FROM "Points" LIMIT 50 ',
      'editorMode': 'builder',
      'sql': {
        'columns': [
          {
            'type': 'function',
            'parameters': [
              {
                'type': 'functionParameter',
                'name': '"agreementId"'
              }
            ]
          },
          {
            'type': 'function',
            'parameters': [
              {
                'type': 'functionParameter',
                'name': '"guaranteeValue"'
              }
            ]
          },
          {
            'type': 'function',
            'parameters': [
              {
                'type': 'functionParameter',
                'name': '"timestamp"'
              }
            ]
          },
          {
            'type': 'function',
            'parameters': [
              {
                'type': 'functionParameter',
                'name': 'scope'
              }
            ]
          }
        ],
        'groupBy': [
          {
            'type': 'groupBy',
            'property': {
              'type': 'string'
            }
          }
        ],
        'limit': 50
      },
      'table': '"Points"'
    }
  ],
  title: 'Table Panel',
  type: 'table',
};

export default tablePanel;
