import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select, InputNumber } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';


class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
        this.formRef = React.createRef();
    }
    onValuesChange = (changeValue, values) => {
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: this.formRef.current.getFieldsValue()
        })
    };
    componentDidUpdate(prevProps) {
        const { nodes, activeNodeKey, node } = this.props;
        const prevNode = prevProps.nodes.byId[prevProps.activeNodeKey];
        if (!_.isEqual(prevNode, node)) {
            this.formRef.current.setFieldsValue(node);
        }
    }
    render() {
        /*
        labelCol={{
            flex: '100px',
        }}
        wrapperCol={{
            flex: '1'
        }}
        */
        const {
            activeNodeKey,
            nodes,
            node,
            ...rest
        } = this.props;

        const { current } = this.formRef;

        return (
            <Form
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="是否支持搜索"
                    field="options.showSearch"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="是否支持多选"
                    field="options.treeCheckable"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="显示标签个数"
                    field="options.maxTagCount">
                    <InputNumber
                        placeholder=''
                        min={0}
                        max={15}
                        style={{ width: 270 }}
                      />
                </Form.Item>
                <Form.Item
                    label="父子节点是否关联"
                    field="options.treeCheckStrictly"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="数据"
                    field="options.dataBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="自定义字段名称"
                    field="options.fieldNames">
                    <Form.Item
                        label="key"
                        field="options.fieldNames.key">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="title"
                        field="options.fieldNames.title">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="children"
                        field="options.fieldNames.children">
                        <Input />
                    </Form.Item>
                </Form.Item>
            </Form>
        );
    }
}

export default connect((state, ownProps) => {
    const { nodes, activeNodeKey} = state;
    const node = nodes.byId[activeNodeKey];
    return {
        node,
        nodes,
        activeNodeKey
    }
})(Attr);
