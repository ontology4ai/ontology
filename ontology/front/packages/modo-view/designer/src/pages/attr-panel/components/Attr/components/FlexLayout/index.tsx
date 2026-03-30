import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select } from "@arco-design/web-react";
import BindVar from 'packages/modo-view/designer/src/components/BindVar';


class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
        };
        this.formRef = React.createRef();
    }
    onValuesChange = (changeValue, values) => {
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: this.formRef.current.getFieldsValue()
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
        /*
        labelCol={{
            flex: '100px',
        }}
        wrapperCol={{
            flex: '1'
        }}
        */
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
                    label="方向"
                    field="options.flexDirection">
                    <Select
                        options={[
                            {value: 'row', label: '水平方向'},
                            {value: 'column', label: '垂直方向'}
                        ]}/>
                </Form.Item>
                { node.options.flexDirection === 'row' ? (
                    <Form.Item
                        label="水平布局"
                        field="options.justifyContent">
                        <Select
                            allowClear
                            triggerProps={{
                                autoAlignPopupWidth: false,
                                autoAlignPopupMinWidth: true,
                                position: 'bl',
                            }}
                            options={[
                                {value: 'flex-start', label: '从行首起始位置开始排列'},
                                {value: 'flex-end', label: '从行尾位置开始排列'},
                                {value: 'center', label: '居中排列'},
                                {value: 'space-between', label: '均匀排列每个元素，首个元素放置于起点，末尾元素放置于终点'},
                                {value: 'space-evenly', label: '均匀排列每个元素，每个元素之间的间隔相等'},
                                {value: 'space-around', label: '均匀排列每个元素，每个元素周围分配相同的空间'}
                            ]}/>
                    </Form.Item>
                ) : null}
                <Form.Item
                    label="随父容器增长尺寸大小"
                    field="options.flexGrow"
                    triggerPropName="checked">
                    <Switch
                        size="small"/>
                </Form.Item>
                <Form.Item
                    label="宽度"
                    field="options.width">
                    <Input
                        size="mini"/>
                </Form.Item>
                <Form.Item
                    label="高度"
                    field="options.height">
                    <Input
                        size="mini"/>
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
