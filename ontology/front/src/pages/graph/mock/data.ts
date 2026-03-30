export default {
	nodes: [
        {
        	id: 'logic-1',
        	data: {
        		type: 'logic',
        		label: '逻辑名称1',
        		relObjectNum: 2,
        	},
        },
        {
            id: 'logic-2',
            data: {
                type: 'logic',
                label: '逻辑名称2',
                relObjectNum: 2,
            },
        },
        {
            id: 'logic-3',
            data: {
                type: 'logic',
                label: '逻辑名称3',
                relObjectNum: 2,
            },
        },
        {
            id: 'object-1',
            data: {
            	type: 'object',
                label: '对象名称1',
                attrNum: 10,
                instNum: 100,
                relNum: 3,
                funcNum: 5,
                actionNum: 2,
                expand: false,
                attributes: [
                    {
                        name: 'attr1',
                        label: '属性名称1',
                        isPrimary: 1
                    },
                    {
                        name: 'attr2',
                        label: '属性名称2',
                        isTitle: 1
                    }
                ]
            }
        },
        {
            id: 'object-2',
            data: {
                type: 'object',
                label: '对象名称2',
                attrNum: 10,
                instNum: 100,
                relNum: 3,
                funcNum: 5,
                actionNum: 2,
                expand: false,
                attributes: [
                    {
                        name: 'attr1',
                        label: '属性名称1',
                        isPrimary: 1
                    },
                    {
                        name: 'attr2',
                        label: '属性名称2',
                        isTitle: 1
                    }
                ]
            }
        },
        {
            id: 'object-3',
            data: {
                type: 'object',
                label: '对象名称3',
                attrNum: 10,
                instNum: 100,
                relNum: 3,
                funcNum: 5,
                actionNum: 2,
                expand: false,
                attributes: [
                    {
                        name: 'attr1',
                        label: '属性名称1',
                        isPrimary: 1
                    },
                    {
                        name: 'attr2',
                        label: '属性名称2',
                        isTitle: 1
                    }
                ]
            }
        },
        {
            id: 'object-4',
            data: {
                type: 'object',
                label: '对象名称4',
                attrNum: 10,
                instNum: 100,
                relNum: 3,
                funcNum: 5,
                actionNum: 2,
                expand: false,
                attributes: [
                    {
                        name: 'attr1',
                        label: '属性名称1',
                        isPrimary: 1
                    },
                    {
                        name: 'attr2',
                        label: '属性名称2',
                        isTitle: 1
                    }
                ]
            }
        },
        {
            id: 'action-1',
            data: {
                type: 'action',
                label: '动作名称1',
                relObjectNum: 2,
            },
        },
        {
            id: 'action-2',
            data: {
                type: 'action',
                label: '动作名称2',
                relObjectNum: 2,
            },
        },
        {
            id: 'interface-1',
            data: {
                type: 'interface',
                label: '接口名称1',
                relObjectNum: 2,
            },
        },
    ],
    edges: [
        {
            source: 'logic-2',
            target: 'object-1',
            data: {
                text: '引用'
            },
            style: { targetPort: 'attr1-field-port-left' }
        },
        {
            source: 'object-1',
            target: 'object-4',
            data: {
                text: ''
            }
        },
        {
            source: 'object-4',
            target: 'action-1',
            data: {
                text: '新增'
            }
        },
        {
            source: 'object-1',
            target: 'object-2',
            data: {
                text: '...'
            }
        },
        {
            source: 'object-2',
            target: 'logic-3',
            data: {
                text: '引用'
            }
        },
        {
            source: 'object-3',
            target: 'interface-1',
            data: {
                text: '继承'
            }
        },
        {
            source: 'object-3',
            target: 'action-2',
            data: {
                text: '修改'
            }
        }
    ]
}