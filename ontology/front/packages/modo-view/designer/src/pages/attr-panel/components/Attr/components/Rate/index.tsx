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
                    label="默认值"
                    field="options.defaultValueBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            label="默认值"
                            field="options.defaultValue"
                            noStyle>
                            <Input size='small'/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="绑定值（不在表单内时可以绑定）"
                    field="options.valueBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.value"
                            noStyle>
                            <Input/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="只读"
                    field="options.readonly"
                    triggerPropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item
                    label="是否允许半选"
                    field="options.allowHalf"
                    triggerPropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item
                    label="是否允许清除"
                    field="options.allowClear"
                    triggerPropName="checked">
                    <Switch />
                </Form.Item>
                <Form.Item
                    label="星的总数"
                    field="options.count">
                    <InputNumber size='small'/>
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
