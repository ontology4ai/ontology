import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Collapse, Grid, Form, Button, Input, Switch, Select, InputNumber } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import { IconDelete } from 'modo-design/icon';
import './style/index.less';

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
        this.formRef = React.createRef();
    }
    onValuesChange = (changeValue, values) => {
        let fullValues = this.formRef.current.getFieldsValue();
        fullValues.options = {
            ...fullValues.options,
            ...values.options
        };
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: fullValues
        })
    };
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
                    label="数据"
                    field="options.dataBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="图例"
                    field="options.legendBindVar">
                    <BindVar size="mini">
                        <span style={{ lineHeight: '24px' }}>绑定变量</span>
                    </BindVar>
                </Form.Item>
                <Form.Item
                    label="x轴字段"
                    field="options.xField">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="x轴字段中文名"
                    field={`options.meta.${node.options.xField}.alias`}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="y轴字段"
                    field="options.yField">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="y轴字段中文名"
                    field={`options.meta.${node.options.yField}.alias`}>
                    <Input />
                </Form.Item>
                <Collapse className="chart-collapse">
                    <Collapse.Item header="X轴属性配置" name='x'>
                        <Form.Item
                            label="显示x轴"
                            field={`options.xAxis.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示x轴轴线"
                            field={`options.xAxis.axisLine.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示x轴label"
                            field={`options.xAxis.axisLabel.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示x轴分割线"
                            field={`options.xAxis.splitLine.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示x轴刻度"
                            field={`options.xAxis.axisTick.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="x轴刻度间隔"
                            field={`options.xAxis.axisLabel.interval`}>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="x轴刻度标签旋转的角度"
                            field={`options.xAxis.axisLabel.rotate`}>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="x轴刻度标签字体大小"
                            field={`options.xAxis.axisLabel.fontSize`}>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="x轴刻度标签格式化"
                            field={`options.xAxis.axisLabel.formatter`}>
                            <Input />
                        </Form.Item>
                    </Collapse.Item>
                    <Collapse.Item header="Y轴属性配置" name='y'>
                        <Form.Item
                            label="显示y轴"
                            field={`options.yAxis.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示y轴轴线"
                            field={`options.yAxis.axisLine.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示y轴label"
                            field={`options.yAxis.axisLabel.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示y轴分割线"
                            field={`options.yAxis.splitLine.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="显示y轴刻度"
                            field={`options.yAxis.axisTick.show`}
                            triggerPropName="checked">
                            <Switch size="small" type="round"/>
                        </Form.Item>
                        <Form.Item
                            label="y轴刻度标签格式化"
                            field={`options.yAxis.axisLabel.formatter`}>
                            <Input />
                        </Form.Item>
                    </Collapse.Item>
                    <Collapse.Item header="分组配置" name='series'>
                        <Form.List
                            field="options.series">
                            {(fields, { add, remove, move }) => {
                                return (
                                    <div
                                        className="group-item">
                                        <Button
                                            style={{
                                                marginTop: '10px'
                                            }}
                                            onClick={() => {
                                                add({
                                                    name: '',
                                                    alias: '',
                                                    data: [],
                                                    line: {
                                                        width: 2,
                                                        color: '#165DFF'
                                                    },
                                                    areaColorArgsBindVar: `[0, 0, 0, 1, [
                                                        {
                                                            offset: 0,
                                                            color: 'rgba(22,93,255,0.1000)'
                                                        },
                                                        {
                                                            offset: 1,
                                                            color: 'rgba(22,93,255,0)'
                                                        }
                                                    ]]`
                                                });
                                            }}>
                                            增加
                                        </Button>
                                        {
                                            fields.map((field, index) => {
                                                return (
                                                    <div
                                                        className="group-card">
                                                        <Button
                                                            icon={<IconDelete/>}
                                                            style={{
                                                                marginTop: '10px',
                                                                position: 'absolute',
                                                                top: '-5px',
                                                                right: '10px'
                                                            }}
                                                            onClick={() => {
                                                                remove(index);
                                                            }}>
                                                        </Button>
                                                        <Form.Item
                                                            label="字段名"
                                                            field={field.field + '.name'}>
                                                            <Input size="mini"/>
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="字段中文名"
                                                            field={field.field + '.alias'}>
                                                            <Input size="mini"/>
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="折线颜色"
                                                            field={field.field + '.line.color'}>
                                                            <Input size="mini"/>
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="折线宽度"
                                                            field={field.field + '.line.width'}>
                                                            <Input size="mini"/>
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="堆叠"
                                                            field={field.field + '.stack'}>
                                                            <Input size="mini"/>
                                                        </Form.Item>
                                                        <Form.Item
                                                            label="区域渐变颜色配置"
                                                            field={field.field + '.areaColorArgsBindVar'}>
                                                            <PopupSourceCode>
                                                                <Button>配置</Button>
                                                            </PopupSourceCode>
                                                        </Form.Item>
                                                    </div>
                                                );
                                            })
                                        }

                                    </div>
                                )
                            }}
                        </Form.List>
                    </Collapse.Item>
                    <Collapse.Item header="提示框属性配置" name='tooltip'>
                        <Form.Item
                            label="提示框样式类名"
                            field={`options.chartTooltip.className`}>
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="提示框值格式化"
                            field={`options.chartTooltip.valueFormatterBindVar`}>
                            <BindVar size="mini">
                                编写函数
                            </BindVar>
                        </Form.Item>
                        <Form.Item
                            label="提示框内容格式化"
                            field={`options.chartTooltip.formatterBindVar`}>
                            <BindVar size="mini">
                                编写函数
                            </BindVar>
                        </Form.Item>
                    </Collapse.Item>
                    <Collapse.Item header="边距配置" name='grid'>
                        <Form.Item
                            label="距顶距离"
                            field="options.grid.top">
                            <InputNumber />
                        </Form.Item>
                        <Form.Item
                            label="距底距离"
                            field="options.grid.bottom">
                            <InputNumber />
                        </Form.Item>
                         <Form.Item
                            label="距左距离"
                            field="options.grid.left">
                            <InputNumber />
                        </Form.Item>
                        <Form.Item
                            label="距右距离"
                            field="options.grid.right">
                            <InputNumber />
                        </Form.Item>
                    </Collapse.Item>
                </Collapse>
                <Form.Item
                    label="数据刷新后执行"
                    field={`options.afterRefreshBindVar`}>
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
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
