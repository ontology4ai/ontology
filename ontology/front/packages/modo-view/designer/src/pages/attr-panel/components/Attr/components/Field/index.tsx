import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { Modal, Trigger, Skeleton, Link, Form, Button, Input, InputNumber, Switch, Select, Radio } from "@arco-design/web-react";
import { IconEdit, IconRefresh, IconRole, IconTeam } from 'modo-design/icon';
import { Face, Tag } from 'modo-design';
import BindVar from 'packages/modo-view/designer/src/components/BindVar';
import TableForm from '@/components/TableForm';
import PopupSourceCode from 'packages/modo-view/designer/src/components/PopupSourceCode';
import EventAttr from '../EventSetting';
import * as iconMap from 'modo-design/icon';
import './style/index.less';

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
                fields: this.parseModelFields(this.props.field)
            },
            visible: false,
            event: null
        };
        this.formRef = React.createRef();
    }
    parseModelFields = (values) => {
        const {
            tagEffect,
            tagColor,
            tagIcon,
        } = values;
        const Icon = iconMap[tagIcon];
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
                label: '样例',
                type: 'example',
                render: (col, record, index) => {
                    return (
                        <Tag
                            effect={tagEffect}
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
    onValuesChange = (changeValue, values) => {
        if (changeValue.renderType && changeValue.renderType === 'index' && !values.width) {
            const width = '46px';
            this.formRef.current.setFieldValue('width', width);
            values.width = width;
        }
        if (changeValue.showAsTag) {
            values.tagColors = this.initTagColors();
        }

        this.props.onChange(values);
        this.setState({
            model: {
                fields: this.parseModelFields(values)
            }
        })
    };
    initTagColors() {
        const tagColors = this.state.colors.map(color => {
            return {
                value: null,
                color
            }
        });
        this.formRef.current.setFieldValue('tagColors', tagColors);
        return tagColors;
    }
    handleOnCancel = () => {
        this.setState({
            visible: false
        });
    };
    handleOnOk = () => {
        const values = this.formRef.current.getFieldsValue();
        this.formRef.current.setFieldValue('event', this.state.event);
        this.setState({
            visible: false
        });
    };
    componentDidMount() {
        if (this.props.field.showAsTag && !this.props.field.tagColors) {
            this.initTagColors();
            this.setState({
                model: {
                    fields: this.parseModelFields(this.formRef.current.getFieldsValue())
                }
            })
        }
        if (!this.props.field.showAsTag) {
            this.formRef.current.setFieldValue('tagColors', []);
            this.setState({
                model: {
                    fields: this.parseModelFields(this.formRef.current.getFieldsValue())
                }
            })
        }
    }
    componentDidUpdate(prevProps) {
        const { field } = this.props;
        const prevField = prevProps.field;
        if (!_.isEqual(field, prevField)) {
            this.formRef.current.setFieldsValue(field);
            this.setState({
                model: {
                    fields: this.parseModelFields(this.formRef.current.getFieldsValue())
                }
            })
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
            field,
            fieldIndex
        } = this.props;

        const { current } = this.formRef;
        let tagEffect = '';
        let tagIcon = '';
        if (current) {
            tagEffect = current.getFieldValue('tagEffect');
            tagIcon = current.getFieldValue('tagIcon');
        }


        return (
            <>
                <Form
                    ref={this.formRef}
                    key={fieldIndex}
                    layout="vertical"
                    initialValues={field}
                    onValuesChange={this.onValuesChange}>
                    <Form.Item
                        label="标题"
                        field="titleBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="title"
                                noStyle>
                                <Input size="mini"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="模型字段"
                        field="dataIndex">
                        <Input size="mini"/>
                    </Form.Item>
                    <Form.Item
                        label="宽度"
                        field="width">
                        <Input size="mini"/>
                    </Form.Item>
                    {/*<Form.Item
                        label="显示排序"
                        field="renderType"
                        triggerPropName="checked">
                        <Switch size="small"/>
                    </Form.Item>*/}
                    <Form.Item
                        label="文字超长情况下不省略文字"
                        field="noEllipsis"
                        triggerPropName="checked">
                        <Switch size="small"/>
                    </Form.Item>
                    <Form.Item
                        label="显示为常用类型"
                        field="renderType">
                        <Select
                            size="small"
                            allowClear
                            options={[
                                {
                                    value: 'index',
                                    label: (
                                        <span
                                            className="column-index">
                                            序号
                                        </span>
                                    )
                                },
                                {
                                    value: 'id',
                                    label: (
                                        <span
                                            className="column-id">
                                            id
                                        </span>
                                    )
                                },
                                {
                                    value: 'percent',
                                    label: (
                                        <span
                                            className="column-percent">
                                            55.65%(保留两位)
                                        </span>
                                    )
                                },
                                {
                                    value: 'link',
                                    label: (
                                        <Link
                                            href='#'>
                                            链接
                                        </Link>
                                    )
                                },
                                {
                                    value: 'user',
                                    label: (
                                        <Face
                                            text='用户'>
                                        </Face>
                                    )
                                },
                                {
                                    value: 'role',
                                    label: (
                                        <Tag
                                            effect="text"
                                            iconColor="arcoblue"
                                            icon={<IconRole />}
                                            size="small">
                                            角色
                                        </Tag>
                                    )
                                },
                                {
                                    value: 'team',
                                    label: (
                                        <Tag
                                            effect="text"
                                            iconColor="arcoblue"
                                            icon={<IconTeam />}
                                            size="small">
                                            团队
                                        </Tag>
                                    )
                                }
                            ]}>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="对齐方式"
                        field="align">
                        <Radio.Group
                            type='button'
                            size="mini"
                            options={[
                                { value: 'left', label: '居左' },
                                { value: 'center', label: '居中' },
                                { value: 'right', label: '居右' }
                            ]}>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        label="列固定"
                        field="fixed">
                        <Radio.Group
                            type='button'
                            size="mini"
                            options={[
                                { value: '', label: '无' },
                                { value: 'left', label: '左' },
                                { value: 'right', label: '右' }
                            ]}>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item
                        label="支持排序"
                        field="sorter"
                        triggerPropName="checked">
                        <Switch
                            size="small"/>
                    </Form.Item>
                    <Form.Item
                        label="内容定制渲染"
                        field="renderBindVar">
                        <PopupSourceCode
                            language="javascript">
                            <Button>绑定动作</Button>
                        </PopupSourceCode>
                    </Form.Item>
                    <Form.Item
                        label="行合并（连续值相同进行合并）"
                        field="merge"
                        triggerPropName="checked">
                        <Switch
                            size="small"
                            type="round"/>
                    </Form.Item>
                    <Form.Item
                        label="隐藏列"
                        field="hiddenBindVar">
                        <BindVar size="mini">
                            <Form.Item
                                field="hidden"
                                noStyle
                                triggerPropName="checked">
                                <Switch
                                    size="small"/>
                            </Form.Item>
                        </BindVar>
                    </Form.Item>
                    <Form.Item
                        label="显示为标签"
                        field="showAsTag"
                        triggerPropName="checked">
                        <Switch
                            size="small"/>
                    </Form.Item>
                    <Form.Item
                        label="标签主题"
                        field="tagEffect">
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
                        label="标签图标"
                        field="tagIcon">
                        <Select
                            size="small"
                            showSearch={true}
                            allowClear
                            dropdownMenuClassName="icon-list"
                            virtualListProps={{
                                threshold: null
                            }}
                            options={Object.keys(iconMap).map(key => {
                                const Icon = iconMap[key];
                                return {
                                    value: key,
                                    label: (<Icon/>)
                                }
                            })}/>
                    </Form.Item>
                    <Form.Item shouldUpdate noStyle>
                        {(values) => {
                            const Icon = iconMap[values.tagIcon];
                            return <Form.Item
                                label="标签默认颜色"
                                field="tagColor">
                                <Select
                                    size="small"
                                    allowClear
                                    options={this.state.colors.map(color => {
                                        return {
                                            value: color,
                                            label: (
                                                <Tag
                                                    effect={values.tagEffect}
                                                    color={!Icon ? color : null}
                                                    iconColor={Icon ? color : null}
                                                    icon={Icon ? <Icon /> : null}
                                                    size="small">
                                                    标签
                                                </Tag>
                                            )
                                        }
                                    })}/>
                            </Form.Item>
                        }}
                    </Form.Item>

                    <Form.Item
                        label="标签颜色"
                        field="tagColors">
                        <TableForm
                            key={tagEffect + (tagIcon || '')}
                            model={this.state.model}
                            pagination={false}
                            rowKey="name"
                            sortable={false}
                            oper={false}/>
                    </Form.Item>
                    <Form.Item
                        noStyle>
                        <Button
                            onClick={() => {
                                this.setState({
                                    visible: true
                                })
                            }}>单击绑定动作</Button>
                    </Form.Item>
                </Form>
                <Modal
                    style={{
                        width: 'calc(100% - 40px)',
                        height: 'calc(100% - 40px)'
                    }}
                    title={(
                        <div
                            style={{ textAlign: 'left' }}>
                            Modal Title
                        </div>
                    )}
                    visible={this.state.visible}
                    onCancel={this.handleOnCancel}
                    onOk={this.handleOnOk}>
                    <EventAttr
                        event={field.event}
                        onChange={(values) => {
                            this.setState({
                                event: values
                            })
                        }}/>
                </Modal>
            </>
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
