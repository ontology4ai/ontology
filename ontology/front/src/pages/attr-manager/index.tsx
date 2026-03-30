import React, { useState, useEffect, useMemo } from 'react';
import { getData,addAttrData, deleteAttr,updateAttr } from './api';
import {Switch, Button, Dropdown, Menu, Spin, Modal, Input, Message, Space, Form, Select} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import Table from '@/components/Table';
import ObjOverview from '@/pages/obj-overview';
import Obj from '@/pages/object';
import { IconTextareaColor,IconCounterColor,IconUnitMgrColor,IconDataIntegrationColor,IconCalendarColor, IconBackupsShareColor,IconArrowDown } from 'modo-design/icon';
import './style/index.less';
const FormItem = Form.Item;
const Option = Select.Option;
const typeOptions = [
  {value:'string',label:'字符型'},
  {value:'int',label:'整数型'},
  {value:'decimal',label:'浮点数型'},
  {value:'date',label:'日期型'},
  {value:'bool',label:'布尔型'},
  ];

class AttrManager extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: false,
            data: [],
            selectedRowKeys: [],
            attrModalVisible:false,
            isMulti:false,
            pagination: {
                total: 0,
                current: 1,
                pageSize: 20
            }
        }
    }
    formRef = React.createRef();
    saveAttr = ()=>{
        this.formRef.current?.validate((errors, values) => {
            if (!errors){
               console.log(values);
               values.status = values.status?1:0;
               Array.isArray(values.attributeTypes)?'':values.attributeTypes = [values.attributeTypes];
               values.ontologyId = this.props.ontology.id;
                addAttrData(values).then(res=>{
                    if(res.data.success){
                        Message.success('保存成功');

                    }else{
                        Message.error('保存失败');
                    }
                }).catch(err=>{
                    console.log(err);
                    Message.error('保存失败');
                }).finally(() => {
                    this.setState({attrModalVisible: false});
                    this.getData();
                    this.props.updateParent && this.props.updateParent();
                })

            }
        })
    };
    getData = () => {
        this.setState({
            loading: true
        });
        getData({
            ontologyId: this.props.ontology?.id,
            page: 1,
            limit: 20
        }).then(res => {
            if (Array.isArray(res?.data?.data?.content)) {
                const { data } = res.data;
                this.setState({
                    data: data.content,
                    pagination: {
                        total: data.totalElements,
                        current: data.pageable.pageNumber + 1,
                        pageSize: data.size
                    }
                })
            }
        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    };
    onValuesChange = (changeValue, values)=>{
        if(changeValue.hasOwnProperty('isMulti')){
            this.setState({isMulti:values.isMulti});
            this.formRef.current?.setFieldValue('attributeTypes',changeValue.isMulti?[]:'')
        }
    };
    handleDelete = (ids) => {
        Modal.confirm({
            title: '确认删除共享属性?',
            content: '',
            onOk: () => {
                deleteAttr(ids).then(res => {
                    if (res.data.success) {
                        Message.success('删除成功');
                    } else {
                        Message.error('删除失败');
                    }
                }).finally(()=>{
                    this.getData()
                });
            },
        });

    };
    swicthStatus = (row) => {
        Modal.confirm({
            title: `确认${row.status==1?'禁用':'启用'}共享属性?`,
            content: '',
            onOk: () => {
                updateAttr(row.id,{...row,status:row.status==1?0:1}).then(res => {
                    if (res.data.success) {
                        Message.success('更新成功');
                    } else {
                        Message.error('更新失败');
                    }
                }).finally(()=>{
                    this.getData()
                });
            },
        });

    };
    renderLabel = (row) => {
        let labelIcons = row.attributeTypes.map(item=>{
            let labelIcon ='';
            switch (item) {
                case 'string':
                    labelIcon = <IconTextareaColor/>;
                    break;
                case 'int':
                    labelIcon = <IconCounterColor/>;
                    break;
                case 'decimal':
                    labelIcon = <IconDataIntegrationColor/>;
                    break;
                case 'bool':
                    labelIcon = <IconUnitMgrColor/>;
                    break;
                case 'date':
                    labelIcon = <IconCalendarColor/>;
                    break
            }
            return labelIcon
        });

        return ( <Space>{labelIcons}{row.attributeLabel}<IconBackupsShareColor  style={{color:'var(--color-magenta-6)'}}/></Space>)
    };
    renderOption = (option) => {
        let labelIcon = '';
        switch (option.value) {
            case 'string':
                labelIcon = <IconTextareaColor/>;
                break;
            case 'int':
                labelIcon = <IconCounterColor/>;
                break;
            case 'decimal':
                labelIcon = <IconDataIntegrationColor/>;
                break;
            case 'bool':
                labelIcon = <IconUnitMgrColor/>;
                break;
            case 'date':
                labelIcon = <IconCalendarColor/>;
                break
        }
        return (<Space>{labelIcon}{option.children}</Space>)
    };

    componentDidMount() {
        this.getData()
    }
    render() {
        const {
            loading,
            data,
            pagination,
            selectedRowKeys,
            attrModalVisible
        } = this.state;
        return (
            <Spin
                className="attr-manager-spin"
                loading={loading}>
                <div
                    className="attr-manager">
                    <div
                        className="attr-manager-header">
                        <div
                            className="pos-left">
                            <span
                                className="title">
                                共享属性
                            </span>
                            <Tag
                                size="small">
                                {pagination.total}
                            </Tag>
                        </div>
                        <div
                            className="pos-right">
                            <Dropdown
                                key={'1'}
                                trigger='click'
                                droplist={
                                    <Menu onClickMenuItem={(key, e) => {
                                        e.stopPropagation();
                                        if (key === '1') {
                                            this.handleDelete(selectedRowKeys)
                                        }

                                    }}>
                                        <Menu.Item
                                            key='1'>
                                            批量删除
                                        </Menu.Item>
                                        <Menu.Item
                                            key='2'>
                                            批量启用
                                        </Menu.Item>
                                        <Menu.Item
                                            key='3'>
                                            批量禁用
                                        </Menu.Item>
                                    </Menu>
                                }>
                                <Button
                                    type='secondary'>
                                    批量操作
                                    <IconArrowDown />
                                </Button>
                            </Dropdown>
                            <Button
                                onClick={() => {
                                    this.setState({
                                        attrModalVisible: true,
                                        isMulti:false
                                    })
                                }}>
                                新建共享属性
                            </Button>
                        </div>
                    </div>
                    <div
                        className="attr-manager-content">
                        <Table
                            scroll={{
                                y: true
                            }}
                            rowKey='id'
                            columns={[
                                {
                                    dataIndex: 'attributeLabel',
                                    title: '中文名称',
                                    render: (col, row, index) => {
                                        return (
                                            <div className="obj-name">
                                                {this.renderLabel(row)}
                                            </div>
                                        )
                                    }
                                },
                                {
                                    dataIndex: 'objectTypes',
                                    title: '关联对象类型数量',
                                    render: (col, row, index) => (col?col:0)
                                },
                                {
                                    dataIndex: 'status',
                                    title: '状态',
                                    width: 160,
                                    filters: [
                                        {
                                            text: '禁用',
                                            value: '0',
                                        },
                                        {
                                            text: '启用',
                                            value: '1',
                                        },
                                    ],
                                    defaultFilters: [],
                                    onFilter: (value, row) => row.status == value,
                                    render: (col, row, index) => {
                                        const status = row.status;
                                        return (
                                          <Switch size="small" checked={status} onChange={()=>this.swicthStatus(row)}/>
                                        )
                                    }
                                },
                                {
                                    dataIndex: 'oper',
                                    title: '操作',
                                    width: 160,
                                    render: (col, row, index) => {
                                        return (
                                            <div
                                                className="obj-oper-group">
                                                <Button size="mini" type="text" onClick={()=>{
                                                    this.handleDelete([row.id])}}>删除</Button>
                                            </div>
                                        )
                                    }
                                }
                            ]}
                            data={data}
                            rowSelection={{
                              type: 'checkbox',
                              selectedRowKeys,
                              onChange: (selectedRowKeys, selectedRows) => {
                                console.log('onChange:', selectedRowKeys, selectedRows);
                                this.setState({selectedRowKeys})
                               // setSelectedRowKeys(selectedRowKeys);
                              },
                              onSelect: (selected, record, selectedRows) => {
                                console.log('onSelect:', selected, record, selectedRows);
                              },
                            }}
                            pagination={{
                                size: 'mini',
                                ...pagination
                            }}/>
                    </div>
                </div>
                <Modal
                  title={
                      <div style={{ textAlign: 'left',fontWeight:600 }}>
                          新建属性
                      </div>
                  }
                  okText='保存'
                  style={{width: '500px'}}
                  visible={attrModalVisible}
                  onOk={this.saveAttr}
                  onCancel={()=>{this.setState({attrModalVisible : false});
                  }}
                  autoFocus={false}
                  focusLock={true}
                  className='attr-modal'
                >
                    <div className="attr-container">
                        <Form ref={this.formRef}  key={attrModalVisible} autoComplete='off' layout='vertical' className='metaData-form' onValuesChange={this.onValuesChange}  validateMessages={{
                            required: (_, {label}) => `${'请输入'}${label} `,
                        }}>
                            <FormItem label='中文名' field='attributeLabel' rules={[{required: true}]}>
                                <Input placeholder='请输入属性中文名称' maxLength={100} showWordLimit/>
                            </FormItem>
                            <FormItem label='英文名' field='attributeName' rules={[{required: true}]}>
                                <Input placeholder='请输入属性英文名称' maxLength={100} showWordLimit/>
                            </FormItem>
                            <FormItem label='描述' field='attributeDesc'  >
                                <Input.TextArea placeholder='请输入属性描述' maxLength={200} showWordLimit  style={{ minHeight: 62 }}/>
                            </FormItem>
                            <FormItem label='基础类型允许多选' field='isMulti'>
                                <Switch/>
                            </FormItem>
                            <FormItem label='基础类型' field='attributeTypes'>
                                <Select
                                  mode={this.state.isMulti?'multiple':false}
                                  placeholder='请选择'
                                  allowClear
                                  options={typeOptions}
                                  renderFormat={(option, value) => {
                                      return option ? this.renderOption(option) : (
                                        value
                                      );
                                  }}
                                >
                                </Select>
                            </FormItem>
                            <FormItem label='属性启用' field='status'>
                                <Switch  checkedText='启用' uncheckedText='禁用'/>
                            </FormItem>
                        </Form>

                    </div>
                </Modal>
            </Spin>
        )
    }
}

export default AttrManager;
