import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Tabs, Dropdown, Menu, Form, Transfer, Input, Button, Collapse, Typography } from '@arco-design/web-react';
import { IconEdit, IconDelete, IconMoreCol, IconImport } from 'modo-design/icon';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import Editor from '@/components/Editor';
import TableForm from '@/components/TableForm';
import { connect } from 'react-redux';
import ServiceAction from 'packages/modo-view/core/src/components/Widget/utils/ServiceAction';
import ServiceAttr from 'packages/modo-view/designer/src/pages/attr-panel/components/Attr/components/Service';
import transferAvscModel from '@/core/src/utils/transferAvscModel';
import genForm from 'packages/modo-view/designer/src/utils/genForm';
import genFilterForm from 'packages/modo-view/designer/src/utils/genFilterForm';
import genTable from 'packages/modo-view/designer/src/utils/genTable';
import getActions from './action';
import './style/index.less';

class ModelList extends React.Component {
    constructor(props: any) {
        super(props);

        const modelMap = {};
        this.props.view.options.models.forEach(model => {
            modelMap[model.id] = model;
        });
        const dataSource = this.props.models.map((_, index) => {
            const model = {
                key: _.name,
                value: _.doc,
                disabled: Boolean(modelMap[_.id]),
                ..._
            };
            return model
        });
        this.state = {
            currentModelIndex: null,
            modelPanelVisible: false,
            importModelPanelVisible: false,
            testData: {
                 modelData: [
                    { name: 'mmmm' }
                ]
            },
            models: [],
            model: {
                fields: [
                    {
                        name: 'name',
                        valueType: 'string',
                        defaultValue: '',
                        label: '字段名',
                        type: 'input',
                        options: {
                            rules: [{
                                required: true
                            }]
                        }
                    },
                    {
                        name: 'doc',
                        valueType: 'string',
                        defaultValue: '',
                        label: '字段中文名',
                        type: 'input'
                    },
                    {
                        name: 'renderType',
                        valueType: 'string',
                        defaultValue: 'input',
                        label: '展示类型',
                        type: 'select',
                        options: {
                            options: [
                                { value: 'input', label: '输入框' },
                                { value: 'select', label: '选择框' }
                            ]
                        }
                    },
                    {
                        name: 'defaultValue',
                        valueType: 'string',
                        defaultValue: '',
                        label: '默认值',
                        type: 'input'
                    }
                ]
            },
            event: {
                class: ServiceAction,
                fields: [
                    {
                        name: 'name',
                        valueType: 'string',
                        defaultValue: '',
                        label: '事件名',
                        type: 'input',
                        // width: 120
                    },
                    {
                        name: 'descr',
                        valueType: 'string',
                        defaultValue: '',
                        label: '事件描述',
                        type: 'input',
                        // width: 180
                    },
                    /* {
                        name: 'serviceId',
                        valueType: 'string',
                        defaultValue: '',
                        label: '绑定服务',
                        type: 'select',
                        options: {
                            options: this.props.appServices.map(service => {
                                return {
                                    label: service.description,
                                    value: service.serviceId
                                }
                            }),
                            showSearch: {
                                retainInputValue: true,
                            },
                            filterOption: (inputValue, option) => {
                                return option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                                (option.props.children && option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0)
                            },
                            renderFormat: (option, value) => {
                                return option ? (option.children) : (value);
                            },
                            allowClear: true
                        }
                    } */
                ]
            },
            modelMap,
            dataSource,
            servicePanelVisible: false,
            currentServiceIndex: null
        };
        this.modelForm = React.createRef();
        this.modelTableForm = React.createRef();
        this.importModelForm = React.createRef();
        this.serviceForm = React.createRef();
    }
    handleAddModel = (index) => {
        this.modelForm.current.setFieldsValue({
            name: null,
            descr: null,
            value: null
        });
        this.handleOpenModelPanel();
    };
    handleDeleteModel = (index) => {
        const { models } = this.props.view.options;
        const { modelMap, dataSource } = this.state;
        const { appModelMap } = this.props;
        delete modelMap[models[index].name];
        appModelMap[models[index].name].disabled = false;
        dataSource.find(model => {
            return model.name === models[index].name
        }).disabled = false;
        models.splice(index, 1);

        this.setModels();
        this.setState({
            modelMap,
            appModelMap,
            dataSource
        })
    };
    handleEditModel = (index) => {
        this.setState({
            currentModelIndex: index
        });
        const model = this.props.view.options.models[index];
        this.modelForm.current.setFieldsValue({
            name: model.name,
            doc: model.doc,
            fields: [...model.fields],
            events: model.events ? [...model.events] : []
        });
        this.handleOpenModelPanel();
    };
    handleSaveModel = () => {
        const { models } = this.props.view.options;
        const { currentModelIndex } = this.state;
        let index = currentModelIndex;
        if (currentModelIndex === null) {
            index = models.length;
        }
        models[index] = {
            ...models[index],
            ...this.modelForm.current.getFieldsValue()
        };
        // this.setModels();
    };
    handleSetModelPanelVisible = (val) => {
        this.setState({
            modelPanelVisible: val
        });
    };
    handleCloseModelPanel = () => {
        this.handleSetModelPanelVisible(false);
        this.setState({
            currentModelIndex: null
        })
    };
    handleOpenModelPanel = () => {
        this.handleSetModelPanelVisible(true);
    };
    setModels = () => {
        const { view } = this.props;
        const { models } = view.options;
        if (models) {
            view.options.models = [
                ...models
            ];
        } else {
            view.options.models = [];
        }
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: view.id,
            currentNode: view
        });
    };
    handleModelChange = (data) => {
    };
    handleImportModels = () => {
        this.setState({
            importModelPanelVisible: true
        });
    };
    handleCloseImportModelPanel = () => {
        this.setState({
            importModelPanelVisible: false
        });
    };
    handleSaveImportModel = () => {
        const values = this.importModelForm.current.getFieldsValue();
        let innerModels = [];
        const { modelMap } = this.state;
        const { appModelMap } = this.props;
        values.modelData.forEach(name => {
            if (!modelMap[name]) {
                const innerModel = transferAvscModel(appModelMap[name]);
                innerModel.fields = innerModel.fields.map(field => {
                    return {
                        name: field.name,
                        columnName: field.columnName,
                        doc: field.doc,
                        type: field.type,
                        length: field.length,
                        primary: field.primary,
                        renderType: 'input',
                        defaultValue: null
                    }
                });
                delete innerModel.fieldsDelMappers;
                innerModel.events = this.props.appServices.filter(service => {
                    return service.name && service.name.toLocaleLowerCase() === innerModel.name.toLocaleLowerCase();
                });
                innerModel.events = innerModel.events.map(event => {
                    const service = new ServiceAction();
                    service.descr = event.description.replace(innerModel.doc, '');
                    return {
                        ...service,
                        ...event,
                        method: event.methodType,
                        name: event.methodName,
                        placeholders: event.placeholders.map(p => {
                            return {
                                key: p,
                                value: ''
                            }
                        })
                    };
                });
                innerModels.push(innerModel);
                modelMap[name] = innerModel;
                appModelMap[name].disabled = true;
            }
        });
        this.setState({
            modelMap,
            appModelMap,
            dataSource: this.state.dataSource
        });
        this.props.view.options.models = [
            ...this.props.view.options.models,
            ...innerModels
        ];
        this.setModels();
    };
    handleGenerateForm = (index) => {
        const model = this.props.view.options.models[index];
        const node = genForm(model);
        this.props.dispatch({
            type: 'ADDNODE',
            node,
            parentNodeKey: '0'
        });
    };
    handleGenerateFilterForm = (index) => {
        const model = this.props.view.options.models[index];
        const node = genFilterForm(model);
        this.props.dispatch({
            type: 'ADDNODE',
            node,
            parentNodeKey: '0'
        });
    };
    handleGenerateTable = (index) => {
        const model = this.props.view.options.models[index];
        const node = genTable(model);
        this.props.dispatch({
            type: 'ADDNODE',
            node,
            parentNodeKey: '0'
        });
    };
    handleGenerateView = (index) => {
        const model = this.props.view.options.models[index];
    };
    handleEditEvent = (record, index) => {
        this.handleSetServicePanelVisible(true);
        this.setState({
            currentServiceIndex: index
        });
        this.serviceForm.current.setFieldsValue(record);
    };
    handleCloseServicePanel = () => {
        this.handleSetServicePanelVisible(false);
    };
    handleSaveService = () => {
        const { currentModelIndex, currentServiceIndex } = this.state;
        const values = this.modelForm.current.getFieldsValue();
        values.events[currentServiceIndex] = {
            ...values.events[currentServiceIndex],
            ...this.serviceForm.current.getFieldsValue()
        };
        this.modelForm.current.setFieldsValue({
            ...values
        })
    };
    handleSetServicePanelVisible = (val) => {
        this.setState({
            servicePanelVisible: val
        });
    };
    render() {
        const {
            visible
        } = this.props;
        let models = this.props.viewModels;
        if (!models) {
            this.setModels();
        }

        models = models || [];

        const { dataSource } = this.state;

        return (
            <>
                <div
                    className="modo-design-model-list"
                    style={{
                        display: visible ? 'block' : 'none',
                        ...this.props.style
                    }}>
                    <div
                        className="header">
                        <Button
                            onClick={this.handleAddModel}
                            style={{
                                marginBottom: '10px'
                            }}>
                            添加模型
                        </Button>
                        <Button
                            onClick={this.handleImportModels}
                            icon={<IconImport/>}
                            style={{
                                marginBottom: '10px'
                            }}>
                        </Button>
                    </div>
                    {
                        models.length > 0 ? (
                            <Collapse
                                accordion>
                                {
                                    models.map((item, index) => {
                                        return (
                                            <Collapse.Item
                                                key={index}
                                                name={index.toString()}
                                                header={(
                                                    <>
                                                        <Typography.Paragraph
                                                            style={{
                                                                width: 'auto',
                                                                marginBottom: '0px'
                                                            }}
                                                            ellipsis={
                                                                {
                                                                    showTooltip: true
                                                                }
                                                            }>
                                                            {item.doc}
                                                        </Typography.Paragraph>
                                                    </>
                                                )}
                                                extra={(
                                                    <div
                                                        className="model-oper">
                                                        <Dropdown.Button
                                                            type='secondary'
                                                            size="mini"
                                                            icon={<IconMoreCol />}
                                                            onClick={() => this.handleEditModel(index)}
                                                            droplist={(
                                                                <Menu>
                                                                    <Menu.Item
                                                                        onClick={() => {
                                                                            this.handleGenerateForm(index);
                                                                        }}>
                                                                        生成表单
                                                                    </Menu.Item>
                                                                    <Menu.Item
                                                                        onClick={() => {
                                                                            this.handleGenerateFilterForm(index);
                                                                        }}>
                                                                        生成筛选表单
                                                                    </Menu.Item>
                                                                    <Menu.Item
                                                                        onClick={() => {
                                                                            this.handleGenerateTable(index);
                                                                        }}>
                                                                        生成表格
                                                                    </Menu.Item>
                                                                    <Menu.Item
                                                                        onClick={() => {
                                                                            this.handleGenerateView(index);
                                                                        }}>
                                                                        生成增删改查视图
                                                                    </Menu.Item>
                                                                    <Menu.Item
                                                                        onClick={() => {
                                                                            this.handleDeleteModel(index)
                                                                        }}>
                                                                        删除
                                                                    </Menu.Item>
                                                               </Menu>
                                                            )}>
                                                            <IconEdit/>
                                                        </Dropdown.Button>
                                                    </div>
                                                )}>
                                                {item.descr}
                                            </Collapse.Item>
                                        )
                                    })
                                }
                            </Collapse>
                        ) : null
                    }
                </div>
                <Panel
                    mask={this.props.modelMask}
                    style={{
                        left: '300px',
                        top: '50px',
                        width: '800px',
                        height: 'calc(100% - 50px)',
                        ...this.props.modelStyle
                    }}
                    title="编辑模型"
                    visible={this.state.modelPanelVisible}
                    onClose={this.handleCloseModelPanel}
                    onSave={this.handleSaveModel}
                    onCancel={this.handleCloseModelPanel}>
                    <Form
                        ref={this.modelForm}
                        layout="vertical"
                        onValuesChange={(_, values) => {
                            // console.log(_, values);
                        }}>
                        <Tabs
                            type="capsule">
                            <Tabs.TabPane
                                key="base"
                                title="基本信息">
                                <Grid.Row>
                                    <Grid.Col
                                        span={12}>
                                        <Form.Item
                                            field="name"
                                            label="模型名">
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            field="doc"
                                            label="模型中文名">
                                            <Input/>
                                        </Form.Item>
                                    </Grid.Col>
                                </Grid.Row>
                            </Tabs.TabPane>
                            <Tabs.TabPane
                                key="fields"
                                title="字段列表">
                                <Form.Item
                                    field="fields"
                                    noStyle>
                                    <TableForm
                                        model={this.state.model}
                                        pagination={false}
                                        rowKey="name"/>
                                </Form.Item>
                            </Tabs.TabPane>
                            <Tabs.TabPane
                                key="events"
                                title="事件列表">
                                <Form.Item
                                    field="events"
                                    noStyle>
                                    <TableForm
                                        model={this.state.event}
                                        pagination={false}
                                        rowKey="url"
                                        operWidth={70}
                                        rowExtra={(col, record, index) => (
                                            <Button
                                                size="mini"
                                                icon={<IconEdit />}
                                                onClick={() => this.handleEditEvent(record, index)}>
                                            </Button>
                                        )}/>
                                </Form.Item>
                            </Tabs.TabPane>
                        </Tabs>
                    </Form>
                </Panel>
                <Panel
                    mask={this.props.modelMask}
                    style={{
                        left: '300px',
                        top: '50px',
                        width: '600px',
                        height: 'calc(100% - 50px)',
                        ...this.props.modelStyle
                    }}
                    title="导入模型"
                    visible={this.state.importModelPanelVisible}
                    onClose={this.handleCloseImportModelPanel}
                    onSave={this.handleSaveImportModel}
                    onCancel={this.handleCloseImportModelPanel}>
                    <Form
                        ref={this.importModelForm}
                        layout="vertical"
                        style={{
                            height: '100%'
                        }}
                        onValuesChange={(_, values) => {
                            // console.log(_, values);
                        }}>
                        <Form.Item
                            label="模型名"
                            field="modelData"
                            noStyle>
                            <Transfer
                                simple
                                showSearch
                                pagination={{
                                    pageSize: 20
                                }}
                                style={{
                                    height: '100%'
                                }}
                                key="name"
                                dataSource={dataSource}
                                defaultTargetKeys={[]}
                                defaultSelectedKeys={[]}
                                titleTexts={['可选模型列表', '已选中模型列表']}
                                listStyle={{
                                    width: '100%',
                                    height: '100%'
                                }}/>
                        </Form.Item>
                    </Form>
                </Panel>
                <ServiceAttr
                    ref={this.serviceForm}
                    style={{
                        width: '50%',
                        left: '25%',
                        top: '50px',
                        height: 'calc(100% - 100px)'
                    }}
                    mask={true}
                    visible={this.state.servicePanelVisible}
                    onClose={this.handleCloseServicePanel}
                    onSave={this.handleSaveService}
                    autoLoadHidden={true}
                    />
            </>
        );
    }
}

export default connect((state, ownProps) => {
    const view = state.nodes.byId[state.nodes.rootIds[0]];
    return {
        view,
        viewModels: view.options.models,
        models: state.app.models,
        appModelMap: state.app.modelMap,
        appServices: state.app.services,
        appServiceMap: state.app.serviceMap
    }
})(ModelList);
