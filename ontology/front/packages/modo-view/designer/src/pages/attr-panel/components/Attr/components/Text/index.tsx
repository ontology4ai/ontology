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
                    label="粗体"
                    field="options.bold"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="代码块样式"
                    field="options.code"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="删除线样式"
                    field="options.delete"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="禁用状态"
                    field="options.disabled"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="下划线样式"
                    field="options.underline"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="自动溢出省略"
                    field="options.ellipsis"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="标记样式"
                    field="options.mark"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                 <Form.Item
                    label="开启复制功能"
                    field="options.copyable"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="文本类型"
                    field="options.type">
                    <Select
                        options={[
                            'primary',
                            'secondary',
                            'success',
                            'error',
                            'warning'
                        ]}/>
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
