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
                    label="标题"
                    field="options.titleBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.title"
                            noStyle>
                            <Input
                                size="mini"/>
                            </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="内容"
                    field="options.contentBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.content"
                            noStyle>
                            <Input
                                size="mini"/>
                            </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="图标"
                    field="options.icon">
                    <IconSelect />
                </Form.Item>
                 <Form.Item
                    label="警告类型"
                    field="options.type">
                    <Select
                        options={[
                            { value: 'info', label: '信息' },
                            { value: 'success', label: '成功' },
                            { value: 'warning', label: '警告' },
                            { value: 'error', label: '错误' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="是否用作顶部公告"
                    field="options.banner"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="是否可关闭"
                    field="options.closable"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="是否显示图标"
                    field="options.showIcon"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="关闭的回调"
                    field="options.onCloseBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="关闭动画结束后执行的回调"
                    field="options.afterCloseBindVar">
                    <BindVar size="mini">
                        编写函数
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
