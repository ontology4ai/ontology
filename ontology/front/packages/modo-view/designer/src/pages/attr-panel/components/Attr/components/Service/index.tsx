import React, { useState, useEffect, useMemo, createRef} from 'react';
import { connect } from 'react-redux';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import Editor from '@/components/Editor';
import { Tabs, Typography, Form, Button, Input, Switch, Radio, Select } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import './style/index.less';

const TabPane = Tabs.TabPane;

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            servicePanelVisible: false
        };
        this.formRef = React.createRef();
        this.callbackFormRef = React.createRef();
    }
    handleSaveService = () => {
        this.props.onSave({
            ...this.formRef.current.getFieldsValue(),
            callback: this.callbackFormRef.current.getFieldValue('callback')
        });
        this.props.onClose();
    };
    handleCloseServicePanel = () => {
        this.props.onClose();
    };
    componentDidUpdate = (prevProps) => {
    };
    setFieldsValue = (values) => {
        this.formRef.current.setFieldsValue(values);
        this.callbackFormRef.current.setFieldsValue({
            callback: values.callback
        });
    };
    getFieldsValue = (values) => {
        return {
            ...this.formRef.current.getFieldsValue(),
            callback: this.callbackFormRef.current.getFieldValue('callback')
        };
    };
    render() {
        const {
            onClose,
            appServices,
            appServiceMap,
            mask,
            visible,
            style
        } = this.props;

        const { current } = this.formRef;

        return (
            <Panel
                style={{
                    width: '400px',
                    left: '300px',
                    top: '50px',
                    height: 'calc(100% - 50px)',
                    ...style
                }}
                title="编辑服务"
                mask={mask}
                visible={visible}
                onClose={onClose}
                onSave={this.handleSaveService}
                onCancel={onClose}>
                <Tabs
                    className="service-attr-tabs"
                    defaultActiveTab="callback"
                    lazyload={false}>
                    <TabPane key="callback" title="回调函数">
                        <Form
                            ref={this.callbackFormRef}
                            layout="vertical">
                            <Form.Item
                                label="回调函数"
                                field="callback"
                                noStyle>
                                <Editor
                                    height="calc(100% - 2px)"/>
                            </Form.Item>
                        </Form>
                    </TabPane>
                    <TabPane
                        key="service"
                        title="服务">
                        <Form
                            ref={this.formRef}
                            layout="vertical"
                            onValuesChange={(_, values) => {
                                if (_.hasOwnProperty('url')) {
                                    if (appServiceMap[_.url]) {
                                        this.formRef.current.setFieldValue('type', appServiceMap[_.url].methodType);
                                        if (!values.placeholders) {
                                            this.formRef.current.setFieldValue('placeholders', JSON.stringify(appServiceMap[_.url].placeholders.map(placeholder => {
                                                return {
                                                    key: placeholder,
                                                    value: null
                                                }
                                            }), null, 4));
                                        }
                                        const placeholders = this.formRef.current.getFieldValue('placeholders');
                                        if (Array.isArray(placeholders)) {
                                            this.formRef.current.setFieldValue('placeholders', JSON.stringify(placeholders, null, 4));
                                        }
                                    }
                                }
                            }}>
                            <Form.Item
                                label="方法名"
                                field="name">
                                <Input size="mini"/>
                            </Form.Item>
                            <Form.Item
                                label="变量名(响应数据赋值)"
                                field="stateName">
                                <Input size="mini"/>
                            </Form.Item>
                            <Form.Item
                                label="描述"
                                field="descr">
                                <Input size="mini"/>
                            </Form.Item>
                            {!this.props.autoLoadHidden && <Form.Item
                                label="自动加载"
                                field="autoLoad"
                                triggerPropName="checked">
                                <Switch size="small"/>
                            </Form.Item>}
                            {false && <Form.Item
                                label="加载方式"
                                field="loadType">
                                <Radio.Group
                                    size="mini"
                                    type="button"
                                    options={[
                                        { value: '1', label: '并行'},
                                        { value: '2', label: '串行'}
                                    ]}/>
                            </Form.Item>}
                            <Form.Item
                                label="请求地址"
                                field="serviceId">
                                <Select
                                    size="mini"
                                    showSearch={{
                                        retainInputValue: true,
                                    }}
                                    filterOption={(inputValue, option) => {
                                        return option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                                        (option.props.children && option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0)
                                    }}
                                    renderFormat={(option, value) => {
                                        return option ? (option.children) : (value);
                                    }}
                                    allowClear
                                    options={appServices.map(service => {
                                        return {
                                            value: service.serviceId,
                                            label: service.description
                                        }
                                    })}>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                label="请求方法"
                                field="method">
                                <Radio.Group
                                    size="mini"
                                    type="button"
                                    options={[
                                        { value: 'GET', label: 'GET'},
                                        { value: 'POST', label: 'POST'}
                                    ]}/>
                            </Form.Item>
                            <Form.Item
                                label="请求参数"
                                field="dataBindVar">
                                <BindVar size="mini">
                                    绑定变量
                                </BindVar>
                            </Form.Item>
                            <Form.Item
                                label="占位数据"
                                field="placeholders">
                                <BindVar size="mini">
                                    绑定变量
                                </BindVar>
                            </Form.Item>
                            <Form.Item
                                label="是否发送请求">
                                <Form.Item
                                    field="conditionBindVar"
                                    noStyle>
                                    <BindVar size="mini">
                                        <Form.Item
                                            field="condition"
                                            triggerPropName="checked"
                                            noStyle>
                                            <Switch
                                                size="small"/>
                                        </Form.Item>
                                    </BindVar>
                                </Form.Item>
                            </Form.Item>
                            <Form.Item
                                label="请求发送前处理函数"
                                field="before">
                                <Editor/>
                            </Form.Item>
                            <Form.Item
                                label="请求成功时处理函数"
                                field="success">
                                <Editor/>
                            </Form.Item>
                            <Form.Item
                                label="请求失败时处理函数"
                                field="fail">
                                <Editor/>
                            </Form.Item>
                            <Form.Item
                                label="默认数据">
                                <Form.Item
                                    field="value"
                                    noStyle>
                                    <Editor/>
                                </Form.Item>
                                <Typography.Text type='secondary'>
                                    输入框内默认支持变量写法和JS写法完全一致
                                </Typography.Text>
                            </Form.Item>
                        </Form>
                    </TabPane>
                </Tabs>
            </Panel>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        appServices: state.app.services,
        appServiceMap: state.app.serviceMap
    }
}, null, null, {forwardRef: true})(Attr);
