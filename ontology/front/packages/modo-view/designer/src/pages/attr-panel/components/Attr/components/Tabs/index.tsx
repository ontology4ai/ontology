import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Trigger, Skeleton, Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
import { IconEdit, IconRefresh } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import TabAttr from '../Tab';
import './style/index.less';

function Popup(props) {
    const closePopup = () => {
        props.triggerRef.current.setPopupVisible(false);
    };
    const handleSave = () => {
        props.onSave(data);
        closePopup();
    };
    const [data, setData] = useState(props.tab);
    return (
        <Panel
            style={{
                width: '300px',
                top: '50px',
                left: 'auto',
                right: '300px',
                height: 'calc(100% - 50px)'
            }}
            title="选项卡属性"
            visible={true}
            onSave={handleSave}
            onClose={closePopup}
            onCancel={closePopup}>
            <TabAttr
                tab={props.tab}
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
                        label: '选项卡中文名',
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
                        name: 'key',
                        valueType: 'string',
                        defaultValue: '',
                        label: '选项卡英文名',
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
            currentTabIndex: null
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
    handleSaveTab = tab => {
        this.setState({
            currentTabIndex: null
        });
        const tabs = this.formRef.current.getFieldValue('options.tabs');
        tabs[this.state.currentTabIndex] = {
            ...tabs[this.state.currentTabIndex],
            ...tab
        };
        this.formRef.current.setFieldValue('options.tabs', [
            ...tabs
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
                ref={this.formRef}
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="默认选中选项卡标识"
                    field="options.defaultActiveTab">
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="选项卡类型"
                    field="options.type">
                    <Select
                        options={[
                            'line',
                            'card',
                            'card-gutter',
                            'text',
                            'rounded',
                            'capsule'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="尺寸"
                    field="options.size">
                    <Select
                        options={[
                            'mini',
                            'small',
                            'default',
                            'large'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="选项卡位置"
                    field="options.tabPosition">
                    <Select
                        options={[
                            'left',
                            'right',
                            'top',
                            'bottom'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="是否为动态标签"
                    field="options.edit"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="选项卡方向"
                    field="options.direction">
                    <Select
                        options={[
                            'horizontal',
                            'vertical'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="懒加载"
                    field="options.lazyload"
                    triggerPropName="checked">
                    <Switch size="small" type="round"/>
                </Form.Item>
                <Form.Item
                    label="选项卡列表"
                    field="options.tabs">
                    <TableForm
                        model={this.state.model}
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
                                            return (
                                                <Popup
                                                    tab={node.options.tabs[index]}
                                                    tabIndex={index}
                                                    onSave={this.handleSaveTab}
                                                    triggerRef={triggerRef}/>
                                            )
                                        }}>
                                        <Button
                                            size="mini"
                                            icon={<IconEdit />}
                                            onClick={() =>{
                                                triggerRef.current.setPopupVisible(true);
                                                this.setState({
                                                    currentTabIndex: index
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
