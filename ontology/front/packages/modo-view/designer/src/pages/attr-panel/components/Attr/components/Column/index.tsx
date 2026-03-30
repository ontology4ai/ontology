import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select, Radio, InputNumber } from "@arco-design/web-react";
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
                    label="自定义配置"
                    field="options.customOptionBindVar">
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
                    label="方向"
                    field="options.dir">
                    <Radio.Group
                        type="button"
                        size="mini"
                        options={[
                            { value: '1', label: '纵向' },
                            { value: '0', label: '横向' }
                        ]}>
                    </Radio.Group>
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
                <div>分组</div>
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
                                            barMaxWidth: 14,
                                            itemStyle: {
                                                borderRadiusBindVar: `[7, 7, 0, 0]`,
                                                colorBindVar: `[0, 0, 0, 1, [
                                                    { offset: 0, color: '#722ED1' },
                                                    { offset: 0.25, color: '#165DFF' },
                                                    { offset: 0.75, color: '#14B1D5' },
                                                    { offset: 1, color: '#14C9C9' }
                                                ]]`
                                            },
                                            emphasis: {
                                                colorBindVar: `[0, 0, 0, 1, [
                                                    { offset: 0, color: '#2378f7' },
                                                    { offset: 0.7, color: '#2378f7' },
                                                    { offset: 1, color: '#83bff6' }
                                                ]]`
                                            }
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
                                                    label="柱状宽度"
                                                    field={field.field + '.barMaxWidth'}>
                                                    <Input size="mini"/>
                                                </Form.Item>
                                                <Form.Item
                                                    label="柱状圆角"
                                                    field={field.field + '.itemStyle.borderRadiusBindVar'}>
                                                    <Input size="mini"/>
                                                </Form.Item>
                                                <Form.Item
                                                    label="柱状颜色"
                                                    field={field.field + '.itemStyle.colorBindVar'}>
                                                    <PopupSourceCode>
                                                        <Button>配置</Button>
                                                    </PopupSourceCode>
                                                </Form.Item>
                                                <Form.Item
                                                    label="鼠标移上去柱状颜色"
                                                    field={field.field + '.emphasis.colorBindVar'}>
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
                <Form.Item
                    label="y轴刻度标签格式化"
                    field={`options.yAxis.axisLabel.formatter`}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="提示框样式类名"
                    field={`options.chartTooltip.className`}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="提示框格式化"
                    field={`options.chartTooltip.valueFormatterBindVar`}>
                    <BindVar size="mini">
                        编写函数
                    </BindVar>
                </Form.Item>
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
