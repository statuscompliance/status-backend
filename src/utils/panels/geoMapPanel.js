const geoMapPanel = {
  'datasource': {
    'type': 'grafana-postgresql-datasource',
    'uid': 'P5E4ECD82955BB660'
  },
  'fieldConfig': {
    'defaults': {
      'color': {
        'mode': 'thresholds'
      },
      'custom': {
        'hideFrom': {
          'legend': false,
          'tooltip': false,
          'viz': false
        }
      },
      'mappings': [],
      'thresholds': {
        'mode': 'absolute',
        'steps': [
          {
            'color': 'green',
            'value': null
          },
          {
            'color': 'red',
            'value': 80
          }
        ]
      },
      'displayName': 'Value'
    },
    'overrides': []
  },
  'gridPos': {
    'h': 8,
    'w': 12,
    'x': 0,
    'y': 0
  },
  'options': {
    'basemap': {
      'config': {
        'server': 'streets',
        'showLabels': true,
        'theme': 'auto'
      },
      'name': 'Layer 0',
      'type': 'default'
    },
    'controls': {
      'mouseWheelZoom': true,
      'showAttribution': true,
      'showDebug': false,
      'showMeasure': false,
      'showScale': false,
      'showZoom': true
    },
    'layers': [
      {
        'config': {
          'showLegend': false,
          'style': {
            'color': {
              'fixed': 'dark-green'
            },
            'opacity': 0.6,
            'rotation': {
              'fixed': 0,
              'max': 360,
              'min': -360,
              'mode': 'mod'
            },
            'size': {
              'fixed': 40,
              'max': 15,
              'min': 2
            },
            'symbol': {
              'fixed': 'img/icons/marker/circle.svg',
              'mode': 'fixed'
            },
            'symbolAlign': {
              'horizontal': 'center',
              'vertical': 'center'
            },
            'text': {
              'field': 'name',
              'fixed': '',
              'mode': 'field'
            },
            'textConfig': {
              'fontSize': 17,
              'offsetX': 0,
              'offsetY': 0,
              'textAlign': 'center',
              'textBaseline': 'middle'
            }
          }
        },
        'location': {
          'mode': 'auto'
        },
        'name': '% Compliance',
        'tooltip': true,
        'type': 'markers'
      }
    ],
    'tooltip': {
      'mode': 'details'
    },
    'view': {
      'allLayers': true,
      'id': 'coords',
      'lat': 37.378288,
      'lon': -5.07982,
      'zoom': 7.35
    }
  },
  'targets': [
    {
      'datasource': {
        'type': 'grafana-postgresql-datasource',
        'uid': 'P5E4ECD82955BB660'
      },
      'refId': 'A',
      'format': 'table',
      'rawSql': 'SELECT latitude, longitude, value, name FROM map_points LIMIT 50 ',
      'editorMode': 'builder',
      'sql': {
        'columns': [
          {
            'parameters': [
              {
                'name': 'latitude',
                'type': 'functionParameter'
              }
            ],
            'type': 'function'
          },
          {
            'parameters': [
              {
                'name': 'longitude',
                'type': 'functionParameter'
              }
            ],
            'type': 'function'
          },
          {
            'parameters': [
              {
                'name': 'value',
                'type': 'functionParameter'
              }
            ],
            'type': 'function'
          },
          {
            'parameters': [
              {
                'name': 'name',
                'type': 'functionParameter'
              }
            ],
            'type': 'function'
          }
        ],
        'groupBy': [
          {
            'property': {
              'type': 'string'
            },
            'type': 'groupBy'
          }
        ],
        'limit': 50
      },
      'table': 'map_points'
    }
  ],
  'title': 'GeoMap Panel',
  'type': 'geomap'
};

export default geoMapPanel;
