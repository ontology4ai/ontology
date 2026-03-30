import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';

class Css extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
        this.formRef = React.createRef();
        this.styleFormRef = React.createRef();
    }
    onValuesChange = (changeValue, values) => {
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: values
        })
    };
    onStyleValuesChange = (changeValue, values) => {

    };
    render() {
        const {
            activeNodeKey,
            nodes,
            ...rest
        } = this.props;

        const { current } = this.formRef;

        return (
            <div
                className="modo-designer-css"
                key={activeNodeKey}>
                <Form
                    ref={this.formRef}
                    layout="vertical"
                    initialValues={nodes.byId[activeNodeKey]}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="CSS类名"
                        field="options.classNameBindVar">
                        <BindVar>
                            <Form.Item
                                field="options.className"
                                noStyle>
                                <Input />
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="样式编辑"
                        field="options.css">
                        <PopupSourceCode
                            language="css">
                            <Button>样式源码编辑</Button>
                        </PopupSourceCode>
                    </Form.Item>
                </Form>
            </div>
        );

        /*<Form
            ref={this.styleFormRef}
            layout="vertical"
            onValuesChange={this.onStyleValuesChange}>
            <Form.Item
                label="宽度"
                field="style.width">
                <Input />
            </Form.Item>
            <Form.Item
                label="高度"
                field="style.height">
                <Input />
            </Form.Item>
        </Form> */
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes,
        activeNodeKey: state.activeNodeKey
    }
})(Css);
