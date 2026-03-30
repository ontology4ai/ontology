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
import Options from '../Options';
import './style/index.less';

const RadioGroup = Radio.Group;

class RadioGroupAttr extends React.Component {
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
            <>
                <Options></Options>
                <Form
                    ref={this.formRef}
                    key={activeNodeKey}
                    layout="vertical"
                    initialValues={node}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="绑定值（不在表单内时可以绑定）"
                        field="options.valueBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="options.value"
                                noStyle>
                                <Input/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        field="options.type"
                        label="类型">
                        <RadioGroup
                            size='mini'
                            type='button'
                            options={[
                                { value: 'radio', label: '单选' },
                                { value: 'button', label: '按钮' }
                            ]}/>
                    </Form.Item>
                    <Form.Item
                        field="options.size"
                        label="尺寸">
                        <RadioGroup
                            size='mini'
                            type='button'
                            options={[
                                { value: 'mini', label: '迷你' },
                                { value: 'small', label: '小' },
                                { value: 'default', label: '默认' },
                                { value: 'large', label: '大' }
                            ]}/>
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
