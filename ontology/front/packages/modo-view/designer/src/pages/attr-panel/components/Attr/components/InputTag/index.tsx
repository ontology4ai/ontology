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
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import Options from '../Options';
import './style/index.less';

const RadioGroup = Radio.Group;

class FormItemAttr extends React.Component {
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
                <Form
                    ref={this.formRef}
                    key={activeNodeKey}
                    layout="vertical"
                    initialValues={node}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="允许清除值"
                        field="options.allowClear"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="是否为内部标签变化添加动画"
                        field="options.animation"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="自动聚焦"
                        field="options.autoFocus"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="是否可以通过拖拽排序"
                        field="options.dragToSort"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="是否是错误状态"
                        field="options.error"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="设置传入和回调出的值均为{label:'', value:''}"
                        field="options.error"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="是否只读"
                        field="options.readOnly"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="是否在失焦时自动存储正在输入的文本"
                        field="options.saveOnBlur"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="尺寸"
                        field="options.mode">
                        <Radio.Group
                            type="button"
                            options={[
                                { value: 'mini', label: '迷你'},
                                { value: 'small', label: '小' },
                                { value: 'default', label: '默认' },
                                { value: 'large', label: '大' }
                            ]}/>
                    </Form.Item>
                    <Form.Item
                        label="自定义标签渲染函数"
                        field="options.renderTagBindVar">
                        <PopupSourceCode
                            language="javascript">
                            <Button>编写代码</Button>
                        </PopupSourceCode>
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
})(FormItemAttr);
