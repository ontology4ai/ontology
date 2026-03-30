import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
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
                    label="百分比"
                    field="options.percentBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.percent"
                            noStyle>
                            <InputNumber size="mini"/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="动画效果"
                    field="options.animation"
                    triggerPropName="checked">
                    <Switch type="round"/>
                </Form.Item>
                <Form.Item
                    label="是否显示缓冲区"
                    field="options.buffer"
                    triggerPropName="checked">
                    <Switch type="round"/>
                </Form.Item>
                <Form.Item
                    label="是否展示文本"
                    field="options.showText"
                    triggerPropName="checked">
                    <Switch type="round"/>
                </Form.Item>
                <Form.Item
                    label="显示步骤进度条"
                    field="options.steps">
                    <InputNumber size="mini"/>
                </Form.Item>
                <Form.Item
                    label="进度条线得宽度"
                    field="options.strokeWidth">
                    <InputNumber size="mini"/>
                </Form.Item>
                <Form.Item
                    label="剩余进度条得颜色"
                    field="options.trailColor">
                    <Input size="mini"/>
                </Form.Item>
                <Form.Item
                    label="尺寸"
                    field="options.size">
                    <Select
                        size="mini"
                        options={[
                            'small',
                            'default',
                            'mini',
                            'large'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="状态"
                    field="options.status">
                    <Select
                        size="mini"
                        options={[
                            'success',
                            'error',
                            'normal',
                            'warning'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="进度条类型"
                    field="options.type">
                    <Select
                        size="mini"
                        options={[
                            'line',
                            'circle'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="饼状进度条线得宽度"
                    field="options.width">
                    <InputNumber size="mini"/>
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
