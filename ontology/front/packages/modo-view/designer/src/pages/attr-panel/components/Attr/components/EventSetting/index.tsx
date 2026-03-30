import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Tabs, Trigger, Skeleton, Link, Form, Button, Input, InputNumber, Switch, Select, Radio } from "@arco-design/web-react";
import { IconEdit, IconRefresh, IconRole, IconTeam } from 'modo-design/icon';
import { Face, Tag } from 'modo-design';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import Editor from '@/components/Editor';
import Action from 'packages/modo-view/core/src/components/Widget/utils/Action';
import * as iconMap from 'modo-design/icon';
import './style/index.less';

const TabPane = Tabs.TabPane;

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            event: props.event || new Action(),
            visible: true,
            activeTab: props.event ? props.event.builtIn.type : 'url',
            viewActiveTab: '0'
        };
        this.formRef = React.createRef();
    }
    onValuesChange = (changeValue, values) => {
        this.props.onChange(values);
    };
    setEvent = (event) => {
        this.setState({
            event: event || new Action()
        });
    };
    handleActiveTabChange = (key) => {
        const action = this.state.event;
        action.builtIn.type = key;
        this.setState({
            activeTab: key,
            event: action
        });
        this.props.onChange(action);
    };
    handleActionChange = (changeValue, actionType) => {
        const { event } = this.state;
        const action = event;
        const subAction = action.builtIn[actionType];
        action.builtIn[actionType] = {
            ...subAction,
            ...changeValue
        };
        this.setState({
            event: action
        });

        this.props.onChange(action);
    };
    onUrlActionChange = (changeValue, values) => {
        this.handleActionChange(changeValue, 'urlAction');
    };
    onViewActionsChange = (changeValue, values) => {
        const { event} = this.state;
        const action = event;
        action.builtIn.viewActions = values.viewActions;
        this.setState({
            event: {
                ...action
            }
        });
        this.props.onChange(action);
    };
    setViewActiveTab = (key) => {
        this.setState({
            viewActiveTab: key
        });
    };
    onCallbackChange = (changeValue, values) => {
        const { event} = this.state;
        const action = event;
        action.callback = changeValue.callback;
        this.setState({
            event: action
        });
        this.props.onChange(action);
    };
    componentDidMount() {
    }
    shouldComponentUpdate(nextProps, nextState) {
        const { event } = this.props;
        const prevEvent = nextProps.event;
        if (!_.isEqual(event, prevEvent)) {
            return true;
        }
        if (!_.isEqual(nextState, this.state)) {
            return true;
        }
        return false;
    }
    componentDidUpdate(prevProps) {
    }
    render() {
        const {
            event,
            eventIndex,
            nodes,
            fragmentViews
        } = this.props;

        const { current } = this.formRef;

        const action = this.state.event;
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
                                            const currentViewActions = this.state.event.builtIn.viewActions;
                                            return (
                                                <>
                                                    <Tabs
                                                        editable
                                                        type='card-gutter'
                                                        activeTab={this.state.viewActiveTab}
                                                        onAddTab={() => {
                                                            add();
                                                            console.log(views);
                                                        }}
                                                        onDeleteTab={(key) => {
                                                            console.log(key);
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
                                                                                        <BindVar size="mini">
                                                                                            <Form.Item
                                                                                                field={view.field + 'title'}
                                                                                                noStyle>
                                                                                                <Input/>
                                                                                            </Form.Item>
                                                                                        </BindVar>
                                                                                    </Form.Item>
                                                                                </Grid.Col>
                                                                                {currentViewActions[index].showType === 'tab' ? (
                                                                                    <>
                                                                                    <Grid.Col span={12}>
                                                                                        <Form.Item
                                                                                            label="标签标识"
                                                                                            field={view.field + 'tabKeyBindVar'}>
                                                                                            <BindVar size="mini">
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
                                                                                {currentViewActions[index].showType !== 'tab' ? (
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
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes,
        fragmentViews: state.app.fragmentViews
    }
})(Attr);
