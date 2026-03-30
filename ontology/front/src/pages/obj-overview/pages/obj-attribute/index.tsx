import React, { useState, useEffect, useMemo } from 'react';
import { getData, changeStatus, deleteAttr } from './api';
import {
  Spin,
  Switch,
  Button,
  Dropdown,
  Menu,
  Form,
  Grid,
  Input,
  Select,
  InputNumber,
  Alert,
  Message,
  Modal,
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import Table from '@/components/Table';
import {
  IconDataCatalogMgrColor,
  IconEyeColor,
  IconCaretBottom,
  IconReportEditColor,
  IconAdd,
  IconCounterColor,
  IconBackupsShareColor,
  IconDataIntegrationColor,
  IconCalendarColor,
  IconTextareaColor,
  IconUnitMgrColor,
  IconPlateCreatedColor,
  IconEditColor,
  IconDeleteColor,
  IconUserColor,
  IconDataMapColor,
  IconGuide,
} from 'modo-design/icon';
import ObjEmpty from './components/Empty';
import ObjAttributeCanvas from '../obj-attribute-canvas';
import './style/index.less';

interface ObjAttributeProps {
  obj: {
    id: string;
    objectTypeLabel: string;
  };
  ontology: any;
  push: (params: any) => void;
  onUpdateUseSaveBtn: Function;
}

interface ObjAttributeState {
  loading: boolean;
  data: {
    attributes: any[];
    dsId?: string;
  };
  selectedRowKeys: string[];
  selectedRows: string[];
  edit: boolean;
}


const renderIcon = (option) => {
  let labelIcon = '';
  switch (option) {
    case 'string':
      labelIcon = <IconTextareaColor  style={{ color: 'var(--color-text-2)', marginRight: '4px' }}/>;
      break;
    case 'int':
      labelIcon = <IconCounterColor style={{ color: 'var(--color-text-2)', marginRight: '4px' }}/>;
      break;
    case 'decimal':
      labelIcon = <IconDataIntegrationColor style={{ color: 'var(--color-text-2)', marginRight: '4px' }}/>;
      break;
    case 'bool':
      labelIcon = <IconUnitMgrColor style={{ color: 'var(--color-text-2)', marginRight: '4px' }}/>;
      break;
    case 'date':
      labelIcon = <IconCalendarColor style={{ color: 'var(--color-text-2)', marginRight: '4px' }}/>;
      break
  }
  return labelIcon
};

class ObjAttribute extends React.Component<ObjAttributeProps, ObjAttributeState> {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      data: {
        attributes: [],
      },
      selectedRowKeys: [],
      selectedRows: [],
      edit: false,
    };
  }
  getData = () => {
    this.setState({
      loading: true,
    });
    getData(this.props.obj.id)
      .then(res => {
        if (res.data.data) {
          const { data } = res.data;
          this.setState({
            data,
          });
        }
      })
      .catch(err => {})
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  updateStatusFn = async (ids: Array<string>, status: number) => {
    this.setState({
      loading: true,
    });
    changeStatus({ ids, status })
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

  handleAddAttr = () => {
    const ref = React.createRef<any>();
    const { obj } = this.props;
    this.props.push({
      ontology: this.props.ontology,
      key: `${obj.id}-attribute-edit`,
      title: `${obj.objectTypeLabel}属性映射编辑`,
      view: <ObjAttributeCanvas ref={ref} getRef={() => ref.current} obj={obj} />,
    });
  };

  deleteAttrFn = async (ids: Array<string>) => {
    try {
      this.setState({
        loading: true,
      });
      await deleteAttr({ ids }).then(res => {
        if (res.data.success) {
          Message.success('删除成功');
        } else {
          Message.error('删除失败');
        }
      });
      this.getData();
    } catch (e) {
      this.setState({
        loading: false,
      });
      Message.error('删除失败');
    }
  };
  handleDelete = (ids: Array<string>) => {
    Modal.confirm({
      title: '确认删除属性?',
      content: '',
      onOk: () => {
        this.deleteAttrFn(ids);
      },
    });
  };
  handleBatchAction = (key: string) => {
    const { selectedRowKeys, selectedRows } = this.state;
    if (key === '3') {
      Modal.confirm({
        title: '确认批量删除属性?',
        content: '',
        onOk: () => {
          this.deleteAttrFn(selectedRowKeys);
        },
      });
    }
    if (key === '1') {
      Modal.confirm({
        title: '确认批量启用属性?',
        content: '',
        onOk: () => {
          let flag = false;
          selectedRows.forEach(row => {
            if (!row.fieldName) {
              flag = true;
            }
          });
          if (flag) {
            Message.warning('未绑定数据源禁止启用');
            return;
          }
          this.updateStatusFn(selectedRowKeys, 1);
        },
      });
    }
    if (key === '2') {
      Modal.confirm({
        title: '确认批量禁用属性?',
        content: '',
        onOk: () => {
          this.updateStatusFn(selectedRowKeys, 0);
        },
      });
    }
  };
  componentDidMount() {
    this.getData();
  }
  render() {
    const { loading, data, selectedRowKeys } = this.state;
    const { obj } = this.props;
    return (
      <Spin loading={loading} className="obj-attribute-spin">
        <div className="obj-attribute">
          <div className="edit-attr card">
            <div className="card-header">
              <div className="title">
                <div className="icon">
                  <IconReportEditColor />
                </div>
                编辑属性映射
              </div>
              <div className="oper-group">
                <Button
                  type="text"
                  onClick={() => {
                    console.log("obj", obj);
                    const ref = React.createRef();
                    this.props.push({
                      ontology: this.props.ontology,
                      key: `${obj.id}-attribute-edit`,
                      title: `${obj.objectTypeLabel}属性映射编辑`,
                      view: (
                        <ObjAttributeCanvas
                          ref={ref}
                          getRef={() => ref.current}
                          obj={obj}
                          onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                        />
                      ),
                    });
                  }}
                >
                  进入编辑
                </Button>
              </div>
            </div>
          </div>
          <div className="attr-list card">
            <div className="card-header">
              <div className="title">
                属性
                <Tag size="small" style={{ marginLeft: '8px' }}>
                  {data.attributes.length}
                </Tag>
              </div>
              <div className="oper-group">
                <Dropdown
                  position="br"
                  droplist={
                    <Menu
                      onClickMenuItem={(key, e) => {
                        e.stopPropagation();
                        this.handleBatchAction(key);
                      }}
                    >
                      <Menu.Item key="1">批量启用</Menu.Item>
                      <Menu.Item key="2">批量禁用</Menu.Item>
                      <Menu.Item key="3">批量删除</Menu.Item>
                    </Menu>
                  }
                >
                  <Button>
                    批量操作
                    <IconCaretBottom />
                  </Button>
                </Dropdown>
              </div>
            </div>
            <div className="card-content">
              <Table
                rowKey="id"
                columns={[
                  {
                    dataIndex: 'attributeName',
                    title: '名称',
                    render: (col, row, index) => {
                      return (
                        <div className="attr-label">
                          {/*{row.isPrimaryKey ? (
                            <IconCounterColor
                              style={{ color: 'var(--color-text-2)', marginRight: '4px' }}
                            />
                          ) : null}
                          {!row.isPrimaryKey ? (
                            <IconTextareaColor
                              style={{ color: 'var(--color-text-2)', marginRight: '4px' }}
                            />
                          ) : null}*/}
                          {renderIcon(row.fieldType)}
                          {col}
                          {row.isPrimaryKey || row.isTitle ? (
                            <IconBackupsShareColor
                              style={{ color: 'var(--color-primary-6)', marginLeft: '8px' }}
                            />
                          ) : null}
                          {row.isPrimaryKey ? (
                            <Tag size="small" effect="plain" color="arcoblue">
                              Primary key
                            </Tag>
                          ) : null}
                          {row.isTitle ? (
                            <Tag size="small" effect="plain" color="cyan">
                              Title
                            </Tag>
                          ) : null}
                        </div>
                      );
                    },
                  },
                  {
                    dataIndex: 'status',
                    title: '状态',
                    width: 60,
                    render: (col, row, index) => {
                      return (
                        <Switch
                          disabled={!row.fieldName}
                          size="small"
                          checked={Boolean(col)}
                          onChange={value => this.updateStatusFn([row.id], value ? 1 : 0)}
                        />
                      );
                    },
                  },
                  {
                    dataIndex: 'oper',
                    title: '操作',
                    width: 90,
                    align: 'center',
                    render: (col, row, index) => {
                      return (
                        <Button type="text" onClick={() => this.handleDelete([row.id])}>
                          删除
                        </Button>
                      );
                    },
                  },
                ]}
                data={
                  /*[
                                    {
                                        label: 'label',
                                        state: 1
                                    },
                                    {
                                        label: 'label',
                                        state: 1
                                    },
                                    {
                                        label: 'label',
                                        state: 0
                                    },
                                    {
                                        label: 'label',
                                        state: 0
                                    },
                                    {
                                        label: 'label',
                                        state: 1
                                    },
                                    {
                                        label: 'label',
                                        state: 1
                                    },
                                    {
                                        label: 'label',
                                        state: 1
                                    },
                                    {
                                        label: 'label',
                                        state: 1
                                    },
                                    {
                                        label: 'label',
                                        state: 1
                                    }
                                ]*/ data.attributes
                }
                pagination={{
                  size: 'small',
                  total: data.attributes.length,
                }}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys,
                  onChange: (selectedRowKeys: string[], selectedRows: any[]) => {
                    this.setState({ selectedRowKeys });
                    this.setState({ selectedRows });
                  },
                  onSelect: (selected: boolean, record: any, selectedRows: any[]) => {
                    // 处理选择事件
                  },
                  checkboxProps: record => {
                    return {
                      disabled: record.id === '4',
                    };
                  },
                }}
              />
            </div>
          </div>
        </div>
      </Spin>
    );
  }
}

export default ObjAttribute;
