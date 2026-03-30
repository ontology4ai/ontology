import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select } from "@arco-design/web-react";
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
                    label="按钮类型"
                    field="options.type">
                    <Select
                        options={[
                            { value: 'default', label: '默认按钮' },
                            { value: 'primary', label: '主要按钮' },
                            { value: 'secondary', label: '次级按钮' },
                            { value: 'dashed', label: '虚框按钮' },
                            { value: 'text', label: '文字按钮' },
                            { value: 'outline', label: '线性按钮' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="尺寸"
                    field="options.size">
                    <Select
                        options={[
                            { value: 'mini', label: 'mini' },
                            { value: 'small', label: 'small' },
                            { value: 'default', label: 'default' },
                            { value: 'large', label: 'large' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="按钮状态"
                    field="options.status">
                    <Select
                        options={[
                            { value: 'default', label: '默认' },
                            { value: 'warning', label: '警告' },
                            { value: 'danger', label: '危险' },
                            { value: 'success', label: '成功' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="按钮图标"
                    field="options.icon">
                    <IconSelect/>
                </Form.Item>
                <Form.Item
                    label="只显示图标"
                    field="options.iconOnly"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="禁用"
                    field="options.disabledBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.disabled"
                            triggerPropName="checked"
                            noStyle>
                            <Switch type="round" size="small"/>
                        </Form.Item>
                    </BindVar>
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
