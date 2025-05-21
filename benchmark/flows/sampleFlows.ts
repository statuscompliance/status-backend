export const endpoint = '/status-bench' //Default endpoint

export const simpleFLow = {
    id: 'simple-flow-for-benchmarking',
    nodes: [
        {
            "id": "simple-flow-for-benchmarking",
            "type": "tab",
            "label": "Simple Flow",
            "disabled": false,
            "info": ""
        },
        {
            "id": "b3710bf91591b842",
            "type": "http in",
            "z": "f6f2187d.f17ca8",
            "name": "",
            "url": `${endpoint}`,
            "method": "post",
            "upload": true,
            "swaggerDoc": "",
            "x": 370,
            "y": 220,
            "wires": [
                [
                    "b0370a0b816c2fec",
                    "5326394c0ab6799a"
                ]
            ]
        },
        {
            "id": "b0370a0b816c2fec",
            "type": "http response",
            "z": "f6f2187d.f17ca8",
            "name": "",
            "statusCode": "200",
            "headers": {
                "content-type": "application/json"
            },
            "x": 600,
            "y": 220,
            "wires": []
        },
        {
            "id": "5326394c0ab6799a",
            "type": "debug",
            "z": "f6f2187d.f17ca8",
            "name": "debug",
            "active": true,
            "tosidebar": true,
            "console": true,
            "tostatus": false,
            "complete": "payload",
            "targetType": "msg",
            "statusVal": "",
            "statusType": "auto",
            "x": 600,
            "y": 260,
            "wires": []
        }
    ]
}

export const sampleStatusFlow1 = {
    id: 'status-flow-for-benchmarking',
    nodes: [
        {
            "id": 'status-flow-for-benchmarking',
            "type": "tab",
            "label": "Sample Status Flow",
            "disabled": false,
            "info": ""
        },
        {
            "id": "266973c462ef61d2",
            "type": "http in",
            "z": "42624b25971caa43",
            "name": "",
            "url": `${endpoint}`,
            "method": "post",
            "upload": true,
            "swaggerDoc": "",
            "x": 310,
            "y": 420,
            "wires": [
                [
                    "61ef8b783cae205b",
                    "634ffa001d6fb61d"
                ]
            ]
        },
        {
            "id": "61ef8b783cae205b",
            "type": "http response",
            "z": "42624b25971caa43",
            "name": "",
            "statusCode": "200",
            "headers": {},
            "x": 520,
            "y": 400,
            "wires": []
        },
        {
            "id": "440514791abf050b",
            "type": "debug",
            "z": "42624b25971caa43",
            "name": "debug 1",
            "active": true,
            "tosidebar": true,
            "console": true,
            "tostatus": false,
            "complete": "payload",
            "targetType": "msg",
            "statusVal": "",
            "statusType": "auto",
            "x": 1050,
            "y": 440,
            "wires": []
        },
        {
            "id": "634ffa001d6fb61d",
            "type": "find-object",
            "z": "42624b25971caa43",
            "name": "",
            "key": "message",
            "keyValue": "Another test message.",
            "params": {
                "key": "string",
                "keyValue": "string"
            },
            "x": 530,
            "y": 440,
            "wires": [
                [
                    "d895b5e1413edc39"
                ]
            ]
        },
        {
            "id": "d895b5e1413edc39",
            "type": "exists-pipe",
            "z": "42624b25971caa43",
            "count": "2",
            "storeEvidences": true,
            "params": {
                "count": "number"
            },
            "x": 690,
            "y": 440,
            "wires": [
                [
                    "c629de759f8857f5"
                ]
            ]
        },
        {
            "id": "c629de759f8857f5",
            "type": "get-property-value",
            "z": "42624b25971caa43",
            "name": "",
            "propertyToGet": "message",
            "params": {
                "propertyToGet": "string"
            },
            "x": 870,
            "y": 440,
            "wires": [
                [
                    "440514791abf050b"
                ]
            ]
        }
    ]
}

export const sampleStatusFlow2 = {
    id: 'status-flow-for-benchmarking',
    nodes: [
        {
            "id": "status-flow-for-benchmarking",
            "type": "tab",
            "label": "Sample Status Flow",
            "disabled": false,
            "info": ""
        },
        {
            "id": "266973c462ef61d2",
            "type": "http in",
            "z": "42624b25971caa43",
            "name": "",
            "url": "/status-bench",
            "method": "post",
            "upload": true,
            "swaggerDoc": "",
            "x": 290,
            "y": 420,
            "wires": [
                [
                    "61ef8b783cae205b",
                    "529c633f7a96df29"
                ]
            ]
        },
        {
            "id": "61ef8b783cae205b",
            "type": "http response",
            "z": "42624b25971caa43",
            "name": "",
            "statusCode": "200",
            "headers": {},
            "x": 480,
            "y": 400,
            "wires": []
        },
        {
            "id": "440514791abf050b",
            "type": "debug",
            "z": "42624b25971caa43",
            "name": "debug 1",
            "active": true,
            "tosidebar": true,
            "console": true,
            "tostatus": false,
            "complete": "payload",
            "targetType": "msg",
            "statusVal": "",
            "statusType": "auto",
            "x": 870,
            "y": 440,
            "wires": []
        },
        {
            "id": "94dd783349eef286",
            "type": "get-property-value",
            "z": "42624b25971caa43",
            "name": "",
            "propertyToGet": "status",
            "params": {
                "propertyToGet": "string"
            },
            "x": 690,
            "y": 440,
            "wires": [
                [
                    "440514791abf050b"
                ]
            ]
        },
        {
            "id": "529c633f7a96df29",
            "type": "find-object",
            "z": "42624b25971caa43",
            "name": "",
            "key": "message",
            "keyValue": "Hello, this is a test message.",
            "params": {
                "key": "string",
                "keyValue": "string"
            },
            "x": 490,
            "y": 440,
            "wires": [
                [
                    "94dd783349eef286"
                ]
            ]
        }
    ]
}
