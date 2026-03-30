import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import {
    Grid,
    Form,
    Button,
    Input,
    Switch,
    Select,
    Radio,
    Table,
    TableColumnProps
} from "@arco-design/web-react";
import { IconEdit, IconDelete } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import './style/index.less';

const RadioGroup = Radio.Group;

class FormItemAttr extends React.Component {
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

        const columns: TableColumnProps[] = [
            {
                title: '标签名',
                dataIndex: 'label'
            },
            {
                title: '类型',
                dataIndex: 'type'
            }
        ];
        const children = node.children.map(id => {
            return nodes.byId[id.toString()];
        });

        return (
            <Form
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="是否需要分组"
                    field="options.isGroup"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="分组默认选中"
                    field="options.groupChecked"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="提示文字"
                    field="options.placeholderBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.placeholder"
                            noStyle>
                            <Input />
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="表单项类型"
                    field="type">
                    <Select
                        options={[
                            { value: 'input', label: '输入框' },
                            { value: 'select', label: '选择器' },
                            { value: 'radioGroup', label: '单选框' },
                            { value: 'checkGroup', label: '多选框' },
                            { value: 'dropdown', label: '下拉按钮组' },
                            { value: 'datePicker', label: '日期选择器' },
                            { value: 'rangePicker', label: '日期区间' },
                            { value: 'treeSelect', label: '树形选择器' },
                            { value: 'cascader', label: '级联选择器' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="表单项宽度"
                    field="options.span">
                    <RadioGroup
                        type='button'
                        options={[
                            { value: '2', label: '1/12' },
                            { value: '3', label: '1/8' },
                            { value: '4', label: '1/6' },
                            { value: '6', label: '1/4' },
                            { value: '8', label: '1/3' },
                            { value: '12', label: '1/2' },
                            { value: '16', label: '2/3' },
                            { value: '18', label: '3/4' },
                            { value: '20', label: '5/6' },
                            { value: '21', label: '7/8' },
                            { value: '22', label: '11/12' },
                            { value: '24', label: '1' }
                        ]}>
                    </RadioGroup>
                </Form.Item>
                <Form.Item
                    label="标题宽度"
                    field="options.labelFlex">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="偏移宽度"
                    field="options.wrapperOffset">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="不显示label"
                    field="options.noLabel"
                    triggerPropName="checked">
                    <Switch type="round" size="small"/>
                </Form.Item>
                <Form.Item
                    label="不显示样式"
                    field="options.noStyle"
                    triggerPropName="checked">
                    <Switch type="round" size="small"/>
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
                <Form.Item
                    label="标签前显示加重红色符号"
                    field="options.requiredBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.required"
                            triggerPropName="checked"
                            noStyle>
                            <Switch type="round" size="small"/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                {/*<Form.Item
                    label="是否在required的时候显示加重的红色星号"
                    field="options.requiredSymbolBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.requiredSymbol"
                            triggerPropName="checked"
                            noStyle>
                            <Switch type="round" size="small"/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>*/}
                <Form.Item
                    label="校验">
                    <Form.List
                        field="options.rules">
                        {(fields, { add, remove, move }) => {
                            return (
                                <div>
                                    <Grid.Row
                                        gutter={4}
                                        className="row-divider"
                                        style={{
                                            lineHeight: '30px',
                                            background: 'var(--color-gray-2)'
                                        }}>
                                        <Grid.Col
                                            span={7}>
                                            类型
                                        </Grid.Col>
                                        <Grid.Col
                                            span={3}>
                                            正则
                                        </Grid.Col>
                                        <Grid.Col
                                            span={3}>
                                            校验
                                        </Grid.Col>
                                        <Grid.Col
                                            span={8}>
                                            提示消息
                                        </Grid.Col>
                                        <Grid.Col
                                            span={3}>
                                            操作
                                        </Grid.Col>
                                    </Grid.Row>
                                    {
                                        fields.map((rule, index) => {
                                            return (
                                                <Grid.Row
                                                    key={rule.key}
                                                    gutter={4}
                                                    style={{
                                                        marginTop: '4px'
                                                    }}>
                                                    <Grid.Col span={7}>
                                                        <Form.Item
                                                            field={rule.field + '.type'}
                                                            noStyle>
                                                            <Select
                                                                triggerProps={{
                                                                    autoAlignPopupWidth: false
                                                                }}
                                                                allowClear
                                                                options={[
                                                                    { value: 'required', label: '必填'},
                                                                    { value: 'string', label: '字符串'},
                                                                    { value: 'boolean', label: '布尔型'},
                                                                    { value: 'number', label: '数字'},
                                                                    { value: 'url', label: 'URL地址'},
                                                                    { value: 'email', label: '邮箱'},
                                                                ]}/>
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col span={3}>
                                                        <Form.Item
                                                            field={rule.field + '.matchBindVar'}
                                                            noStyle>
                                                            <BindVar />
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col span={3}>
                                                        <Form.Item
                                                            field={rule.field + '.validatorBindVar'}
                                                            noStyle>
                                                            <BindVar />
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col span={8}>
                                                        <Form.Item
                                                            field={rule.field + '.messageBindVar'}
                                                            noStyle>
                                                            <BindVar size="mini">
                                                                <Form.Item
                                                                    field={rule.field + '.message'}
                                                                    noStyle>
                                                                    <Input />
                                                                </Form.Item>
                                                            </BindVar>
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col
                                                        className="rule-oper"
                                                        span={3}
                                                        style={{
                                                            lineHeight: '28px'
                                                        }}>
                                                        <IconDelete onClick={() => remove(index)}/>
                                                    </Grid.Col>
                                                </Grid.Row>
                                            );
                                        })
                                    }
                                    <Button
                                        style={{
                                            marginTop: '10px'
                                        }}
                                        onClick={() => {
                                            add();
                                        }}>
                                        增加
                                    </Button>
                                </div>
                            )
                        }}
                    </Form.List>
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
})(FormItemAttr);
