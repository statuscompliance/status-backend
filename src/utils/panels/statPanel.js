const statPanel = {
  datasource: {
    type: 'grafana-postgresql-datasource',
    uid: 'P5E4ECD82955BB660'
  },
  fieldConfig: {
    defaults: {
      color: {
        mode: 'thresholds'
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
    colorMode: 'value',
    graphMode: 'area',
    justifyMode: 'auto',
    orientation: 'auto',
    reduceOptions: {
      calcs: ['lastNotNull'],
      fields: '',
      values: false
    },
    textMode: 'auto'
  },
  pluginVersion: '10.0.3',
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
  title: 'Stat Panel',
  type: 'stat',
};

export default statPanel;
