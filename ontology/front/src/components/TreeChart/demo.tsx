import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input } from '@arco-design/web-react';
import TreeChart from './index';
import mockData from './mock/data.json';

class Demo extends React.Component {
    constructor(props: any) {
        super(props);
        
        this.state = {
            data: []
        }
        this.treeChartRef = React.createRef();
    }
    getData() {
        let topicData = [];
        let lvlData = [];
        let sysData = [];
        let dbData = [];

        const formatNodes = (nodes, data) => {
            nodes.forEach(node => {
                const {
                    children,
                    ...options
                } = node;
                data.push({
                    key: options.name,
                    parent: options.parentId,
                    descr: options.label,
                    hasChildren: children.length > 0,
                    ...options
                });
                formatNodes(children, data);
            })
        }
        formatNodes(mockData.topic, topicData);
        formatNodes(mockData.lvl, lvlData);
        formatNodes(mockData.sys, sysData);
        formatNodes(mockData.db, dbData);
        this.setState({
            data: [
                { "key": "root", "name": "root", "label": "数据架构定义", "descr": "数据架构定义描述" },
                { "key": "topic", "name": "topic", "label": "主题", "descr": "主题描述", "parent": "root" },
                { "key": "lvl", "name": "lvl", "label": "层次", "descr": "层次描述", "parent": "root" },
                { "key": "sys", "name": "sys", "label": "系统", "descr": "系统描述", "parent": "root" },
                { "key": "db", "name": "db", "label": "数据库", "descr": "数据库描述", "parent": "root" },
                ...topicData,
                ...lvlData,
                ...sysData,
                ...dbData
            ]
        })
    }
    componentDidMount() {
        this.getData();
    }
    render() {
        return (
            <>
            <Form
                autoComplete='off'
                style={{ width: 600 }}>
                <Form.Item
                    label='Username'
                    field='name'
                    required={true}
                    requiredSymbol={false}>
                    <Input placeholder='please enter your username' />
                </Form.Item>
            </Form>
            <TreeChart
                ref={this.treeChartRef}
                data={this.state.data}
                style={{
                    width: '100%',
                    height: '100%'
                }}
                contextMenus={[
                    {
                        key: 'add',
                        label: '新增子节点',
                        event: function(node) {
                            console.log(node)
                        }
                    },
                    {
                        key: 'delete',
                        label: '删除节点',
                        event: function(node) {
                            console.log(node)
                        }
                    }
                ]}
                layoutType='TreeLayout'
                expand={true}
                heightFormatter={node => {
                    if (node.lvl === 0) {
                        return 48
                    } else if (node.lvl === 1) {
                        return 36
                    } else {
                        return 28
                    }
                }}
                bgFormatter={node => {
                    if (node.lvl === 0) {
                        return 'red'
                    }
                    if (node.lvl === 1) {
                        return 'green'
                    }
                    if (node.lvl === 2) {
                        return 'blue'
                    }
                    return '#f2f3f5'
                }}
                strokeFormatter={node => {
                    if (node.lvl === 0) {
                        return 'blue'
                    }
                    if (node.lvl === 1) {
                        return 'red'
                    }
                    if (node.lvl === 2) {
                        return 'green'
                    }
                    return 'transparent';
                }}
                colorFormatter={node => {
                    if (node.lvl <3 ) {
                        return 'white'
                    }
                    return 'black';
                }}/>
            </>
        )
    }
}

export default Demo;
