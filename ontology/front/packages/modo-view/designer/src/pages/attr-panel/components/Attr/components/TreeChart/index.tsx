import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Card, Form, Button, Input, Switch, Select, Upload, Trigger, Typography } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import { IconEdit } from 'modo-design/icon';
import { IconEye, IconDelete } from '@arco-design/web-react/icon';
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
            currentActionIndex: null,
            iconList: [],
        };
        this.formRef = React.createRef();
    }
    onValuesChange = (changeValue, values) => {
        const fieldsValue = this.formRef.current.getFieldsValue();
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: {
                ...fieldsValue,
                options: {
                    ...fieldsValue.options,
                    ...values.options
                }
            }
        })
    };
    handleSaveAction = action => {
        this.setState({
            currentActionIndex: null
        });
        const contextMenus = this.formRef.current.getFieldValue('options.contextMenus');
        contextMenus[this.state.currentActionIndex] = {
            ...contextMenus[this.state.currentActionIndex],
            ...action
        };
        this.formRef.current.setFieldValue('options.contextMenus', [
            ...contextMenus
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

        const env = process.env.NODE_ENV;
        const rootPath = env === 'production' ? '' : '/__modo';

        console.log(node);

        return (
            <Form
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="数据"
                    field="options.dataBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="布局类型"
                    field="options.layoutType">
                    <Select
                        options={[
                            { value: 'TreeLayout', label: '自上而下'},
                            { value: 'DoubleTreeLayout', label: '左右'}
                        ]}>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="自上而下布局类型"
                    field="options.treeLayoutType">
                    <Select
                        options={[
                            { value: 'StyleRootOnly', label: 'StyleRootOnly'},
                            { value: 'StyleLastParents', label: 'StyleLastParents'}
                        ]}>
                    </Select>
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
                        label="parent"
                        field="options.fieldNames.parent">
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="label"
                        field="options.fieldNames.label">
                        <Input />
                    </Form.Item>
                </Form.Item>
                <Form.Item
                    label="右键操作列表"
                    field="options.contextMenus">
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
                                            const contextMenus = (this.formRef.current && this.formRef.current.getFieldValue('options.contextMenus')) || [];
                                            return (
                                                <ActionPopup
                                                    action={contextMenus[index]}
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
                    label="节点高度渲染函数"
                    field="options.heightFormatterBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="节点背景色渲染函数"
                    field="options.bgFormatterBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="节点边框颜色渲染函数"
                    field="options.strokeFormatterBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="节点Icon渲染函数"
                    field="options.iconFormatterBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="节点文字颜色渲染函数"
                    field="options.colorFormatterBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="节点间隔渲染函数"
                    field="options.nodeSpacingFormatterBindVar">
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="上传节点图标">
                    <Upload
                        action={ rootPath + "/_api/minio/singleFileUpload" }
                        headers={{
                            'X-Modo-Bucket': this.props.app.name
                        }}
                        defaultFileList={node.options.iconList}
                        onChange={(files, file) => {
                            if (file.status === 'done') {
                                if (Array.isArray(node.options.iconList)) {
                                    this.formRef.current.setFieldValue('options.iconList', [
                                        ...node.options.iconList,
                                        file.response.data
                                    ]);
                                } else {
                                    this.formRef.current.setFieldValue('options.iconList', [
                                        file.response.data
                                    ]);
                                }

                            }
                        }}
                        renderUploadList={(filesList, props) => (
                            <div
                                style={{
                                    display: 'flex', marginTop: 10
                                }} >
                                {Array.isArray(node.options.iconList) && node.options.iconList.map((icon) => {
                                    const url = icon;
                                    return (
                                        <Card
                                            key={icon}
                                            hoverable
                                            style={{
                                                width: 30,
                                                marginRight: 10,
                                            }}
                                            bodyStyle={{
                                                padding: '0px 8px 2px 8px'
                                            }}
                                            cover={
                                                <img
                                                    src={icon}
                                                    style={{ width: '100%', }}
                                                />
                                            }>
                                            <Card.Meta
                                                description={(
                                                    <Typography.Text
                                                        copyable
                                                        ellipsis={{
                                                            ellipsisStr: ''
                                                        }}
                                                        style={{
                                                            marginLeft: '-2px',
                                                            width: '16px',
                                                            lineHeight: '14px'
                                                        }}>
                                                        {icon}
                                                    </Typography.Text>
                                                )}/>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}/>
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
