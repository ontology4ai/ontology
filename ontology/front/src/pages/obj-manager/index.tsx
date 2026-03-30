import Table from '@/components/Table';
import ObjOverview from '@/pages/obj-overview';
import InterfaceOverview from '@/pages/interface-overview';
import Obj from '@/pages/object';
import ExistObjModal from '@/pages/object/exist-obj-index';
import {
    Alert,
    Button,
    Dropdown,
    Menu,
    Message,
    Modal,
    Spin,
    Switch,
    Typography,
    Space,
    Tooltip,
    Input,
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconArrowDown, IconSearchColor,IconLinkColor,IconLink } from 'modo-design/icon';
import React from 'react';
import { deleteObj, getData, updateObjStatus } from './api';
import './style/index.less';
import ObjectIcon from '@/components/ObjectIcon';

import IconLinkDisable from './images/link-color-disable.svg';
import IconInterface from './images/interface.png';
import IconInterfaceDisable from './images/interface-disable.svg';
import {removeObjData} from "@/pages/interface-overview/pages/obj-detail/api";

class ObjManager extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            filterVal: '',
            loading: true,
            data: [],
            selectedRowKeys: [],
            selectedRows:[],
            objVisible: false,
            existObjModalVisible: false,
            deleteVisible: false,
            deleteIds:[],
            delObjSync: true,
            pagination: {
                total: 0,
                current: 1,
                pageSize: 20
            },
            columns:[
                {
                    dataIndex: 'objectTypeLabel',
                    title: '中文名称',
                    width: 200,
                    ellipsis: true,
                    render: (col, row, index) => {
                        return (
                          <div
                            className="obj-name"
                            onClick={() => {
                                this.viewMapRef.current[row.id] = null;
                                this.props.push({
                                    key: row.id,
                                    ontology:this.props.ontology,
                                    title: row.objectTypeLabel,
                                    view: (
                                      <ObjOverview
                                        onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                        ontology={this.props.ontology}
                                        ref={ref =>this.viewMapRef.current[row.id] = ref}
                                        obj={row}
                                        changeTab={(tab,oper)=>this.props.changeTab && this.props.changeTab(tab,oper)}
                                        push={this.props.push}
                                        getRef={() => this.viewMapRef.current[row.id]}/>
                                    )
                                })
                            }}>
                              <ObjectIcon icon={row.icon || ''} />
                              <Typography.Text ellipsis={{ showTooltip: true }}>
                                  {col}
                              </Typography.Text>
                          </div>
                        )
                    }
                },
                {
                    dataIndex: 'objectTypeName',
                    title: '英文名称',
                    width: 200,
                    ellipsis: true,
                    render: (col, record) => {
                        return (
                          <Typography.Text ellipsis={{ showTooltip: true }}>
                              {col}
                          </Typography.Text>
                        );
                    },
                },
                // {
                //     dataIndex: 'groups',
                //     title: '所属分组',
                //     render: (col, row, index) => {
                //         return (
                //             <div
                //                 className="obj-group">
                //                 {col.map(g => {
                //                     return (
                //                         <Tag
                //                             size="small">
                //                             {g}
                //                         </Tag>
                //                     )
                //                 })}
                //             </div>
                //         )
                //     }
                // },
                {
                    dataIndex: 'dsId',
                    title: '特征标识',
                    width: 100,
                    render: (col, row, index) => {
                        return (
                          <Space>
                              {row.dsId?  <Tooltip content='关联数据源'><IconLinkColor style={{ color: 'var(--color-primary-6)' }}/></Tooltip>: <Tooltip content='未关联数据源'><img src={IconLinkDisable}/></Tooltip>}
                              {!this.props.interfaceId ? (row.interfaceId ?
                                <Tooltip content='继承接口'><img src={IconInterface}/></Tooltip> :
                                <Tooltip content='未继承接口'><img src={IconInterfaceDisable}/></Tooltip>) : ''}
                          </Space>
                        )
                    }
                }, {
                    dataIndex: 'status',
                    title: '状态',
                    width: 60,
                    render: (col, row, index) => {
                        return (
                          <Switch
                            //  disabled={!row.dsId}
                            size="small"
                            checked={Boolean(col)}
                            onChange={()=>this.swicthStatus(row)}
                          />
                        )
                    }
                },
                {
                    dataIndex: 'oper',
                    title: '操作',
                    width: 100,
                    render: (col, row, index) => {
                        return (
                          this.props.interfaceId?
                            <div
                              className="obj-oper-group">
                                <Button
                                  size="mini"
                                  type="text"
                                  onClick={() => {
                                      this.removeObj([row.id])
                                  }}>
                                    移除
                                </Button>
                            </div>:
                            <div
                              className="obj-oper-group">
                                {/*<Button size="mini" type="text">编辑</Button>*/}
                                <Button
                                  size="mini"
                                  type="text"
                                  onClick={() => {
                                      this.setState({
                                          deleteIds:[row.id],
                                          deleteVisible:true,
                                          delObjSync:true,
                                      });
                                      // this.handleDelete([row.id])
                                  }}>
                                    删除
                                </Button>
                            </div>
                        )
                    }
                }
            ]
        };
        this.viewMapRef = React.createRef();
        this.viewMapRef.current = {};
        this.searchTimeout = null;
    }
    getData = () => {
        this.setState({
            loading: true
        });
        const param = {
            keyword: this.state.filterVal,
            ontologyId: this.props.ontology.id,
            page: this.state.pagination.current,
            limit: this.state.pagination.pageSize
        };
        if(this.props.interfaceId){
            param.interfaceId = this.props.interfaceId;
        }
        getData(param).then(res => {
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

    onChangeTable = (pagination)=> {
        this.setState({pagination:{...pagination}},()=>{this.getData()});
    };
    handlePageChange = (current: number, pageSize: number) => {
        this.setState({pagination:{...this.state.pagination,current,pageSize}},()=>{this.getData()});
    };
   /* handleDelete = (ids) => {
        Modal.confirm({
            title: '确认删除对象?',
            content: '',
            onOk: () => {
                deleteObj(ids).then(res => {
                    if (res.data.success) {
                        Message.success('删除成功');
                    } else {
                        Message.error('删除失败');
                    }
                }).finally(()=>{
                    this.setState({pagination:{...this.state.pagination,current:1}},()=>{
                        this.getData()
                    })

                });
            },
        });

    };*/
    handleDelete = (ids) => {
        deleteObj({ids,cascadeDelete:this.state.delObjSync}).then(res => {
            if (res.data.success) {
                Message.success('删除成功');
            } else {
                Message.error('删除失败');
            }
        }).catch(err=>{
            Message.error('删除失败');
        }).finally(() => {
            this.setState({
                  deleteVisible: false,
                  pagination: {...this.state.pagination, current: 1}
              },
              () => {
                  this.getData()
              })
        });
    };

    removeObj = (ids)=>{
        removeObjData(this.props.interfaceId,ids).then(res=>{
            if(res.data.success){
                Message.success('移除成功');
            }else{
                Message.error('移除失败');
            }
        }).finally(()=>{
            this.setState({
                pagination: {
                    ...this.state.pagination,
                    current: 1
                }
            }, () => {
                this.getData();
            });
        })
    };

    swicthStatus = (row) => {
        this.updateStatus({ids:[row.id],status:row.status==1?0:1})
    };
    updateStatus = (param)=>{
        Modal.confirm({
            title: `确认${param.ids.length>1?'批量':''}${param.status==1?'启用':'禁用'}对象?`,
            content: '',
            onOk: () => {
                updateObjStatus(param).then(res => {
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
    componentDidMount() {
        if(!this.props.interfaceId){
            const columns = this.state.columns;
            columns.splice(3,0,{
                dataIndex: 'interfaceLabel',
                title: '接口',
                width: 200,
                ellipsis: true,
                render: (col, row, index) => {
                    return (
                      col?
                      <div
                        className="obj-name"
                        onClick={() => {
                            this.viewMapRef.current[row.interfaceId] = null;
                            const interfaceData = {id:row.interfaceId,label:row.interfaceLabel};
                            this.props.push({
                                key: row.interfaceId,
                                ontology: this.props.ontology,
                                title: row.interfaceLabel,
                                view: (
                                  <InterfaceOverview
                                    onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                    ontology={this.props.ontology}
                                    ref={ref => this.viewMapRef.current[row.interfaceId] = ref}
                                    obj={interfaceData}
                                    changeTab={(tab, oper) =>this.props.changeTab && this.props.changeTab(tab, oper)}
                                    push={this.props.push}
                                    getRef={() => this.viewMapRef.current[row.interfaceId]}/>
                                )
                            })
                        }}>
                          <div className="icon-container">
                              <ObjectIcon icon={row.interfaceIcon || ''}/>
                          </div>
                          <Typography.Text ellipsis={{ showTooltip: true }}>
                              {col}
                          </Typography.Text>
                      </div>: <div> <Typography.Text type='secondary'>无接口</Typography.Text></div>
                    )
                }
            },)
        }
        this.getData();
    };
    handleSearchChange = (val) => {
        this.setState({
            filterVal: val,
            pagination: {
                ...this.state.pagination,
                current: 1
            }});

        // 清除之前的定时器
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // 设置新的定时器，500ms 后执行搜索
        this.searchTimeout = setTimeout(() => {
            this.getData();
        }, 500);
    };
    // 回车搜索
    handlePressEnter = () => {
        // 重置页码到第一页
        this.setState({
            pagination: {
                ...this.state.pagination,
                current: 1
            }
        }, () => {
            this.getData();
        });
    };
    componentWillUnmount() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
    render() {
        const {
            loading,
            data,
            pagination,
            selectedRowKeys,
            selectedRows,
            objVisible,
            existObjModalVisible,
            delObjSync,
          deleteVisible,
            deleteIds,
            columns,
            filterVal,
        } = this.state;
        const {interfaceId} =  this.props;
        return (
            <Spin
                className="obj-manager-spin"
                loading={loading}>
                <div
                    className="obj-manager">
                    <div
                        className="obj-manager-header">
                        <div
                            className="pos-left">
                            <span
                                className="title">
                                {interfaceId?'继承对象':'对象'}
                            </span>
                            <Tag
                                size="small">
                                {pagination.total}
                            </Tag>
                        </div>
                        <div
                            className="pos-right">
                                 <Input
                                    value={filterVal}
                                    allowClear
                                    suffix={
                                    <IconSearchColor
                                      style={{cursor:'pointer'}}
                                        onClick={this.handlePressEnter}
                                    />
                                    }
                                    placeholder="请输入"
                                    onChange={this.handleSearchChange}
                                    onPressEnter={this.handlePressEnter}
                                />
                            <Dropdown
                                key={'1'}
                                trigger='click'
                                droplist={
                                    <Menu onClickMenuItem={(key, e) => {
                                        e.stopPropagation();
                                        if(selectedRowKeys.length==0){
                                            Message.warning('请先选择一个对象');
                                            return
                                        }
                                        if (key === '1') {
                                            this.setState({
                                                deleteIds:selectedRowKeys,
                                                deleteVisible:true,
                                                delObjSync:true,
                                            });
                                        }
                                        if (key === '2') {
                                            let flag = true;
                                            let list:any[] = [];
                                            /*selectedRows.forEach(row=>{
                                                if(!row.dsId){
                                                    flag = false;
                                                    list.push(row.objectTypeLabel)
                                                }
                                            });*/
                                            if(flag){
                                                this.updateStatus({ids:selectedRowKeys,status:1})
                                            }else{
                                                Message.warning(`【${list.join()}】未绑定数据源禁止启用`);
                                            }
                                        }
                                        if (key === '3') {
                                            this.updateStatus({ids:selectedRowKeys,status:0})
                                        }
                                        if (key === '4') {
                                            this.removeObj(selectedRowKeys)
                                        }

                                    }}>
                                        {this.props?.interfaceId ?
                                          <Menu.Item
                                            key='4'>
                                              批量移除
                                          </Menu.Item>
                                          : <Menu.Item
                                            key='1'>
                                              批量删除
                                          </Menu.Item>}
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
                            {interfaceId?
                              <Dropdown
                              key={'1'}
                              trigger='click'
                              droplist={
                                  <Menu onClickMenuItem={(key, e) => {
                                      e.stopPropagation();
                                      if (key === 'addExist') {
                                          this.setState({
                                              existObjModalVisible: true
                                          })
                                      }
                                      if (key === 'addNew') {
                                          this.setState({
                                              objVisible: true
                                          })
                                      }
                                  }}>
                                      <Menu.Item
                                        key='addExist' disabled>
                                          添加已有对象
                                      </Menu.Item>
                                      <Menu.Item
                                        key='addNew'>
                                          新建继承对象
                                      </Menu.Item>
                                  </Menu>
                              }>
                                <Button
                                  type='secondary'>
                                    添加对象
                                    <IconArrowDown />
                                </Button>
                            </Dropdown>:<Button
                              onClick={() => {
                                  this.setState({
                                      objVisible: true
                                  })
                              }}>
                                新建对象
                            </Button>}
                        </div>
                    </div>
                    <div
                        className="obj-manager-content">
                        <Table
                            scroll={{
                                y: true
                            }}
                            rowKey='id'
                            columns={columns}
                            data={data}
                            rowSelection={{
                              type: 'checkbox',
                              selectedRowKeys,
                              onChange: (selectedRowKeys, selectedRows) => {
                                console.log('onChange:', selectedRowKeys, selectedRows);
                                this.setState({selectedRowKeys});
                                this.setState({selectedRows})
                               // setSelectedRowKeys(selectedRowKeys);
                              },
                              onSelect: (selected, record, selectedRows) => {
                                console.log('onSelect:', selected, record, selectedRows);
                              },
                              checkboxProps: (record) => {
                                return {
                                  disabled: record.id === '4',
                                };
                              },
                            }}
                            onChange={this.onChangeTable}
                            pagination={{
                                size: 'mini',
                                ...pagination,
                                onChange: this.handlePageChange,
                            }}/>
                    </div>
                </div>
                {objVisible && (
                    <Obj
                      ontology={this.props.ontology}
                      interfaceId={interfaceId}
                      close={()=>{this.setState({objVisible: false})}}
                      afterCreated={()=>{
                          this.getData();
                          this.props.updateParent && this.props.updateParent();
                      }}
                    />
                )}
                {existObjModalVisible && (
                    <ExistObjModal
                      ontology={this.props.ontology}
                      interfaceId={interfaceId}
                      close={()=>{this.setState({existObjModalVisible: false})}}
                      afterCreated={()=>{
                          this.getData();
                          this.props.updateParent && this.props.updateParent();
                      }}
                    />
                )}
                <Modal
                  style={{width:'300px'}}
                  title={<div style={{ textAlign: 'left', fontWeight: 600 }}>删除对象类型</div>}
                  visible={deleteVisible}
                  onOk={()=>this.handleDelete(deleteIds)}
                  onCancel={() => this.setState({deleteVisible:false})}
                  autoFocus={false}
                  focusLock={true}
                >
                    <div className='delete-modal'>
                        <Alert type='warning' content='删除对象类型时，会同步删除关联关系。您可以选择是否同步删除相关的逻辑和动作，选择不删除系统将禁用逻辑和动作，您可以后续编辑。' />
                        <div className='delete-content'>
                            <span>是否同步删除相关的逻辑和动作</span>
                            <Switch checkedText='是' uncheckedText='否' checked={delObjSync}
                                    onChange={(val) => this.setState({delObjSync: val})}/>
                        </div>

                    </div>
                </Modal>
            </Spin>
        )
    }
}

export default ObjManager;
