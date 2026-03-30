import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Grid, Trigger, Skeleton, Form, Button, Input, InputNumber, Switch, Select } from "@arco-design/web-react";
import { IconEdit, IconRefresh } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import Panel from 'packages/modo-view/designer/src/components/Panel';
import StepAttr from '../Step';
import './style/index.less';

function Popup(props) {
    const closePopup = () => {
        props.triggerRef.current.setPopupVisible(false);
    };
    const handleSave = () => {
        props.onSave(data);
        closePopup();
    };
    const [data, setData] = useState(props.step);
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
            <StepAttr
                step={props.step}
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
                        label: '步骤中文名',
                        type: 'input',
                        options: {
                            rules: [{
                                required: true
                            }]
                        }
                    },
                    {
                        name: 'id',
                        valueType: 'string',
                        defaultValue: '',
                        label: '步骤英文名',
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
            currentStepIndex: null
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
    handleSaveStep = step => {
        this.setState({
            currentStepIndex: null
        });
        const steps = this.formRef.current.getFieldValue('options.steps');
        steps[this.state.currentStepIndex] = {
            ...steps[this.state.currentStepIndex],
            ...step
        };
        this.formRef.current.setFieldValue('options.steps', [
            ...steps
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
                    label="默认当前步数"
                    field="options.defaultCurrent">
                    <InputNumber/>
                </Form.Item>
                <Form.Item
                    label="显示方向"
                    field="options.direction">
                    <Select
                        options={[
                            'vertical',
                            'horizontal'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="无连接线模式"
                    field="options.lineless"
                    triggerPropName="checked">
                    <Switch/>
                </Form.Item>
                <Form.Item
                    label="标签描述文字放置位置"
                    field="options.labelPlacement">
                    <Select
                        options={[
                            'vertical',
                            'horizontal'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="尺寸"
                    field="options.size">
                    <Select
                        options={[
                            'default',
                            'small',
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="当前步数的节点状态"
                    field="options.status">
                    <Select
                        options={[
                            'wait',
                            'process',
                            'finish',
                            'error'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="节点样式类型"
                    field="options.type">
                    <Select
                        options={[
                            'default',
                            'arrow',
                            'dot',
                            'navigation'
                        ]}/>
                </Form.Item>
                <Form.Item
                    label="禁止通过点击步骤节点改变当前步骤"
                    field="options.disabledChange"
                    triggerPropName="checked">
                    <Switch
                        size="small"
                        type="round"/>
                </Form.Item>
                <Form.Item
                    label="步骤列表"
                    field="options.steps">
                    <TableForm
                        model={this.state.model}
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
                                            return (
                                                <Popup
                                                    step={node.options.steps[index]}
                                                    stepIndex={index}
                                                    onSave={this.handleSaveStep}
                                                    triggerRef={triggerRef}/>
                                            )
                                        }}>
                                        <Button
                                            size="mini"
                                            icon={<IconEdit />}
                                            onClick={() =>{
                                                triggerRef.current.setPopupVisible(true);
                                                this.setState({
                                                    currentStepIndex: index
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
