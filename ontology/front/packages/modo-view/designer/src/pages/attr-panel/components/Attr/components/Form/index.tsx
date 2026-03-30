import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import {
    Form,
    Button,
    Input,
    InputNumber,
    Switch,
    Radio,
    Table,
    TableColumnProps
} from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';

const RadioGroup = Radio.Group;

class FormAttr extends React.Component {
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
                    label="排列方式"
                    field="options.layout">
                    <RadioGroup
                        type='button'
                        name='layout'
                        options={[
                            { value: 'horizontal', label: '水平' },
                            { value: 'vertical', label: '垂直' },
                            { value: 'inline', label: '行内' }
                        ]}>
                    </RadioGroup>
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                    {(values) => {
                        return values.options.layout === 'inline' ? (
                            <Form.Item
                                label="默认显示表单项个数"
                                field="options.min">
                                <InputNumber />
                            </Form.Item>
                            ) : null
                    }}
                </Form.Item>
                <Form.Item
                    label="标题宽度"
                    field="options.labelFlex">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="数据"
                    field="options.valuesBindVar">
                    <BindVar size="mini">
                        <Form.Item
                        field="options.values">
                            <PopupSourceCode
                                language="json">
                                <Button>编辑</Button>
                            </PopupSourceCode>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="初始值"
                    field="options.initialValuesBindVar">
                    <BindVar size="mini">
                        <Form.Item
                        field="options.initialValues">
                            <PopupSourceCode
                                language="json">
                                <Button>编辑</Button>
                            </PopupSourceCode>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="表单项"
                    field="children">
                    <Table
                        rowKey="id"
                        columns={columns}
                        data={children}
                        pagination={false}/>
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
})(FormAttr);
