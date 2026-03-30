import React from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select, InputNumber, Radio } from '@arco-design/web-react';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {};
        this.formRef = React.createRef();
    }

    onValuesChange = (changeValue, values) => {
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: this.formRef.current.getFieldsValue(),
        });
    };

    componentDidUpdate(prevProps) {
        const { nodes, activeNodeKey, node } = this.props;
        const prevNode = prevProps.nodes.byId[prevProps.activeNodeKey];
        if (!_.isEqual(prevNode, node)) {
            this.formRef.current.setFieldsValue(node);
        }
    }

    render() {
        const { activeNodeKey, nodes, node, ...rest } = this.props;

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
                        <span
                            style={{ lineHeight: '24px' }}>
                            绑定变量
                        </span>
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
                    label="饼图的半径"
                    field="options.radiusBindVar">
                    <BindVar>数据绑定</BindVar>
                </Form.Item>
                <Form.Item
                    label="分类字段"
                    field="options.colorField">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="占比值字段"
                    field="options.angleField">
                    <Input />
                </Form.Item>
                <Form.Item
                    label="分类字段别名"
                    field={`options.meta.${node.options.colorField}.alias`}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="占比值字段别名"
                    field={`options.meta.${node.options.angleField}.alias`}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="饼状图值显示样式"
                    noStyle>
                    <Form.Item
                        label="颜色数据"
                        field="options.colorBindVar">
                        <BindVar>编写数据</BindVar>
                    </Form.Item>
                </Form.Item>
                <Form.Item
                    label="提示框样式类名"
                    field={`options.chartTooltip.className`}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="提示框格式化"
                    field="options.chartTooltip.valueFormatterBindVar">
                    <BindVar
                        size="mini">编写函数</BindVar>
                </Form.Item>
                <Form.Item
                    label="南丁格尔玫瑰图"
                    field="options.roseType">
                    <Radio.Group
                        type="button"
                        options={[
                            { value: '', label: '饼图'},
                            { value: 'area', label: '南丁格尔玫瑰图（area）'},
                            { value: 'radio', label: '南丁格尔玫瑰图（radius）'}
                        ]}>
                    </Radio.Group>
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
    const { nodes, activeNodeKey } = state;
    const node = nodes.byId[activeNodeKey];
    return {
        node,
        nodes,
        activeNodeKey,
    };
})(Attr);
