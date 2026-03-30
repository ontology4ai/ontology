import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            languages: []
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
    componentDidMount() {
        this.setState({
            languages: monaco.languages.getLanguages().map(lang => {
                return lang.id;
            })
        })
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
                    label="语言"
                    field="options.language">
                    <Select
                        allowClear
                        showSearch
                        size="mini"
                        options={this.state.languages}/>
                </Form.Item>
                <Form.Item
                    label="高度"
                    field="options.height">
                    <InputNumber
                        size="mini"/>
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
