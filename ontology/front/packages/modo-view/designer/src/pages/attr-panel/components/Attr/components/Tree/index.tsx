import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select, Trigger, Radio } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import { IconEdit } from 'modo-design/icon';
import ActionAttr from '../Action';

function ActionPopup(props) {
    const closePopup = () => {
        props.triggerRef.current.setPopupVisible(false);
    };
    const handleSave = () => {
        props.onSave(data);
        closePopup();
    };
    const [data, setData] = useState(props.action);
    return (
        <Panel
            style={{
                width: '300px',
                top: '50px',
                left: 'auto',
                right: '300px',
                height: 'calc(100% - 50px)'
            }}
            title="操作列属性"
            visible={true}
            onSave={handleSave}
            onClose={closePopup}
            onCancel={closePopup}>
            <ActionAttr
                action={props.action}
                onChange={values => {
                    setData(values)
                }}/>
        </Panel>
    );
}

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            action: {
                fields: [
                    {
                        name: 'label',
                        valueType: 'string',
                        defaultValue: '',
                        label: '操作中文名',
                        type: 'input'
                    }
                ]
            },
            currentActionIndex: null
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
    handleSaveAction = action => {
        this.setState({
            currentActionIndex: null
        });
        const actions = this.formRef.current.getFieldValue('options.actions');
        actions[this.state.currentActionIndex] = {
            ...actions[this.state.currentActionIndex],
            ...action
        };
        this.formRef.current.setFieldValue('options.actions', [
            ...actions
        ]);
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
                    label="显示连线"
                    field="options.showLine"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="默认展开所有节点"
                    field="options.isExpandedAll"
                    triggerPropName="checked">
                    <Switch size='small'/>
                </Form.Item>
                <Form.Item
                    label="间隔"
                    field="options.indent">
                    <Radio.Group
                        size="small"
                        type="button"
                        options={[
                            { value: 'narrow', label: '窄' },
                            { value: 'wide', label: '宽' }
                        ]}>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label="数据"
                    field="options.dataBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="自定义字段名称"
                    field="options.fieldNames">
                    <Form.Item
                        label="key"
                        field="options.fieldNames.key">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="title"
                        field="options.fieldNames.title">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="children"
                        field="options.fieldNames.children">
                        <Input />
                    </Form.Item>
                </Form.Item>
                <Form.Item
                    label="自定义节点"
                    field="options.renderTitleBindVar">
                    <PopupSourceCode>
                        <Button>编写自定义函数</Button>
                    </PopupSourceCode>
                </Form.Item>
                <Form.Item
                    label="右键操作列表"
                    field="options.actions">
                    <TableForm
                        model={this.state.action}
                        pagination={false}
                        rowKey="name"
                        operWidth={60}
                        rowExtra={(col, record, index) => {
                            const triggerRef= React.createRef();
                            return (
                                <>
                                    <Trigger
                                        ref={triggerRef}
                                        className="field-attr-popup"
                                        trigger="click"
                                        position="right"
                                        popupAlign={{
                                            right: 30,
                                        }}
                                        popup={() => {
                                            const actions = (this.formRef.current && this.formRef.current.getFieldValue('options.actions')) || [];
                                            return (
                                                <ActionPopup
                                                    action={actions[index]}
                                                    actionIndex={index}
                                                    onSave={this.handleSaveAction}
                                                    triggerRef={triggerRef}/>
                                            )
                                        }}>
                                        <Button
                                            size="mini"
                                            icon={<IconEdit />}
                                            onClick={() =>{
                                                triggerRef.current.setPopupVisible(true);
                                                this.setState({
                                                    currentActionIndex: index
                                                });
                                            }}>
                                        </Button>
                                    </Trigger>
                                </>
                            )
                        }}/>
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
