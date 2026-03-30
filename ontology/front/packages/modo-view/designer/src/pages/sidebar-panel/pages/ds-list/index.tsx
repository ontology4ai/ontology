import React, { useState, useEffect, useMemo } from 'react';
import { Form, Input, Button, Collapse, Typography, Switch, Radio, Select, Popconfirm } from '@arco-design/web-react';
import { IconEdit, IconDelete } from 'modo-design/icon';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import Editor from '@/components/Editor';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import ServiceAction from 'packages/modo-view/core/src/components/Widget/utils/ServiceAction';
import { connect } from 'react-redux';
import { IconDragDotVertical } from '@arco-design/web-react/icon';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { arrayMoveMutable, arrayMoveImmutable } from 'array-move';
import ServiceAttr from 'packages/modo-view/designer/src/pages/attr-panel/components/Attr/components/Service';
import './style/index.less';

const VarDragHandle = SortableHandle(() => (
    <IconDragDotVertical
        style={{
            cursor: 'move',
            color: '#555',
        }}
    />
));

const VarSortableItem = SortableElement(({sortIndex, item, handleEdit, handleDelete, ...rest}) => {
    return (
        <Collapse.Item
            key={sortIndex}
            name={sortIndex.toString()}
            header={(
                <>
                    <span className="label">变量：</span>
                    <span className="value">{item.name}</span>
                </>
            )}
            extra={(
                <div
                    className="var-oper">
                    <VarDragHandle/>
                    <IconEdit
                        onClick={() => handleEdit(sortIndex)}/>
                    <Popconfirm
                        title='确认删除?'
                        onOk={() => {
                            handleDelete(sortIndex)
                        }}>
                        <IconDelete
                            style={{
                                marginLeft: '6px'
                            }}/>
                    </Popconfirm>
                </div>
            )}>
            {item.descr}
        </Collapse.Item>
    )
});

const VarSortableList = SortableContainer(({items, handleEdit, handleDelete}) => {
    return (
        <Collapse accordion>
            {items.map((item, index) => {
                return(
                    <VarSortableItem
                        key={index}
                        index={index}
                        sortIndex={index}
                        item={item}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete} />
                )
            })}
        </Collapse>
    );
});

