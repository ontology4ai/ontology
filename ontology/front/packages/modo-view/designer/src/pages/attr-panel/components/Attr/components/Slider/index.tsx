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
                    label=" 是否展示输入框"
                    field="options.showInput"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="只能选择标签值"
                    field="options.onlyMarkValue"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="反向坐标轴"
                    field="options.reverse"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="是否显示步长刻度线"
                    field="options.showTicks"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="控制tooltip的展示"
                    field="options.tooltipVisible"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="是否竖直方向"
                    field="options.vertical"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="滑动范围最大值"
                    field="options.max">
                    <InputNumber size="small"/>
                </Form.Item>
                <Form.Item
                    label="滑动范围最小值"
                    field="options.max">
                    <InputNumber size="small"/>
                </Form.Item>
                <Form.Item
                    label="步长"
                    field="options.step">
                    <InputNumber size="small"/>
                </Form.Item>
                <Form.Item
                    label="tooltip的位置"
                    field="options.tooltipPosition">
                    <Select
                        size="small"
                        options={[
                            'top',
                            'tl',
                            'tr',
                            'bottom',
                            'bl',
                            'br',
                            'left',
                            'lt',
                            'lb',
                            'right',
                            'rt',
                            'rb'
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
