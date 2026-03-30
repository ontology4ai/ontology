import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Trigger, Skeleton, Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
import { IconEdit, IconRefresh } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import FieldAttr from '../Field';

function Popup(props) {
    const closePopup = () => {
        props.triggerRef.current.setPopupVisible(false);
    };
    const handleSave = () => {
        props.onSave(data);
        closePopup();
    };
    const [data, setData] = useState(props.field);
    return (
        <Panel
            style={{
                width: '300px',
                top: '50px',
                left: 'auto',
                right: '300px',
                height: 'calc(100% - 50px)'
            }}
            title="字段属性"
            visible={true}
            onSave={handleSave}
            onClose={closePopup}
            onCancel={closePopup}>
            <FieldAttr
                field={props.field}
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
            currentFieldIndex: null
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
    handleSaveField = field => {
        this.setState({
            currentFieldIndex: null
        });
        const columns = this.formRef.current.getFieldValue('options.columns');
        columns[this.state.currentFieldIndex] = {
            ...columns[this.state.currentFieldIndex],
            ...field
        };
        this.formRef.current.setFieldValue('options.columns', [
            ...columns
        ]);
    };
    componentDidMount() {
    }
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


        return (
            <Form
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="字段列表"
                    field="options.columns">
                    <TableForm
                        model={this.state.model}
                        pagination={false}
                        rowKey="name"
                        operWidth={60}
                        extra={(
                            <Button
                                size="mini"
                                icon={< IconRefresh/>}
                                onClick={this.handleRefreshFields}>
                            </Button>
                        )}
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
                                            return (
                                                <Popup
                                                    field={node.options.columns[index]}
                                                    fieldIndex={index}
                                                    onSave={this.handleSaveField}
                                                    triggerRef={triggerRef}/>
                                            )
                                        }}>
                                        <Button
                                            size="mini"
                                            icon={<IconEdit />}
                                            onClick={() =>{
                                                triggerRef.current.setPopupVisible(true);
                                                this.setState({
                                                    currentFieldIndex: index
                                                });
                                            }}>
                                        </Button>
                                    </Trigger>
                                </>
                            )
                        }}/>
                </Form.Item>
                <Form.Item
                    label="数据"
                    field="options.dataBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="key值对应字段"
                    field="options.fieldNames.key">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="搜索值对应字段"
                    field="options.fieldNames.search">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="左边列表标题"
                    field="options.titleTexts[0]">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="右边列表标题"
                    field="options.titleTexts[1]">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="搜索框占位文字(默认按第一个字段搜索)"
                    field="options.searchPlaceholder">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="每页数据条数"
                    field="options.pageSize">
                    <InputNumber
                        min={0}
                    />
                </Form.Item>
                <Form.Item
                    label="高度"
                    field="options.height">
                    <InputNumber
                        min={0}
                    />
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
