import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Spin, Form, Button, Input, Switch, Upload } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import './style/index.less';

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
                    label="图片地址"
                    field="options.srcBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            noStyle>
                            <Grid.Row gutter={8}>
                                <Grid.Col flex={1}>
                                    <Form.Item
                                        field="options.src"
                                        noStyle>
                                        <Input />
                                    </Form.Item>
                                </Grid.Col>
                                <Grid.Col flex="28px">
                                    <Form.Item>
                                        <Spin loading={this.state.loading}>
                                            <Upload
                                                action={ rootPath + "/_api/minio/singleFileUpload" }
                                                headers={{
                                                    'X-Modo-Bucket': this.props.app.name
                                                }}
                                                onChange={(files, file) => {
                                                    if (file.status === 'uploading') {
                                                        this.setState({
                                                            loading: true
                                                        })
                                                    } else {
                                                        this.setState({
                                                            loading: false
                                                        })
                                                    }
                                                    if (file.status === 'done') {
                                                        this.formRef.current.setFieldValue('options.src', file.response.data);
                                                    }
                                                }}/>
                                        </Spin>
                                    </Form.Item>
                                </Grid.Col>
                            </Grid.Row>
                        </Form.Item>
                    </BindVar>
                </Form.Item>

                <Form.Item
                    label="宽度"
                    field="options.width">
                    <Input
                        size="mini"/>
                </Form.Item>
                <Form.Item
                    label="高度"
                    field="options.height">
                    <Input
                        size="mini"/>
                </Form.Item>
                <Form.Item
                    label="是否需要过渡效果"
                    field="options.loader"
                    triggerPropName="checked">
                    <Switch size="mini" type="round"/>
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
