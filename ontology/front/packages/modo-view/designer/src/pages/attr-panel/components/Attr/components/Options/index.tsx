import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import {
    Grid,
    Divider,
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
import IconSelect from '@/components/IconSelect';
import './style/index.less';

const RadioGroup = Radio.Group;

class OptionsAttr extends React.Component {
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
                className="options-attr-form"
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="选项">
                    <Form.Item
                        field="options.optionsBindVar"
                        noStyle>
                        <BindVar size="mini">
                            <span style={{ lineHeight: '24px' }}>绑定变量</span>
                        </BindVar>
                    </Form.Item>
                    <Form.List
                        field="options.options">
                        {(fields, { add, remove, move }) => {
                            return (
                                <div
                                    className="options-attr-item">
                                    <Grid.Row
                                        className="row-divider"
                                        gutter={6}
                                        style={{
                                            lineHeight: '30px',
                                            background: 'var(--color-gray-2)'
                                        }}>
                                        <Grid.Col
                                            span={5}>
                                            value
                                        </Grid.Col>
                                        <Grid.Col
                                            span={5}>
                                            label
                                        </Grid.Col>
                                        <Grid.Col
                                            span={5}>
                                            禁用
                                        </Grid.Col>
                                        <Grid.Col
                                            span={5}>
                                            icon
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
                                                    gutter={6}
                                                    style={{
                                                        marginTop: '4px'
                                                    }}>
                                                    <Grid.Col span={5}>
                                                        <Form.Item
                                                            field={rule.field + '.value'}
                                                            noStyle>
                                                            <Input size="mini"/>
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col span={5}>
                                                        <Form.Item
                                                            field={rule.field + '.labelBindVar'}
                                                            noStyle>
                                                            <BindVar size="mini">
                                                                <Form.Item
                                                                    field={rule.field + '.label'}
                                                                    noStyle>
                                                                    <Input size="mini"/>
                                                                </Form.Item>
                                                            </BindVar>
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col span={5}>
                                                        <Form.Item
                                                            field={rule.field + '.disabledBindVar'}
                                                            noStyle>
                                                            <BindVar size="mini">
                                                                <Form.Item
                                                                    field={rule.field + '.disabled'}
                                                                    noStyle>
                                                                    <Switch
                                                                        style={{marginTop: '2px'}}
                                                                        size="small"
                                                                        type="round"/>
                                                                </Form.Item>
                                                            </BindVar>
                                                        </Form.Item>
                                                    </Grid.Col>
                                                    <Grid.Col span={5}>
                                                        <Form.Item
                                                            field={rule.field + '.icon'}
                                                            noStyle>
                                                            <IconSelect size="mini"/>
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
                    <Form.Item
                        field="options.props.label"
                        label="label对应属性值">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        field="options.props.value"
                        label="value对应属性值">
                        <Input />
                    </Form.Item>
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
})(OptionsAttr);
