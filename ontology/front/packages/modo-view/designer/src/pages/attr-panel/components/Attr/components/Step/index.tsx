import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Trigger, Skeleton, Link, Form, Button, Input, InputNumber, Switch, Select, Radio } from "@arco-design/web-react";
import { IconEdit, IconRefresh, IconRole, IconTeam } from 'modo-design/icon';
import { Face, Tag } from 'modo-design';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import Editor from '@/components/Editor';
import * as iconMap from 'modo-design/icon';
import './style/index.less';

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
        this.formRef = React.createRef();
    }

    onValuesChange = (changeValue, values) => {
        this.props.onChange(values);
    };
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
        const { step } = this.props;
        const prevStep = prevProps.step;
        if (!_.isEqual(step, prevStep)) {
            this.formRef.current.setFieldsValue(step);
        }
    }
    render() {
        const {
            step,
            stepIndex,
            fragmentViews
        } = this.props;

        const { current } = this.formRef;

        return (
            <Form
                ref={this.formRef}
                key={stepIndex}
                layout="vertical"
                initialValues={step}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="唯一标识"
                    field="id">
                    <Input size="mini"/>
                </Form.Item>
                <Form.Item
                    label="标题"
                    field="title">
                    <Input size="mini"/>
                </Form.Item>
                <Form.Item
                    label="描述"
                    field="description">
                    <Input size="mini"/>
                </Form.Item>
                <Form.Item
                    label="节点状态"
                    field="status">
                    <Select
                        allowClear
                        options={[
                            'wait',
                            'process',
                            'finish',
                            'error'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="隐藏"
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
                    label="禁用"
                    field="disabled"
                    triggerPropName="checked">
                    <Switch
                        type="round"
                        size="small"/>
                </Form.Item>
                <Form.Item
                    label="绑定视图"
                    field="viewName">
                    <Select
                        allowClear
                        showSearch
                        filterOption={(inputValue, option) =>
                            option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                            option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                        }
                        options={fragmentViews.map(view => {
                            return {
                                value: view.name,
                                label: view.label
                            };
                        })}/>
                </Form.Item>
                <Form.Item
                    label="传输参数"
                    field="params">
                    <Editor/>
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
        activeNodeKey,
        fragmentViews: state.app.fragmentViews
    }
})(Attr);
