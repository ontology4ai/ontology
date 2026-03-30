import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Trigger, Skeleton, Link, Form, Button, Input, InputNumber, Switch, Select, Radio } from "@arco-design/web-react";
import { IconEdit, IconRefresh, IconRole, IconTeam } from 'modo-design/icon';
import { Face, Tag } from 'modo-design';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import Editor from '@/components/Editor';
import IconSelect from '@/components/IconSelect';
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
        const { tab } = this.props;
        const prevTab = prevProps.tab;
        if (!_.isEqual(tab, prevTab)) {
            this.formRef.current.setFieldsValue(tab);
        }
    }
    render() {
        const {
            tab,
            tabIndex,
            fragmentViews
        } = this.props;

        const { current } = this.formRef;

        return (
            <Form
                ref={this.formRef}
                key={tabIndex}
                layout="vertical"
                initialValues={tab}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="唯一标识"
                    field="key">
                    <Input size="mini"/>
                </Form.Item>
                <Form.Item
                    label="标题"
                    field="title">
                    <Input size="mini"/>
                </Form.Item>
                <Form.Item
                    label="图标"
                    field="iconBindVar">
                    <BindVar>
                        <Form.Item
                            field="icon"
                            noStyle>
                            <IconSelect/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="绑定视图"
                    field="viewName">
                    <Select
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
