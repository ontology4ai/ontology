import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Trigger, Skeleton, Form, Button, Input, InputNumber, Switch, Select, Radio } from "@arco-design/web-react";
import { IconEdit, IconRefresh } from 'modo-design/icon';
import IconSelect from '@/components/IconSelect';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import FieldAttr from '../Field';
import ActionAttr from '../Action';
import './style/index.less';

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
                        label: '中文名',
                        type: 'input',
                        options: {
                            rules: [{
                                required: true
                            }]
                        }
                    },
                    {
                        name: 'titleBindVar',
                        width: 30,
                        valueType: 'string',
                        defaultValue: '',
                        label: '',
                        type: 'bindVar'
                    },
                    {
                        name: 'dataIndex',
                        valueType: 'string',
                        defaultValue: '',
                        label: '英文名',
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
                    }
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
    handleRefreshFields = () => {
        const { nodes } = this.props;
        const { models } = nodes.byId[nodes.rootIds[0]].options;
        const model = models.find(model => {
            return model.name === this.props.node.options.modelName;
        });
        const fields = [];
        model.fields.forEach(field => {
            if (!this.props.node.options.columns.find(item => {
                return item.dataIndex === field.name
            })) {
                fields.push({
                    title: field.doc,
                    dataIndex: field.name
                });
            }
        });
        this.formRef.current.setFieldValue('options.columns', [
            ...this.props.node.options.columns,
            ...fields
        ]);
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
        const {
            activeNodeKey,
            nodes,
            node,
            ...rest
        } = this.props;

        const { current } = this.formRef;


        return (
            <Form
                className="table-attr-form"
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="绑定模型"
                    field="options.modelName">
                    <Select
                        options={this.state.modelOptions}/>
                </Form.Item>
                <Form.Item
                    label="字段列表"
                    field="options.columnsBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="字段列表"
                    field="options.columns"
                    noStyle>
                    <TableForm
                        model={this.state.model}
                        pagination={false}
                        rowKey="name"
                        operWidth={52}
                        sortWidth={30}
                        selectWidth={20}
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
                    label="表格行 key 的取值字段"
                    field="options.rowKeyBindVar">
                    <BindVar size="mini">
                        <Form.Item
                            field="options.rowKey"
                            noStyle>
                            <Input/>
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="默认展开的行"
                    field="options.defaultExpandedRowKeysBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="展开的行"
                    field="options.expandedRowKeysBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="选中的项"
                    field="options.rowSelection.selectedRowKeysBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="选择框的属性配置"
                    field="options.rowSelection.checkboxPropsBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>编写函数</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="是否显示为报表表格"
                    field="options.showReport"
                    triggerPropName="checked">
                    <Switch type="round" size="small" />
                </Form.Item>
                <Form.Item
                    label="是否显示表头"
                    field="options.showHeader"
                    triggerPropName="checked">
                    <Switch type="round" size="small" />
                </Form.Item>
                <Form.Item
                    label="是否显示单元格边框"
                    field="options.borderCell"
                    triggerPropName="checked">
                    <Switch type="round" size="small" />
                </Form.Item>
                <Form.Item
                    label="支持多选"
                    field="options.rowSelectBindVar">
                    <BindVar>
                        <Form.Item
                            field="options.rowSelect"
                            triggerPropName="checked"
                            noStyle>
                            <Switch type="round" size="small" />
                        </Form.Item>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="操作列宽度"
                    field="options.actionWidth">
                    <InputNumber />
                </Form.Item>
                <Form.Item
                    label="操作列按钮默认展示个数"
                    field="options.actionShowNumber">
                    <InputNumber />
                </Form.Item>
                <Form.Item
                    label="操作列按钮【更多】样式"
                    field="options.actionMoreShowType">
                    <Radio.Group
                        size="mini"
                        type="button"
                        options={[
                            { value: 'icon', label: '图标' },
                            { value: 'text', label: '文字'}
                        ]}>
                    </Radio.Group>
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                    {(values) => {
                        return values.options.actionMoreShowType === 'icon' ? (
                            <Form.Item
                                label="操作列按钮【更多】图标"
                                field="options.actionMoreIcon">
                                <IconSelect/>
                            </Form.Item>
                        ) : (
                            <Form.Item
                                label="操作列按钮【更多】文字"
                                field="options.actionMoreText">
                                <Input/>
                            </Form.Item>
                        )
                    }}
                </Form.Item>
                <Form.Item
                    label="操作列表"
                    field="options.actions">
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
                    label="滚动区域的宽度"
                    field="options.scroll.x">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="滚动区域的高度"
                    field="options.scroll.y">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="是否分页"
                    field="options.pagination.show"
                    triggerPropName="checked">
                    <Switch
                        size="small"
                        type="round"
                        onChange={(val) => {
                            const form = this.formRef.current;
                            if (val) {
                                form.setFieldValue('options.pagination.style.display', 'block');
                            } else {
                                form.setFieldValue('options.pagination.style.display', 'none');
                            }
                        }}/>
                </Form.Item>
                <Form.Item
                    label="是否显示分页总数"
                    field="options.pagination.showTotal"
                    triggerPropName="checked">
                    <Switch type="round" size="small" />
                </Form.Item>
                <Form.Item
                    label={(
                        <Form.Item
                            field="options.paginationBindVar"
                            noStyle>
                            <BindVar size="mini">分页配置</BindVar>
                        </Form.Item>
                    )}>
                    <Grid.Row
                        gutter={10}>
                        <Grid.Col
                            span={24}>
                            <Form.Item
                                label="每页数据条数"
                                field="options.pagination.pageSize">
                                <InputNumber
                                    min={0}
                                />
                            </Form.Item>
                        </Grid.Col>
                    </Grid.Row>
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
