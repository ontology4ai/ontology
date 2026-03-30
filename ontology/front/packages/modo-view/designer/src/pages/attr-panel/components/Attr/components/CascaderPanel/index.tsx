import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';

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
                    label="模式"
                    field="options.mode">
                    <Select
                        options={[
                            { value: 'multiple', label: '多选'},
                            { value: '', label: '单选' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="数据"
                    field="options.optionsBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="value值对应字段"
                    field="options.fieldNames.value">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="label值对应字段"
                    field="options.fieldNames.label">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="每当选择的时候，值都会发生改变"
                    field="options.changeOnSelect"
                    triggerPropName="checked">
                    <Switch size='small' type="round"/>
                </Form.Item>
                <Form.Item
                    label="是否显示选中值的完整路径"
                    field="options.showAllPath"
                    triggerPropName="checked">
                    <Switch size='small' type="round"/>
                </Form.Item>
                <Form.Item
                    label="路径间隔字符"
                    field="options.split">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="动态加载数据"
                    field="options.loadMoreBindVar">
                    <PopupSourceCode
                        language="javascript">
                        <Button>绑定函数</Button>
                    </PopupSourceCode>
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
