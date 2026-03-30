import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import IconSelect from '@/components/IconSelect';


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
                    label="显示拖拽排序"
                    field="options.sortable"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="显示序号"
                    field="options.index"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                {/*<Form.Item
                    label="显示操作"
                    field="options.oper"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>*/}
                <Form.Item
                    label="显示新增操作"
                    field="options.addOper"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="显示全文数据编辑操作"
                    field="options.editAllOper"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="显示删除操作"
                    field="options.deleteOper"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="每页数据条数"
                    field="options.pageSize">
                    <InputNumber
                        min={0}
                    />
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
