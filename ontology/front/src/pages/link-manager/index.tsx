import React, { useState, useEffect, useMemo } from 'react';
import { getData, deleteLink, updateStatus } from './api';
import {
    Switch,
    Button,
    Dropdown,
    Menu,
    Spin,
    Modal,
    Input,
    Message,
    Space,
    Form,Typography,
    Select, Tooltip,
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import Table from '@/components/Table';
import LinkOverview from '@/pages/link-overview';
import { IconDataMapColor, IconUserColor, IconSearchColor, IconArrowDown } from 'modo-design/icon';
import './style/index.less';
import oneToOneIcon from './images/oToO.svg';
import oneToManyIcon from './images/oToM.svg';
import manyToManyIcon from './images/mToM.svg';
import RelationModal from '@/pages/relationModal';

import right from '@/pages/diagram/icons/right.svg';
import left from '@/pages/diagram/icons/left.svg';
import {getAllTags} from "@/pages/relationModal/api";

class LinkManager extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      filterVal: '',
      loading: false,
      data: [],
      selectedRowKeys: [],
      linkModalVisible: false,
      isMulti: false,
      pagination: {
        total: 0,
        current: 1,
        pageSize: 20,
      },
        allTags:{},
    };
    this.viewMapRef = React.createRef();
    this.viewMapRef.current = {};
    this.searchTimeout = null;
  }
  formRef = React.createRef();
  getData = () => {
    this.setState({
      loading: true,
    });
    getData({
      keyword: this.state.filterVal,
      ontologyId: this.props.ontology.id,
      page: this.state.pagination.current,
      limit: this.state.pagination.pageSize,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data.content)) {
          const { data } = res.data;
          this.setState({
            data: data.content,
            pagination: {
              keyword: this.state.filterVal,
              total: data.totalElements,
              current: data.pageable.pageNumber + 1,
              pageSize: data.size,
            },
          });
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  swicthStatus = row => {
    this.updateLinkStatus({ ids: [row.id], status: row.status == 1 ? 0 : 1 });
  };
  updateLinkStatus = param => {
    updateStatus(param)
      .then(res => {
        if (res.data.success) {
          Message.success('更新成功');
        } else {
          Message.error('更新失败');
        }
      })
      .finally(() => {
        this.getData();
      });
  };
  handleDelete = ids => {
    Modal.confirm({
      title: '确认删除关系?',
      content: '',
      onOk: () => {
        deleteLink(ids)
          .then(res => {
            if (res.data.success) {
              Message.success('删除成功');
            } else {
              Message.error('删除失败');
            }
          })
          .finally(() => {
              this.setState({
                  pagination: {
                      ...this.state.pagination,
                      current: 1
                  }
              }, () => {
                  this.getData();
              });
          });
      },
    });
  };
  handlePageChange = (current: number, pageSize: number) => {
      this.setState({pagination:{...this.state.pagination,current,pageSize}},()=>{this.getData()});
  };
  renderLabel = row => {
    let labelIcon = <IconDataMapColor />;
    // switch (row.targetType) {
    //   case 'location':
    //     labelIcon = <IconDataMapColor />;
    //     break;
    //   case 'house':
    //     labelIcon = <IconHomeColor />;
    //     break;
    // }

    return (
      <Space className="link-type-content">
        <div className="link-type-item">
          <IconUserColor />
          {row.sourceObjectType.objectTypeLabel}
        </div>
        <img
          src={
            row.linkType === 1 && row.linkMethod === 1
              ? oneToOneIcon
              : row.linkType === 1 && row.linkMethod === 2
              ? oneToManyIcon
              : manyToManyIcon
          }
        />
        <div className="link-type-item">
          {labelIcon}
          {row.targetObjectType.objectTypeLabel}
        </div>
      </Space>
    );
  };
  handleCreateLink = ()=>{
    this.setState({
      linkModalVisible: true,
    });
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
    getAllTag = ()=>{
        getAllTags().then(res=>{
            if(res.data.success){
                const data = res.data.data;
                const tags = {};
                data.forEach(item=>{
                    item.id=item.id||item.tagName;
                    item.label=item.tagLabel;
                    item.value=item.tagName;
                    item.desc=item.tagDesc;
                    tags[item.id] = item;
                });
                this.setState({allTags:tags});
            }
        })
    };
  componentDidMount() {
    this.getAllTag();
    this.getData();
  }
  render() {
    const { loading, data, pagination, selectedRowKeys, linkModalVisible, filterVal } = this.state;
    return (
      <Spin className="link-manager-spin" loading={loading}>
        <div className="link-manager">
          <div className="link-manager-header">
            <div className="pos-left">
              <span className="title">关系</span>
              <Tag size="small">{pagination.total}</Tag>
            </div>
            <div className="pos-right">
                <Input
                  value={filterVal}
                  allowClear
                  suffix={
                      <IconSearchColor
                        style={{cursor: 'pointer'}}
                        onClick={this.handlePressEnter}
                      />
                  }
                  placeholder="请输入"
                  onChange={this.handleSearchChange}
                  onPressEnter={this.handlePressEnter}
                />
                <Dropdown
                key={'1'}
                trigger="click"
                droplist={
                  <Menu
                    onClickMenuItem={(key, e) => {
                      e.stopPropagation();
                      if(selectedRowKeys.length==0){
                        Message.warning('请先选择一个关系');
                        return
                    }
                      if (key === '1') {
                        this.handleDelete(selectedRowKeys);
                      }else if(key =='2'){
                        Modal.confirm({
                          title: '确认批量启用?',
                          content: '',
                          onOk: () => {
                            this.updateLinkStatus({ ids: selectedRowKeys, status:1 })
                          },
                        });
                       
                      }else if(key=='3'){
                        Modal.confirm({
                          title: '确认批量禁用?',
                          content: '',
                          onOk: () => {
                            this.updateLinkStatus({ ids: selectedRowKeys, status:0 })
                          },
                        });
                       
                      }
                    }}
                  >
                    <Menu.Item key="1">批量删除</Menu.Item>
                    <Menu.Item key="2">批量启用</Menu.Item>
                    <Menu.Item key="3">批量禁用</Menu.Item>
                  </Menu>
                }
              >
                <Button type="secondary">
                  批量操作
                  <IconArrowDown />
                </Button>
              </Dropdown>
              <Button
                onClick={() => {
                  this.setState({
                    linkModalVisible: true,
                  });
                }}
              >
                新建关系
              </Button>
            </div>
          </div>
          <div className="link-manager-content">
            <Table
              scroll={{
                y: true,
              }}
              rowKey="id"
              columns={[
                {
                  dataIndex: 'label',
                  title: '关系',
                  render: (col, row, index) => {
                    return (
                      <div
                        className="obj-name"
                        onClick={() => {
                          this.viewMapRef.current[row.id] = null;
                          this.props.push({
                            key: row.id,
                            ontology:this.props.ontology,
                            title: '关系详情',
                            view: (
                              <LinkOverview
                                onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                data={row}
                                ref={ref => {
                                  this.viewMapRef.current[row.id] = ref;
                                }}
                                push={this.props.push}
                                getRef={() => {
                                  return this.viewMapRef.current[row.id];
                                }}
                              />
                            ),
                          });
                        }}
                      >
                        {this.renderLabel(row)}
                      </div>
                    );
                  },
                },
                  {
                      dataIndex: 'sourceTag',
                      title: <Space size='mini' className='table-tag-item'>关系标签<img src={right} alt=""/></Space>,
                      render: (col, row, index) => {
                          const tags = col;
                          return (
                            Array.isArray(tags) && tags.length > 0 ?
                              <Space wrap key={row.id} style={{marginTop: '4px'}}>
                                  {tags.slice(0, 5).map((item, index) => (<Tag key={index} style={{maxWidth: '106px'}}>
                                      <Typography.Text ellipsis={{showTooltip: true}}>
                                          {this.state.allTags[item]?.label}
                                      </Typography.Text>
                                  </Tag>))}
                                  {tags.length > 5 ?
                                    <Tag key={index}> <Tooltip
                                      content={tags.slice(5).map(item=> {return this.state.allTags[item]?.label}).join('，')}>···</Tooltip></Tag> : ''}
                              </Space> : ''
                          );
                      },
                  },
                  {
                      dataIndex: 'targetTag',
                      title: <Space size='mini' className='table-tag-item'>关系标签<img src={left} alt=""/></Space>,
                      render: (col, row, index) => {
                          const tags = col;
                          return (
                            Array.isArray(tags) && tags.length > 0 ?
                              <Space wrap key={row.id} style={{marginTop: '4px'}}>
                                  {tags.slice(0, 5).map((item, index) => (<Tag key={index} style={{maxWidth: '106px'}}>
                                      <Typography.Text ellipsis={{showTooltip: true}}>
                                          {this.state.allTags[item]?.label}
                                      </Typography.Text>
                                  </Tag>))}
                                  {tags.length > 5 ?
                                    <Tag key={index}> <Tooltip
                                      content={tags.slice(5).map(item=> { return this.state.allTags[item]?.label}).join('，')}>···</Tooltip></Tag> : ''}
                              </Space> : ''
                          );
                      },
                  },
                {
                  dataIndex: 'status',
                  title: '状态',
                  width: 170,
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
                      <Switch
                        size="small"
                        checked={status}
                        onChange={() => this.swicthStatus(row)}
                      />
                    );
                  },
                },
                {
                  dataIndex: 'oper',
                  title: '操作',
                  width: 170,
                  render: (col, row, index) => {
                    return (
                      <div className="obj-oper-group">
                        <Button
                          size="mini"
                          type="text"
                          onClick={() => {
                            this.handleDelete([row.id]);
                          }}
                        >
                          删除
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={data}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (selectedRowKeys, selectedRows) => {
                  console.log('onChange:', selectedRowKeys, selectedRows);
                  this.setState({ selectedRowKeys });
                  // setSelectedRowKeys(selectedRowKeys);
                },
                onSelect: (selected, record, selectedRows) => {
                  console.log('onSelect:', selected, record, selectedRows);
                },
              }}
              pagination={{
                size: 'mini',
                ...pagination,
                onChange: this.handlePageChange,
              }}
            />
          </div>
        </div>
        {linkModalVisible && (
          <RelationModal
            ontology={this.props.ontology}
            close={() => {
              this.setState({ linkModalVisible: false });
            }}
            afterCreated={()=>{
              this.getAllTag();
              this.getData();
              this.props.updateParent && this.props.updateParent();
            }}
          />
        )}
      </Spin>
    );
  }
}

export default LinkManager;
