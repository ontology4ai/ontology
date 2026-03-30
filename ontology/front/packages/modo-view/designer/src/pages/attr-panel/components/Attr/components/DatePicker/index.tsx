import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select } from "@arco-design/web-react";
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
                    label="是否显示时间"
                    field="options.showTime"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="显示格式"
                    field="options.format">
                    <Input
                        size="mini"/>
                </Form.Item>
                <Form.Item
                    label="模式"
                    field="options.mode">
                    <Select
                        size="mini"
                        options={[
                            { value: 'date', label: '日期' },
                            { value: 'month', label: '月' },
                            { value: 'year', label: '年' },
                            { value: 'week', label: '周' },
                            { value: 'quarter', label: '季度' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="允许清除"
                    field="options.allowClear"
                    triggerPropName="checked">
                    <Switch size='small'/>
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