class DsList extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            currentVarIndex: null,
            varPanelVisible: false,
            currentServiceIndex: null,
            servicePanelVisible: false
        };
        this.varForm = React.createRef();
        this.serviceForm = React.createRef();
    }
    handleAddVar = (index) => {
        this.varForm.current.setFieldsValue({
            name: null,
            descr: null,
            value: null
        });
        this.handleOpenVarPanel();
    };
    handleDeleteVar = (index) => {
        const { vars } = this.props.view.options;
        vars.splice(index, 1);
        this.setVars();
    };
    handleEditVar = (index) => {
        this.setState({
            currentVarIndex: index
        });
        this.varForm.current.setFieldsValue(this.props.view.options.vars[index]);
        this.handleOpenVarPanel();
    };
    handleSaveVar = () => {
        const { vars } = this.props.view.options;
        const { currentVarIndex } = this.state;
        let index = currentVarIndex;
        if (currentVarIndex === null) {
            index = vars.length;
        }
        vars[index] = {
            ...vars[index],
            ...this.varForm.current.getFieldsValue()
        };
        this.setVars();
    };
    handleSetVarPanelVisible = (val) => {
        this.setState({
            varPanelVisible: val
        });
    };
    handleCloseVarPanel = () => {
        this.handleSetVarPanelVisible(false);
        this.setState({
            currentVarIndex: null
        })
    };
    handleOpenVarPanel = () => {
        this.handleSetVarPanelVisible(true);
    };
    setVars = () => {
        const { view } = this.props;
        const { vars } = view.options;
        if (vars) {
            view.options.vars = [...vars];
        } else {
            view.options.vars = [];
        }
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: view.id,
            currentNode: view
        });
    };
    handleAddService = (index) => {
        this.serviceForm.current.setFieldsValue(new ServiceAction());
        this.handleOpenServicePanel();
    };
    handleDeleteService = (index) => {
        const { services } = this.props.view.options;
        services.splice(index, 1);
        this.setVars();
    };
    handleEditService = (index) => {
        this.setState({
            currentServiceIndex: index
        });
        this.serviceForm.current.setFieldsValue(this.props.view.options.services[index]);
        this.handleOpenServicePanel();
    };
    handleSaveService = () => {
        const { services } = this.props.view.options;
        const { currentServiceIndex } = this.state;
        let index = currentServiceIndex;
        if (currentServiceIndex === null) {
            index = services.length;
        }
        services[index] = {
            ...services[index],
            ...this.serviceForm.current.getFieldsValue()
        };
        this.setServices();
    };
    handleSetServicePanelVisible = (val) => {
        this.setState({
            servicePanelVisible: val
        });
    };
    handleCloseServicePanel = () => {
        this.handleSetServicePanelVisible(false);
        this.setState({
            currentServiceIndex: null
        })
    };
    handleOpenServicePanel = () => {
        this.handleSetServicePanelVisible(true);
    };
    setServices = () => {
        const { view } = this.props;
        const { services } = view.options;
        if (services) {
            view.options.services = services;
        } else {
            view.options.services = [];
        }
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: view.id,
            currentNode:
             view
        });
    };
    onVarsSortEnd = ({oldIndex, newIndex}) => {
        const { view } = this.props;
        const { vars } = view.options;
        view.options.vars = arrayMoveImmutable(vars, oldIndex, newIndex);
        this.setVars();
    };
    componentDidMount() {
        let {
            vars,
            services
        } = this.props;
        if (!vars) {
            this.setVars();
        }

        if (!services) {
            this.setServices();
        }
    }
    render() {
        const {
            visible
        } = this.props;
        let {
            vars,
            services,
            appServices,
            appServiceMap
        } = this.props;
        vars = vars || [];

        services = services || [];

        return (
            <>
                <div
                    className="modo-design-ds-list"
                    style={{
                        display: visible ? 'block' : 'none',
                        ...this.props.style
                    }}>
                    <Button.Group>
                        <Button
                            onClick={this.handleAddVar}
                            style={{
                                marginBottom: '10px'
                            }}>
                            添加变量
                        </Button>
                        <Button
                            onClick={this.handleAddService}
                            style={{
                                marginBottom: '10px'
                            }}>
                            添加远程API服务
                        </Button>
                    </Button.Group>
                    <br/>
                    <Typography.Text
                        style={{
                            lineHeight: '30px',
                            display: 'block'
                        }}>
                        变量列表
                    </Typography.Text>
                    {
                        vars.length > 0 ? (
                            <VarSortableList
                                items={vars}
                                handleEdit={this.handleEditVar}
                                handleDelete={this.handleDeleteVar}
                                onSortEnd={this.onVarsSortEnd}
                                useDragHandle/>
                        ) : null
                    }
                    <Typography.Text
                        style={{
                            lineHeight: '30px',
                            display: 'block'
                        }}>
                        服务列表
                    </Typography.Text>
                    {
                        services.length > 0 ? (
                            <Collapse
                                accordion>
                                {
                                    services.map((item, index) => {
                                        return (
                                            <Collapse.Item
                                                key={index}
                                                name={index.toString()}
                                                header={(
                                                    <>
                                                        <span className="label">服务：</span>
                                                        <span className="value">{item.name}</span>
                                                        { item.descr ? <div>
                                                            <span>描述: </span>
                                                            <span> {item.descr}</span>
                                                        </div> : null}
                                                    </>
                                                )}
                                                extra={(
                                                    <div
                                                        className="var-oper">
                                                        <IconEdit
                                                            onClick={() => this.handleEditService(index)}/>
                                                        <Popconfirm
                                                            title='确认删除?'
                                                            onOk={() => {
                                                                this.handleDeleteService(index)
                                                            }}>
                                                            <IconDelete
                                                                style={{
                                                                    marginLeft: '6px'
                                                                }}/>
                                                        </Popconfirm>
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
                    style={{
                        width: '400px',
                        left: '300px',
                        top: '50px',
                        height: 'calc(100% - 50px)',
                        ...this.props.panelStyle
                    }}
                    mask={this.props.panelMask}
                    title="编辑变量"
                    visible={this.state.varPanelVisible}
                    onClose={this.handleCloseVarPanel}
                    onSave={this.handleSaveVar}
                    onCancel={this.handleCloseVarPanel}>
                    <Form
                        ref={this.varForm}
                        layout="vertical">
                        <Form.Item
                            label="变量名"
                            field="name">
                            <Input/>
                        </Form.Item>
                        <Form.Item
                            label="描述"
                            field="descr">
                            <Input/>
                        </Form.Item>
                        <Form.Item
                            label="数据">
                            <Form.Item
                                field="value"
                                noStyle>
                                <Editor/>
                            </Form.Item>
                            <Typography.Text type='secondary'>
                                输入框内默认支持变量写法和JS写法完全一致
                            </Typography.Text>
                        </Form.Item>
                    </Form>
                </Panel>

                <ServiceAttr
                    ref={this.serviceForm}
                    style={this.props.panelStyle}
                    mask={this.props.panelMask}
                    visible={this.state.servicePanelVisible}
                    onClose={this.handleCloseServicePanel}
                    onSave={this.handleSaveService}
                    />
            </>
        );
    }
}

export default connect((state, ownProps) => {
    const view = state.nodes.byId[state.nodes.rootIds[0]];
    return {
        view,
        vars: view.options.vars,
        services: view.options.services,
        appServices: state.app.services,
        appServiceMap: state.app.serviceMap
    }
})(DsList);
