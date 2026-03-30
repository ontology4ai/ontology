import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Modal, Form, Button, Input, Switch, InputNumber } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import EventAttr from '../../../Attr/components/EventSetting';
import Action from 'packages/modo-view/core/src/components/Widget/utils/Action';
import Loop from 'packages/modo-view/core/src/components/Widget/utils/Loop';

import './style/index.less';

class ModoLoop extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            event: null
        };
        this.formRef = React.createRef();

        this.setLoop();
    }
    setNode = (node) => {
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: node
        });
    };
    setLoop = () => {
        const { node } = this.props;
        if (node && !node.options.loop) {
            node.options.loop = new Loop();
            this.setNode(node);
            return;
        }
        if (node && !node.options.loop.event) {
            node.options.loop.event = new Action();
            this.setNode(node);
        }
    };
    onValuesChange = (changeValue, values) => {
        this.setNode(values);
    };
    handleOnCancel = () => {
        this.setState({
            visible: false
        });
    };
    handleOnOk = () => {
        const values = this.formRef.current.getFieldsValue();
        this.formRef.current.setFieldValue('options.loop.event', this.state.event);
        this.setState({
            visible: false
        });
    };
    componentDidUpdate(prevProps) {
        const { nodes, activeNodeKey, node } = this.props;
        const prevNode = prevProps.nodes.byId[prevProps.activeNodeKey];
        if (!_.isEqual(prevNode, node)) {
            this.formRef.current.setFieldsValue(node);
            this.setLoop();
        }
    }
    componentDidMount() {
        this.setLoop();
    }
    render() {
        const {
            activeNodeKey,
            nodes,
            node,
            ...rest
        } = this.props;

        const { current } = this.formRef;
        return (
            <>
                <Form
                    className="modo-design-loop"
                    ref={this.formRef}
                    key={activeNodeKey}
                    layout="vertical"
                    initialValues={node}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="循环数据"
                        field="options.loop.dataBindVar">
                        <BindVar>
                            <span style={{ lineHeight: '24px' }}>绑定变量</span>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="循环Key"
                        field="options.loop.key">
                        <Input
                            size="small"/>
                    </Form.Item>
                    <Form.Item
                        label="迭代变量名"
                        field="options.loop.item">
                        <Input
                            size="small"/>
                    </Form.Item>
                    <Form.Item
                        label="索引变量名"
                        field="options.loop.index">
                        <Input
                            size="small"/>
                    </Form.Item>
                    <Form.Item
                        label="是否分页"
                        field="options.loop.pagination.show"
                        triggerPropName="checked">
                        <Switch onChange={(val) => {
                            const form = this.formRef.current;
                            if (val) {
                                form.setFieldValue('options.loop.pagination.style.display', 'block');
                            } else {
                                form.setFieldValue('options.loop.pagination.style.display', 'none');
                            }

                        }}/>
                    </Form.Item>
                    <Form.Item
                        label="每页数据条数"
                        field="options.loop.pagination.pageSize">
                        <InputNumber
                            min={0}
                        />
                    </Form.Item>
                    <>
                        <Form.Item
                            label="是否需要加载动画"
                            field="options.loop.isLoading"
                            triggerPropName="checked">
                            <Switch
                                size="small"/>
                        </Form.Item>
                        <Form.Item shouldUpdate noStyle >
                            {
                                (values) => {
                                    if (values.options.loop.isLoading) {
                                        return (
                                            <Form.Item noStyle>
                                                <Form.Item
                                                    label="加载动画启动"
                                                    field="options.loop.loadingBindVar">
                                                    <BindVar>
                                                        <Form.Item
                                                            noStyle
                                                            field="options.loop.loading"
                                                            triggerPropName="checked">
                                                            <Switch
                                                                size="small"/>
                                                        </Form.Item>
                                                    </BindVar>
                                                </Form.Item>
                                                { /* <Form.Item
                                                    label="加载动画文案"
                                                    field="options.loadingTextBindVar">
                                                    <BindVar>
                                                        <Form.Item
                                                            noStyle
                                                            field="options.loadingText">
                                                            <Input
                                                                size="mini"/>
                                                        </Form.Item>
                                                    </BindVar>
                                                </Form.Item> */}
                                            </Form.Item>
                                        )
                                    }
                                    return null;
                                }
                            }
                        </Form.Item>
                        <Form.Item
                            noStyle>
                            <Button
                                onClick={() => {
                                    this.setState({
                                        visible: true
                                    })
                                }}>分页发生改变绑定动作</Button>
                        </Form.Item>
                    </>

                </Form>
                <Modal
                    style={{
                        width: 'calc(100% - 40px)',
                        height: 'calc(100% - 40px)'
                    }}
                    title={(
                        <div
                            style={{ textAlign: 'left' }}>
                            事件处理
                        </div>
                    )}
                    visible={this.state.visible}
                    onCancel={this.handleOnCancel}
                    onOk={this.handleOnOk}>
                    {node.options.loop && node.options.loop.event ? <EventAttr
                        event={node.options.loop.event}
                        onChange={(values) => {
                            this.setState({
                                event: values
                            });
                        }}/> : null}
                </Modal>
            </>
        );
    }
}

export default connect((state, ownProps) => {
    const node = state.nodes.byId[state.activeNodeKey];
    return {
        nodes: state.nodes,
        activeNodeKey: state.activeNodeKey,
        node,
        event
    }
})(ModoLoop);
