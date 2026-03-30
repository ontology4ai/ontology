export default {
	nodes: [
        {
            id: 'node-1',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 0,
                label: '对象1'
            },
            position: { x: 50, y: 100 },
        },
        {
            id: 'node-2',
            type: 'node',
            data: {
                type: 'action',
                label: '动作1'
            },
            position: { x: 350, y: 100 },
        },
        {
            id: 'node-3',
            type: 'node',
            data: {
                type: 'logic',
                label: '逻辑1'
            },
            position: { x: 650, y: 100 },
        },
        {
            id: 'node-4',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 0,
                dataLoadStatus: 0,
                dataLoadPercent: 20,
                label: '对象2'
            },
            position: { x: 50, y: 250 },
        },
        {
            id: 'node-4-1',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 0,
                dataLoadStatus: 1,
                label: '对象2-1'
            },
            position: { x: 350, y: 250 },
        },
        {
            id: 'node-5',
            type: 'node',
            data: {
                type: 'action',
                label: '动作2'
            },
            position: { x: 650, y: 250 },
        },
        {
            id: 'node-6',
            type: 'node',
            data: {
                type: 'logic',
                label: '逻辑2'
            },
            position: { x: 950, y: 250 },
        },
        {
            id: 'node-7',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                status: '3',
                label: '对象3'
            },
            position: { x: 50, y: 400 },
        },
        {
            id: 'node-8',
            type: 'node',
            data: {
                type: 'action',
                label: '动作3'
            },
            position: { x: 350, y: 400 },
        },
        {
            id: 'node-9',
            type: 'node',
            data: {
                type: 'logic',
                label: '逻辑3'
            },
            position: { x: 650, y: 400 },
        },
        {
            id: 'node-10',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                animated: true,
                label: '对象4'
            },
            position: { x: 50, y: 550 },
        },
        {
            id: 'node-11',
            type: 'node',
            data: {
                type: 'action',
                animated: true,
                label: '动作4'
            },
            position: { x: 350, y: 550 },
        },
        {
            id: 'node-12',
            type: 'node',
            data: {
                type: 'logic',
                animated: true,
                label: '逻辑4'
            },
            position: { x: 650, y: 550 },
        },
        {
            id: 'node-13',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                executionStatus: 1,
                label: '对象5'
            },
            position: { x: 50, y: 700 },
        },
        {
            id: 'node-14',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                executionStatus: 2,
                label: '对象6'
            },
            position: { x: 350, y: 700 },
        },
        {
            id: 'node-15',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                executionStatus: 3,
                label: '对象7'
            },
            position: { x: 650, y: 700 },
        },
        {
            id: 'node-16',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                executionStatus: 4,
                label: '对象8'
            },
            position: { x: 50, y: 850 },
        },
        {
            id: 'node-17',
            type: 'node',
            data: {
                type: 'object',
                dataStatus: 1,
                executionStatus: 5,
                label: '对象9'
            },
            position: { x: 350, y: 850 },
        },
    ],
    edges: [
    	{
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            animated: true,
            // type: 'smoothstep',
            sourceHandle: 'port-3',
            targetHandle: 'port-1',
            style: {
                stroke: 'var(--color-primary-6)'
            }
        },
        {
            id: 'edge-2',
            source: 'node-1',
            target: 'node-5',
            animated: true,
            // type: 'smoothstep',
            sourceHandle: 'port-3',
            targetHandle: 'port-1',
            style: {
                stroke: 'var(--color-primary-6)'
            }
        }
    ]
}