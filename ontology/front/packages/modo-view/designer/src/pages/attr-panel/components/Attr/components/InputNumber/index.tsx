import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select, InputNumber } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import IconSelect from '@/components/IconSelect';


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
                    label="最大值"
                    field="options.max">
                    <InputNumber size='small'/>
                </Form.Item>
                <Form.Item
                    label="最小值"
                    field="options.min">
                    <InputNumber size='small'/>
                </Form.Item>
                <Form.Item
                    label="精度"
                    field="options.precision">
                    <InputNumber size='small'/>
                </Form.Item>
                <Form.Item
                    label="数字变化步长"
                    field="options.step">
                    <InputNumber size='small'/>
                </Form.Item>
                <Form.Item
                    label="隐藏右侧按钮"
                    field="options.hideControl"
                    triggerPropName="checked">
                    <Switch size='small' type="round"/>
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
