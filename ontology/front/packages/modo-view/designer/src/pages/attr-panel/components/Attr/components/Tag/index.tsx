import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Form, Button, Input, Switch, Select } from "@arco-design/web-react";
import { Tag } from 'modo-design';
import { IconUser } from 'modo-design/icon';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import IconSelect from '@/components/IconSelect';
import * as iconMap from 'modo-design/icon';
import './style/index.less'

class Attr extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            colors: [
                'red',
                'orangered',
                'orange',
                'gold',
                'lime',
                'green',
                'cyan',
                'blue',
                'arcoblue',
                'purple',
                'pinkpurple',
                'magenta',
                'gray',
            ],
            effects: [
                'plain',
                'light',
                'text',
                'dark'
            ],
            model: {
                fields: this.parseModelFields(this.props.node.options)
            },
            iconModel: {
                fields: this.parseIconModelFields(this.props.node.options)
            }
        };
        this.formRef = React.createRef();
    }
    parseModelFields = (values) => {
        const {
            effect,
            color,
            icon,
        } = values;
        const Icon = iconMap[icon];
        return [
            {
                name: 'value',
                valueType: 'string',
                defaultValue: '',
                label: '值',
                type: 'input',
                options: {
                }
            },
            {
                name: 'valueBindVar',
                valueType: 'string',
                width: 30,
                defaultValue: '',
                label: '',
                type: 'bindVar',
                options: {
                }
            },
            {
                name: 'color',
                valueType: 'string',
                defaultValue: '',
                label: '标签类型',
                type: 'text',
                options: {
                }
            },
            {
                name: 'example',
                valueType: 'string',
                defaultValue: '',
                width: 46,
                label: '样例',
                type: 'example',
                render: (col, record, index) => {
                    return (
                        <Tag
                            effect={effect}
                            color={!Icon ? record.color : null}
                            iconColor={Icon ? record.color : null}
                            icon={Icon ? <Icon/> : null}
                            size="small">
                            标签
                        </Tag>
                    );
                }
            }
        ];
    };
    parseIconModelFields = (values) => {
        return [
            {
                name: 'value',
                valueType: 'string',
                defaultValue: '',
                label: '值',
                type: 'input',
                options: {
                }
            },
            {
                name: 'icon',
                valueType: 'string',
                defaultValue: '',
                label: '图标',
                type: 'iconSelect'
            }
        ];
    };
    onValuesChange = (changeValue, values) => {
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: this.props.activeNodeKey,
            currentNode: this.formRef.current.getFieldsValue()
        })
    };
    initTagColors() {
        const colors = this.state.colors.map(color => {
            return {
                value: null,
                color
            }
        });
        this.formRef.current.setFieldValue('options.colors', colors);
        return colors;
    }
    componentDidUpdate(prevProps) {
        const { nodes, activeNodeKey, node } = this.props;
        const prevNode = prevProps.nodes.byId[prevProps.activeNodeKey];
        if (!_.isEqual(prevNode, node)) {
            this.formRef.current.setFieldsValue(node);
        }
    }
    componentDidMount() {
        if (!this.props.node.options.colors) {
            this.initTagColors();
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
                className="tag-attr-form"
                key={activeNodeKey}
                layout="vertical"
                initialValues={node}
                onValuesChange={this.onValuesChange}>
                <Form.Item
                    label="标签主题"
                    field="options.effect">
                    <Select
                        size="small"
                        allowClear
                        options={this.state.effects.map(effect => {
                            return {
                                value: effect,
                                label: (
                                    <Tag
                                        effect={effect}
                                        size="small">
                                        标签
                                    </Tag>
                                )
                            }
                        })}/>
                </Form.Item>
                <Form.Item
                    label="默认标签图标"
                    field="options.icon">
                    <IconSelect/>
                </Form.Item>
                <Form.Item
                    label="默认颜色"
                    field="options.color">
                    <Select
                        size="small"
                        showSearch={true}
                        allowClear
                        options={this.state.colors.map(color => {
                            const {
                                effect,
                                icon
                            } = node.options;
                            return {
                                label: (
                                    <Tag
                                        effect={effect}
                                        color={!icon ? color : null}
                                        iconColor={icon ? color : null}
                                        icon={icon ? <IconUser/> : null}
                                        size="small">
                                        标签
                                    </Tag>
                                ),
                                value: color
                            }
                        })}>
                    </Select>
                </Form.Item>
                <Form.Item shouldUpdate noStyle>
                    {(values) => {
                        return values.options.icon ? <Form.Item
                            label="文字是否显示所选颜色（图标文字标签）"
                            field="options.showTextColor"
                            triggerPropName="checked">
                            <Switch />
                        </Form.Item> : null
                    }}
                </Form.Item>
                <Form.Item
                    label="标签颜色枚举"
                    field="options.colors">
                    <TableForm
                        model={this.state.model}
                        pagination={false}
                        rowKey="name"
                        sortable={false}
                        oper={false}
                        selectWidth={20}/>
                </Form.Item>
                <Form.Item
                    label="标签图标枚举"
                    field="options.icons">
                    <TableForm
                        model={this.state.iconModel}
                        pagination={false}
                        rowKey="name"
                        sortable={false}
                        oper={true}/>
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
