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
    TableColumnProps,
    InputNumber
} from "@arco-design/web-react";
import TableForm from '@/components/TableForm';
import { IconEdit, IconDelete } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import Container from 'packages/modo-view/core/src/components/Widget/utils/Container';

const RadioGroup = Radio.Group;

class RadioGroupAttr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            container: {
                model: Container,
                fields: [
                    {
                        name: 'label',
                        valueType: 'string',
                        defaultValue: '',
                        label: '操作中文名',
                        type: 'input'
                    }
                ]
            },
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
            <>
                <Form
                    ref={this.formRef}
                    key={activeNodeKey}
                    layout="vertical"
                    initialValues={node}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="当前展示索引"
                        field="options.currentIndexBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="options.currentIndex"
                                noStyle>
                                <InputNumber/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="自动循环"
                        field="options.autoPlayBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="options.autoPlay"
                                noStyle>
                                <Switch size="small" type="round"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                </Form>
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
})(RadioGroupAttr);
