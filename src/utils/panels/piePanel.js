const piePanel = {
  datasource: {
    type: 'grafana-postgresql-datasource',
    uid: 'P5E4ECD82955BB660'
  },
  fieldConfig: {
    defaults: {
      color: {
        mode: 'palette-classic'
      },
      custom: {
        hideFrom: {
          legend: false,
          tooltip: false,
          viz: false
        }
      },
      mappings: [],
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
    legend: {
      displayMode: 'list',
      placement: 'right',
      showLegend: true,
      values: ['percent']
    },
    pieType: 'pie',
    reduceOptions: {
      calcs: ['lastNotNull'],
      fields: '',
      values: false
    },
    tooltip: {
      mode: 'single',
      sort: 'none'
    }
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
  title: 'Pie Chart Panel',
  type: 'piechart',
};

export default piePanel;
