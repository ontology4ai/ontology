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
                    label="上传地址"
                    field="options.action">
                    <Input size='small'/>
                </Form.Item>
                <Form.Item
                    label="上传时使用的headers"
                    field="options.headersBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>编写headers</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="上传时的body参数"
                    field="options.dataBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>编写body</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="是否选中文件后自动上传"
                    field="options.autoUpload"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="文件夹上传"
                    field="options.directory"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="是否拖拽上传"
                    field="options.drag">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="是否支持文件多选"
                    field="options.multiple"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="上传请求是否携带cookie"
                    field="options.withCredentials"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="接收上传的类型"
                    field="options.accept">
                    <Input size='small'/>
                </Form.Item>
                <Form.Item
                    label="展示类型"
                    field="options.listType">
                    <Select
                        size='small'
                        options={[
                            'text',
                            'picture-list',
                            'picture-card'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="提示文字"
                    field="options.tipBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            label="提示文字"
                            field="options.tip"
                            noStyle>
                            <Input size='small'/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="限制上传数量"
                    field="options.limit">
                    <InputNumber size='small'/>
                </Form.Item>
                <Form.Item
                    label="是否展示上传文件列表"
                    field="options.showUploadList"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="自定义上传"
                    field="options.customRequestBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>编写函数</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="上传文件之前的回调"
                    field="options.beforeUploadBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>编写函数</span>
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
