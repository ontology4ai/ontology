import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import loadingTypes from 'packages/modo-view/core/src/utils/loadingTypes';
import skeletonTypes from 'packages/modo-view/core/src/utils/skeletonTypes';

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
                    label="隐藏控件"
                    field="options.hiddenBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.hidden"
                            triggerPropName="checked"
                            noStyle>
                            <Switch
                                size="small"
                                type="round"/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="是否需要提示信息"
                    field="options.showTooltip"
                    triggerPropName="checked">
                    <Switch
                        size="small"
                        type="round"/>
                </Form.Item>
                <Form.Item shouldUpdate noStyle >
                    {
                        (values) => {
                            if (values.options.showTooltip) {
                                return (
                                    <Form.Item
                                        label="提示信息文案"
                                        field="options.tooltipBindVar">
                                        <BindVar size="mini">
                                            <Form.Item
                                                field="options.tooltip"
                                                noStyle>
                                                <Input />
                                            </Form.Item>
                                        </BindVar>
                                    </Form.Item>
                                );
                            }
                            return null;
                        }
                    }
                </Form.Item>
                {
                    loadingTypes.indexOf(node.type) > -1 ? (
                        <>
                            <Form.Item
                                label="是否需要加载动画"
                                field="options.isLoading"
                                triggerPropName="checked">
                                <Switch
                                    size="small"
                                    type="round"/>
                            </Form.Item>
                            <Form.Item shouldUpdate noStyle >
                                {
                                    (values) => {
                                        if (values.options.isLoading) {
                                            return (
                                                <Form.Item noStyle>
                                                    <Form.Item
                                                        label="加载动画启动"
                                                        field="options.loadingBindVar">
                                                        <BindVar size="mini">
                                                            <Form.Item
                                                                noStyle
                                                                field="options.loading"
                                                                triggerPropName="checked">
                                                                <Switch
                                                                    size="small"
                                                                    type="round"/>
                                                            </Form.Item>
                                                        </BindVar>
                                                    </Form.Item>
                                                    <Form.Item
                                                        label="加载动画文案"
                                                        field="options.loadingTipBindVar">
                                                        <BindVar size="mini">
                                                            <Form.Item
                                                                noStyle
                                                                field="options.loadingTip">
                                                                <Input
                                                                    size="mini"/>
                                                            </Form.Item>
                                                        </BindVar>
                                                    </Form.Item>
                                                </Form.Item>
                                            )
                                        }
                                        return null;
                                    }
                                }
                            </Form.Item>
                        </>
                    ) : null
                }
                {
                    <>
                        <Form.Item
                            label="是否需要骨架屏"
                            field="options.isSkeleton"
                            triggerPropName="checked">
                            <Switch
                                size="small"
                                type="round"/>
                        </Form.Item>
                        <Form.Item shouldUpdate noStyle >
                            {
                                (values) => {
                                    if (values.options.isSkeleton) {
                                        return (
                                            <Form.Item noStyle>
                                                <Form.Item
                                                    label="骨架屏动画启动"
                                                    field="options.skeletonLoadingBindVar">
                                                    <BindVar size="mini">
                                                        <Form.Item
                                                            noStyle
                                                            field="options.skeletonLoading"
                                                            triggerPropName="checked">
                                                            <Switch
                                                                size="small"
                                                                type="round"/>
                                                        </Form.Item>
                                                    </BindVar>
                                                </Form.Item>
                                                <Form.Item
                                                    label="骨架屏宽度"
                                                    field="options.skeletonWidth">
                                                    <Input/>
                                                </Form.Item>
                                            </Form.Item>
                                        )
                                    }
                                    return null;
                                }
                            }
                        </Form.Item>
                    </>
                }
                <Form.Item
                    label="初次渲染触发条件"
                    field="options.initRenderCondiBindVar">
                    <BindVar>
                        绑定变量
                    </BindVar>
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
