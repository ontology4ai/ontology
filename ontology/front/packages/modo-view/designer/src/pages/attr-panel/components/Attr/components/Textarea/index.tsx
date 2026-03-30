import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Spin, Form, Button, Input, Switch, Upload } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: false
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
        const {
            activeNodeKey,
            nodes,
            node,
            ...rest
        } = this.props;

        const { current } = this.formRef;
        const env = process.env.NODE_ENV;
        const rootPath = env === 'production' ? '' : '/__modo';

        return (
            <Form
                className="image-attr"
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="是否自动调整输入框的高度"
                    field="options.autoSize"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="最大字数"
                    field="options.maxLength"
                    triggerPropName="checked">
                    <Input size='small'/>
                </Form.Item>
                <Form.Item
                    label="显示字数统计"
                    field="options.showWordLimit"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
            </Form>
        );
    }
}

export default connect((state, ownProps) => {
    const { nodes, activeNodeKey} = state;
    const node = nodes.byId[activeNodeKey];
    return {
        app: state.app,
        node,
        nodes,
        activeNodeKey
    }
})(Attr);
