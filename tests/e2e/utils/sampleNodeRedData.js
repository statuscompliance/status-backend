export const endpoint = '/status-test'

export const testFlow = {
  id: 'test-flow',
  label: 'Echo Test Flow',
  nodes: [
    {
      'id': 'test-flow',
      'type': 'tab',
      'label': 'Echo Test Flow',
      'disabled': false,
      'info': ''
    },
    {
      'id': 'b3710bf91591b842',
      'type': 'http in',
      'z': 'f6f2187d.f17ca8',
      'name': '',
      'url': endpoint,
      'method': 'post',
      'upload': true,
      'swaggerDoc': '',
      'x': 370,
      'y': 220,
      'wires': [
        [
          'b0370a0b816c2fec',
          '5326394c0ab6799a'
        ]
      ]
    },
    {
      'id': 'b0370a0b816c2fec',
      'type': 'http response',
      'z': 'f6f2187d.f17ca8',
      'name': '',
      'statusCode': '200',
      'headers': {
        'content-type': 'application/json'
      },
      'x': 600,
      'y': 220,
      'wires': []
    },
    {
      'id': '5326394c0ab6799a',
      'type': 'debug',
      'z': 'f6f2187d.f17ca8',
      'name': 'debug',
      'active': true,
      'tosidebar': true,
      'console': true,
      'tostatus': false,
      'complete': 'payload',
      'targetType': 'msg',
      'statusVal': '',
      'statusType': 'auto',
      'x': 600,
      'y': 260,
      'wires': []
    }
  ]
};

export const updatedFlow = {
  id: 'updated-flow',
  label: 'Updated Echo Test Flow',
  nodes: [
    {
      'id': 'updated-flow',
      'type': 'tab',
      'label': 'Updated Echo Test Flow',
      'disabled': false,
      'info': ''
    },
    {
      'id': '266973c462ef61d2',
      'type': 'http in',
      'z': '42624b25971caa43',
      'name': '',
      'url': endpoint,
      'method': 'post',
      'upload': true,
      'swaggerDoc': '',
      'x': 310,
      'y': 420,
      'wires': [
        [
          '61ef8b783cae205b',
          '634ffa001d6fb61d'
        ]
      ]
    },
    {
      'id': '61ef8b783cae205b',
      'type': 'http response',
      'z': '42624b25971caa43',
      'name': '',
      'statusCode': '200',
      'headers': {},
      'x': 520,
      'y': 400,
      'wires': []
    },
    {
      'id': '440514791abf050b',
      'type': 'debug',
      'z': '42624b25971caa43',
      'name': 'debug 1',
      'active': true,
      'tosidebar': true,
      'console': true,
      'tostatus': false,
      'complete': 'payload',
      'targetType': 'msg',
      'statusVal': '',
      'statusType': 'auto',
      'x': 1050,
      'y': 440,
      'wires': []
    },
    {
      'id': '634ffa001d6fb61d',
      'type': 'find-object',
      'z': '42624b25971caa43',
      'name': '',
      'key': 'message',
      'keyValue': 'Another test message.',
      'params': {
        'key': 'string',
        'keyValue': 'string'
      },
      'x': 530,
      'y': 440,
      'wires': [
        [
          'd895b5e1413edc39'
        ]
      ]
    },
    {
      'id': 'd895b5e1413edc39',
      'type': 'exists-pipe',
      'z': '42624b25971caa43',
      'count': '2',
      'storeEvidences': true,
      'params': {
        'count': 'number'
      },
      'x': 690,
      'y': 440,
      'wires': [
        [
          'c629de759f8857f5'
        ]
      ]
    },
    {
      'id': 'c629de759f8857f5',
      'type': 'get-property-value',
      'z': '42624b25971caa43',
      'name': '',
      'propertyToGet': 'message',
      'params': {
        'propertyToGet': 'string'
      },
      'x': 870,
      'y': 440,
      'wires': [
        [
          '440514791abf050b'
        ]
      ]
    }
  ]
};
