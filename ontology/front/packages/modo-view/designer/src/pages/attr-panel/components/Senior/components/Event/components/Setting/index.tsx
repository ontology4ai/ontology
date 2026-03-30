import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { connect } from 'react-redux';
import Editor from '@/components/Editor';
import TableForm from '@/components/TableForm';
import ViewAction from 'packages/modo-view/core/src/components/Widget/utils/ViewAction';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import { Dropdown, Menu, Modal, Tabs, Grid, Form, Input, Switch, Select } from '@arco-design/web-react';

import './style/index.less';

const TabPane = Tabs.TabPane;

class Setting extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: true,
            activeTab: props.event.nodeKey ? props.action.builtIn.type : 'url',
            serviceActiveTab: '0',
            viewActiveTab: '0',
            node: {}
        };
    }
    handleOpen = () => {
        this.setState({
            visible: true,
            node: JSON.parse(JSON.stringify(this.props.node))
        });
    };
    handleClose = () => {
        this.setState({
            visible: false
        });
        this.props.dispatch({
            type: 'SETACTIVEEVENT',
            nodeKey: null,
            eventType: null
        })
    };
    handleOnOk = () => {
        this.handleClose();
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: this.state.node
        });
    };
    handleOnCancel = () => {
        this.handleClose();
    };
    handleActionChange = (changeValue, actionType) => {
        const { event } = this.props;
        const { node } = this.state;
        const action = node.options.eventMap[event.eventType];
        const subAction = action.builtIn[actionType];
        action.builtIn[actionType] = {
            ...subAction,
            ...changeValue
        };

        this.setState({
            node: node
        });
    };
    onUrlActionChange = (changeValue, values) => {
        this.handleActionChange(changeValue, 'urlAction');
    };
    onViewActionsChange = (changeValue, values) => {
        const { event } = this.props;
        const { node } = this.state;
        const action = node.options.eventMap[event.eventType];
        action.builtIn.viewActions = values.viewActions;
        this.setState({
            node: node
        });
    };
    onServiceActionsChange = (changeValue, values) => {
        const { event } = this.props;
        const { node } = this.state;
        const action = node.options.eventMap[event.eventType];
        action.builtIn.serviceActions = values.viewActions;
        this.setState({
            node: node
        });
    };
    onCallbackChange = (changeValue, values) => {
        const { event } = this.props;
        const { node } = this.state;
        const action = node.options.eventMap[event.eventType];
        action.callback = changeValue.callback;
        this.setState({
            node: node
        });
    };
    handleActiveTabChange = (key) => {
        const { event } = this.props;
        const { node } = this.state;
        const action = node.options.eventMap[event.eventType];
        this.setState({
            activeTab: key
        });

        action.builtIn.type = key;

        this.setState({
            node: node
        });
    };
    setServiceActiveTab = (key) => {
        this.setState({
            serviceActiveTab: key
        });
    };
    handleAddServiceTab = () => {

    };
    handleDeleteServiceTab = () => {

    };
    setViewActiveTab = (key) => {
        this.setState({
            viewActiveTab: key
        });
    };
    handleAddViewTab = () => {

    };
    handleDeleteViewTab = () => {

    };
    componentWillUpdate(nextProps, nextState) {
        if (this.props.event.nodeKey === null && nextProps.event.nodeKey !== null) {
            this.handleOpen();
        }
        if (!this.props.action && nextProps.action) {
            this.setState({
                activeTab: nextProps.action.builtIn.type
            });
        }
        if (this.props.action && nextProps.action && this.props.action.builtIn.type !== nextProps.action.builtIn.type ) {
            this.setState({
                activeTab: nextProps.action.builtIn.type
            });
        }
    }
    render() {
        const {
            nodes,
            event,
            fragmentViews
        } = this.props;

        if (event.nodeKey === null) {
            return <></>
        }

        const {
            node
        } = this.state;
        if (!node.options) {
            return <></>
        }

        const action = node.options.eventMap[event.eventType];
        const {
            urlAction,
            serviceActions,
            viewActions,
            actions
        } = action.builtIn;

        let tabNodes = [];
        for (let key in nodes.byId) {
            if (nodes.byId[key].type === 'tabs') {
                tabNodes.push(nodes.byId[key]);
            }
        }

        return (
            <div
                className="modo-designer-event-setting"
                key={event.nodeKey + event.eventType}>
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
                    <Tabs
                        type="line">
                        <TabPane
                            key="builtIn"
                            title="内置动作">
                            <Tabs
                                type="capsule"
                                defaultActiveTab="url"
                                activeTab={this.state.activeTab}
                                onChange={this.handleActiveTabChange}>
                                <TabPane
                                    key="url"
                                    title="打开URL">
                                    <Form
                                        initialValues={urlAction}
                                        onValuesChange={this.onUrlActionChange}>
                                        <Form.Item noStyle>
                                            <Grid.Row gutter={15}>
                                                <Grid.Col flex="auto">
                                                    <Form.Item
                                                        label="URL"
                                                        field="url"
                                                        labelAlign="left"
                                                        labelCol={{
                                                            flex: "40px"
                                                        }}
                                                        wrapperCol={{
                                                            flex: '1'
                                                        }}>
                                                        <Input/>
                                                    </Form.Item>
                                                </Grid.Col>
                                                <Grid.Col flex="140px">
                                                    <Form.Item
                                                        label="新开页面"
                                                        field="blank"
                                                        labelAlign="left"
                                                        triggerPropName="checked"
                                                        labelCol={{
                                                            flex: "70px"
                                                        }}
                                                        wrapperCol={{
                                                            flex: '1'
                                                        }}>
                                                        <Switch/>
                                                    </Form.Item>
                                                </Grid.Col>
                                            </Grid.Row>
                                        </Form.Item>
                                    </Form>
                                </TabPane>
                                <TabPane
                                    key="view"
                                    title="打开其他视图">
                                    <Form
                                        layout="vertical"
                                        labelAlign="left"
                                        initialValues={action.builtIn}
                                        onValuesChange={this.onViewActionsChange}>
                                        <Form.Item>
                                            <Form.List
                                                field="viewActions">
                                                {(views, { add, remove, move }) => {
                                                    return (
                                                        <>
                                                            <Tabs
                                                                editable
                                                                type='card-gutter'
                                                                activeTab={this.state.viewActiveTab}
                                                                onAddTab={() => {
                                                                    add(new ViewAction());
                                                                }}
                                                                onDeleteTab={(key) => {
                                                                    remove(Number(key));
                                                                }}
                                                                onChange={this.setViewActiveTab}>
                                                                {
                                                                    views.map((view, index) => {
                                                                        return (
                                                                            <TabPane
                                                                                destroyOnHide
                                                                                key={index}
                                                                                title={`视图-` + (index + 1)}
                                                                                style={{
                                                                                    padding: '10px'
                                                                                }}>
                                                                                <Form.Item
                                                                                    noStyle>
                                                                                    <Grid.Row gutter={15}>
                                                                                        <Grid.Col span={12}>
                                                                                            <Form.Item
                                                                                                label="视图显示条件"
                                                                                                field={view.field + '.condition'}>
                                                                                                <Input/>
                                                                                            </Form.Item>
                                                                                        </Grid.Col>
                                                                                        <Grid.Col span={12}>
                                                                                            <Form.Item
                                                                                                label="绑定视图"
                                                                                                field={view.field + '.viewName'}>
                                                                                                <Select
                                                                                                    showSearch
                                                                                                    filterOption={(inputValue, option) =>
                                                                                                        option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                                                                                                        option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                                                                                                    }
                                                                                                    options={fragmentViews.map(view => {
                                                                                                        return {
                                                                                                            value: view.name,
                                                                                                            label: view.label
                                                                                                        };
                                                                                                    })}/>
                                                                                            </Form.Item>
                                                                                        </Grid.Col>

                                                                                    </Grid.Row>
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    noStyle>
                                                                                    <Grid.Row gutter={15}>
                                                                                        <Grid.Col span={12}>
                                                                                            <Form.Item
                                                                                                label="视图显示方式"
                                                                                                field={view.field + '.showType'}>
                                                                                                <Select
                                                                                                    showSearch
                                                                                                    options={[
                                                                                                        { value: 'modal', label: '对话框' },
                                                                                                        { value: 'drawer', label: '抽屉' },
                                                                                                        { value: 'tab', label: '挂窗' }
                                                                                                    ]}/>
                                                                                            </Form.Item>
                                                                                        </Grid.Col>
                                                                                        <Grid.Col span={12}>
                                                                                            <Form.Item
                                                                                                label="显示标题"
                                                                                                field={view.field + 'titleBindVar'}>
                                                                                                <BindVar>
                                                                                                    <Form.Item
                                                                                                        field={view.field + 'title'}
                                                                                                        noStyle>
                                                                                                        <Input/>
                                                                                                    </Form.Item>
                                                                                                </BindVar>
                                                                                            </Form.Item>
                                                                                        </Grid.Col>
                                                                                        {viewActions[index].showType === 'tab' ? (
                                                                                            <>
                                                                                            <Grid.Col span={12}>
                                                                                                <Form.Item
                                                                                                    label="标签标识"
                                                                                                    field={view.field + 'tabKeyBindVar'}>
                                                                                                    <BindVar>
                                                                                                        <Form.Item
                                                                                                            field={view.field + 'tabKey'}
                                                                                                            noStyle>
                                                                                                            <Input/>
                                                                                                        </Form.Item>
                                                                                                    </BindVar>
                                                                                                </Form.Item>
                                                                                            </Grid.Col>
                                                                                            <Grid.Col span={12}>
                                                                                                <Form.Item
                                                                                                    label="视图挂载实例"
                                                                                                    field={view.field + '.tabNodeName'}>
                                                                                                    <Select
                                                                                                        showSearch
                                                                                                        options={tabNodes.map(tab => {
                                                                                                            return {
                                                                                                                value: tab.name,
                                                                                                                label: tab.label
                                                                                                            }
                                                                                                        })}/>
                                                                                                </Form.Item>
                                                                                            </Grid.Col>
                                                                                            </>
                                                                                        ) : null}
                                                                                        {viewActions[index].showType !== 'tab' ? (
                                                                                            <Grid.Col span={12}>
                                                                                                <Form.Item
                                                                                                    label="宽度"
                                                                                                    field={view.field + '.width'}>
                                                                                                    <Select
                                                                                                        showSearch
                                                                                                        options={[
                                                                                                            { value: '30%', label: '30%' },
                                                                                                            { value: '50%', label: '50%' },
                                                                                                            { value: '75%', label: '75%' },
                                                                                                            { value: '100%', label: '100%' }
                                                                                                        ]}/>
                                                                                                </Form.Item>
                                                                                            </Grid.Col>
                                                                                        ) : null}
                                                                                    </Grid.Row>
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="传递参数给视图"
                                                                                    field={view.field + '.params'}>
                                                                                    <Editor>
                                                                                    </Editor>
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="打开视图前调用函数"
                                                                                    field={view.field + '.before'}>
                                                                                    <Editor>
                                                                                    </Editor>
                                                                                </Form.Item>
                                                                            </TabPane>
                                                                        )
                                                                    })
                                                                 }
                                                            </Tabs>
                                                        </>
                                                    )
                                                }}
                                            </Form.List>
                                        </Form.Item>
                                    </Form>
                                </TabPane>
                                {/*<TabPane
                                    key="action"
                                    title="执行视图其他组件内置函数">
                                    <TableForm></TableForm>
                                </TabPane>*/}
                            </Tabs>
                        </TabPane>
                        <TabPane
                            key="callback"
                            title="回调函数">
                            <Form
                                layout="vertical"
                                labelAlign="left"
                                initialValues={action}
                                onValuesChange={this.onCallbackChange}>
                                <Form.Item
                                    noStyle
                                    field="callback">
                                    <Editor
                                        height="350px">
                                    </Editor>
                                </Form.Item>
                            </Form>
                        </TabPane>
                    </Tabs>
                </Modal>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    const node = state.nodes.byId[state.activeNodeKey];
    const { event } = state;
    return {
        event,
        nodes: state.nodes,
        activeNodeKey: state.activeNodeKey,
        node,
        action: node.options.eventMap[event.eventType],
        fragmentViews: state.app.fragmentViews
    }
})(Setting);
