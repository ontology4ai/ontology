import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Trigger, Skeleton, Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
import { IconEdit, IconRefresh } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import FieldAttr from '../Field';
import ActionAttr from '../Action';
import './style/index.less';

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
            model: {
                fields: [
                    {
                        name: 'title',
                        valueType: 'string',
                        defaultValue: '',
                        label: '字段中文名',
                        type: 'input',
                        options: {
                            rules: [{
                                required: true
                            }]
                        }
                    },
                    {
                        name: 'dataIndex',
                        valueType: 'string',
                        defaultValue: '',
                        label: '字段英文名',
                        type: 'input',
                        options: {
                            rules: [{
                                required: true
                            }]
                        }
                    }
                ]
            },
            modelOptions: [],
            currentFieldIndex: null,
            action: {
                fields: [
                    {
                        name: 'label',
                        valueType: 'string',
                        defaultValue: '',
                        label: '操作中文名',
                        type: 'input'
                    },
                    {
                        name: 'labelBindVar',
                        width: 30,
                        valueType: 'string',
                        defaultValue: '',
                        label: '',
                        type: 'bindVar'
                    },
                ]
            },
            currentActionIndex: null
        };
        this.formRef = React.createRef();

    }
    setModelOptions = (options) => {
        const { nodes } = this.props;
        const { models } = nodes.byId[nodes.rootIds[0]].options;

        const modelOptions =  models.map(model => {
            return {
                value: model.name,
                label: model.doc
            }
        });

        this.setState({
            modelOptions
        });
    };
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
        const actions = this.formRef.current.getFieldValue('options.buttons');
        actions[this.state.currentActionIndex] = {
            ...actions[this.state.currentActionIndex],
            ...action
        };
        this.formRef.current.setFieldValue('options.buttons', [
            ...actions
        ]);
    };
    componentDidMount() {
        this.setModelOptions();
    }
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
                className="dropdown-attr-form"
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="尺寸"
                    field="options.size">
                    <Select
                        options={[
                            { value: 'mini', label: 'mini' },
                            { value: 'small', label: 'small' },
                            { value: 'default', label: 'default' },
                            { value: 'large', label: 'large' }
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="按钮列表"
                    field="options.buttons">
                    <TableForm
                        model={this.state.action}
                        pagination={false}
                        rowKey="name"
                        operWidth={52}
                        sortWidth={30}
                        selectWidth={20}
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
                                            const actions = (this.formRef.current && this.formRef.current.getFieldValue('options.buttons')) || [];
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
