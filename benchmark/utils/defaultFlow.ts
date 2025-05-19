export const endpoint = '/vitest-bench'
export const flowId = 'test-flow-for-benchmarking'
export const nodes = [
    {
        "id": "f6f2187d.f17ca8",
        "type": "tab",
        "label": "Flow 1",
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
