import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import formItemTypes from 'packages/modo-view/core/src/components/Widget/components/Form/types';
import ComponentAttrMap from './attr';
import OtherAttr from './components/Other';

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
        const { nodes, activeNodeKey } = this.props;
        const prevNode = prevProps.nodes.byId[prevProps.activeNodeKey];
        const node = nodes.byId[activeNodeKey];
        if (!_.isEqual(prevNode, node)) {
            this.formRef.current.setFieldsValue(node);
        }
    }
    render() {
        const {
            activeNodeKey,
            nodes,
            ...rest
        } = this.props;

        const { current } = this.formRef;

        const node = nodes.byId[activeNodeKey];
        if (!node) {
            return <div>未找到选中节点</div>
        }

        const ComponentAttr = ComponentAttrMap[node.type];
        const FormItemAttr = ComponentAttrMap['formItem'];

        return (
            <div className="modo-designer-attr">
                <Form
                    ref={this.formRef}
                    key={activeNodeKey}
                    layout="vertical"
                    initialValues={node}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="控件名称"
                        field="labelBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="label"
                                noStyle>
                                <Input
                                    size="mini"/>
                                </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="控件标识"
                        field="name">
                        <Input
                            size="mini"/>
                    </Form.Item>
                </Form>

                {
                    ComponentAttr ? <ComponentAttr /> : null
                }
                {
                    formItemTypes.indexOf(node.type) > -1 ? <FormItemAttr /> : null
                }

                <OtherAttr />
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes,
        activeNodeKey: state.activeNodeKey,
        activeInForm: state.activeInForm
    }
})(Attr);
