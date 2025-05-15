const timeseriesPanel = {
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
        axisCenteredZero: false,
        axisColorMode: 'text',
        axisLabel: '',
        axisPlacement: 'auto',
        barAlignment: 0,
        drawStyle: 'line',
        fillOpacity: 0,
        gradientMode: 'none',
        hideFrom: {
          legend: false,
          tooltip: false,
          viz: false
        },
        lineInterpolation: 'linear',
        lineWidth: 1,
        pointSize: 5,
        scaleDistribution: {
          type: 'linear'
        },
        showPoints: 'auto',
        spanNulls: false,
        stacking: {
          group: 'A',
          mode: 'none'
        },
        thresholdsStyle: {
          mode: 'off'
        }
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
    legend: {
      calcs: [],
      displayMode: 'list',
      placement: 'bottom',
      showLegend: true
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
  title: 'Timeseries Panel',
  type: 'timeseries',
};

export default timeseriesPanel;
