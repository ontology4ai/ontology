import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Modal, Trigger, Skeleton, Link, Form, Button, Input, InputNumber, Switch, Select, Radio } from "@arco-design/web-react";
import { IconEdit, IconRefresh, IconRole, IconTeam } from 'modo-design/icon';
import { Face, Tag } from 'modo-design';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import * as iconMap from 'modo-design/icon';
import EventAttr from '../EventSetting';
import './style/index.less';

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            event: null
        };
        this.formRef = React.createRef();
    }

    onValuesChange = (changeValue, values) => {
        this.props.onChange(values);
    };
    handleOnCancel = () => {
        this.setState({
            visible: false
        });
    };
    handleOnOk = () => {
        const values = this.formRef.current.getFieldsValue();
        this.formRef.current.setFieldValue('event', this.state.event);
        this.setState({
            visible: false
        });
    };
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
        const { action } = this.props;
        const prevAction = prevProps.action;
        if (!_.isEqual(action, prevAction)) {
            this.formRef.current.setFieldsValue(action);
        }
    }
    render() {
        const {
            action,
            actionIndex
        } = this.props;

        const { current } = this.formRef;

        return (
            <>
                <Form
                    ref={this.formRef}
                    key={actionIndex}
                    layout="vertical"
                    initialValues={action}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="标题"
                        field="labelBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="label"
                                noStyle>
                                <Input size="mini"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="标签图标"
                        field="icon">
                        <Select
                            size="small"
                            showSearch={true}
                            allowClear
                            dropdownMenuClassName="icon-list"
                            virtualListProps={{
                                threshold: null
                            }}
                            options={Object.keys(iconMap).map(key => {
                                const Icon = iconMap[key];
                                return {
                                    value: key,
                                    label: (<Icon/>)
                                }
                            })}/>
                    </Form.Item>
                    <Form.Item
                        label="标签状态"
                        field="status">
                        <Select
                            size="small"
                            allowClear
                            options={[
                                { value: 'default', label: '默认' },
                                { value: 'warning', label: '警告' },
                                { value: 'danger', label: '危险' },
                                { value: 'success', label: '成功' }
                            ]}>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="标签类型"
                        field="type">
                        <Select
                            size="small"
                            allowClear
                            options={[
                                { value: 'default', label: '默认按钮' },
                                { value: 'primary', label: '主要按钮' },
                                { value: 'secondary', label: '次级按钮' },
                                { value: 'dashed', label: '虚框按钮' },
                                { value: 'text', label: '文字按钮' },
                                { value: 'outline', label: '线性按钮' }
                            ]}>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="提示消息"
                        field="tooltipBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="tooltip"
                                noStyle>
                                <Input size="mini"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="隐藏控件"
                        field="hiddenBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="hidden"
                                triggerPropName="checked"
                                noStyle>
                                <Switch
                                    size="small"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="禁用控件"
                        field="disabledBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="disabled"
                                triggerPropName="checked"
                                noStyle>
                                <Switch
                                    size="small"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        noStyle>
                        <Button
                            onClick={() => {
                                this.setState({
                                    visible: true
                                })
                            }}>单击绑定动作</Button>
                    </Form.Item>
                </Form>
                <Modal
                    style={{
                        width: 'calc(100% - 40px)',
                        height: 'calc(100% - 40px)'
                    }}
                    title={(
                        <div
                            style={{ textAlign: 'left' }}>
                            Modal Title
                        </div>
                    )}
                    visible={this.state.visible}
                    onCancel={this.handleOnCancel}
                    onOk={this.handleOnOk}>
                    <EventAttr
                        event={action.event}
                        onChange={(values) => {
                            this.setState({
                                event: values
                            })
                        }}/>
                </Modal>
            </>
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
