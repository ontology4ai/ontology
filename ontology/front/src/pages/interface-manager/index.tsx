import ObjectIcon from '@/components/ObjectIcon';
import Table from '@/components/Table';
import {
  Button,
  Dropdown,
  Menu,
  Message,
  Modal,
  Spin,
  Switch,
  Input,
} from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconArrowDown, IconSearchColor } from 'modo-design/icon';
import React, { useEffect, useRef, useState } from 'react';
import { deleteInterface, getData, updateStatus } from './api';
import { InterfaceModal } from './interface-modal';
import './style/index.less';
// import AttrImpactAnalysisModal from './components/attr-impact-analysis-modal';
import InterfaceOverview from '@/pages/interface-overview';

const InterfaceManager = props => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [interfaceVisible, setInterfaceVisible] = useState(false);
  const [filterVal, setFilterVal] = useState('');

  const [shouldFetch, setShouldFetch] = useState(false);
  const searchTimeoutRef = useRef();
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20
  });

  const viewMapRef = useRef({});

  const fetchData = () => {
    setLoading(true);
    getData({
      keyword: filterVal,
      ontologyId: props.ontology.id,
      page: pagination.current,
      limit: pagination.pageSize,
    })
      .then(res => {
        if (Array.isArray(res?.data?.data?.content)) {
          const { data: resData } = res.data;
          setData(resData.content);
          setPagination({
            total: resData.totalElements,
            current: resData.pageable.pageNumber + 1,
            pageSize: resData.size,
          });
        }
      })
      .finally(() => {
        setLoading(false);
        setShouldFetch(false);
      });
  };

  const onChangeTable = newPagination => {
    setPagination({ ...newPagination });
    setShouldFetch(true);
  };

  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({ ...pagination, current, pageSize });
    setShouldFetch(true);
  };

  const swicthStatus = row => {
    const status = row.status === 1 ? 0 : 1;
    handleUpdateStatus([{ interfaceId: row.id, status }], status);
  };

  const handleUpdateStatus = (param, status) => {
    const text = `${status === 1 ? '启用' : '禁用'}接口时，继承接口的对象将同步${
      status === 1 ? '启用' : '禁用'
    }`;
    Modal.confirm({
      title: '提示',
      content: text,
      onOk: () => {
        updateStatus(param)
          .then(res => {
            if (res.data.success) {
              Message.success('更新成功');
            } else {
              Message.error('更新失败');
            }
          })
          .finally(() => {
            fetchData();
          });
      },
    });
  };
  const handleDelete = ids => {
    const params = ids.map(id => ({ interfaceId: id }));
    Modal.confirm({
      title: '提示',
      content: '删除接口时，继承接口的对象将取消继承',
      onOk: () => {
        deleteInterface(params)
          .then(res => {
            if (res.data.success) {
              Message.success('删除成功');
            } else {
              Message.error('删除失败');
            }
          })
          .finally(() => {
            setPagination({ ...pagination, current: 1 });
            setShouldFetch(true);
          });
      },
    });
  };
  useEffect(() => {
    if(shouldFetch){
      fetchData();
    }
  }, [pagination.current, pagination.pageSize,shouldFetch]);
  useEffect(()=>{
    fetchData();
  },[]);

  const columns = [
    {
      dataIndex: 'label',
      title: '中文名称',
      width: 200,
      render: (col, row, index) => {
        return (
          <div
            className="interface-name"
            onClick={() => {
              viewMapRef.current[row.id] = null;
              props.push({
                key: row.id,
                ontology: props.ontology,
                title: row.label,
                view: (
                  <InterfaceOverview
                    onUpdateUseSaveBtn={props.onUpdateUseSaveBtn}
                    ontology={props.ontology}
                    ref={ref => (viewMapRef.current[row.id] = ref)}
                    obj={row}
                    changeTab={(tab, oper) => props.changeTab && props.changeTab(tab, oper)}
                    push={props.push}
                    getRef={() => viewMapRef.current[row.id]}
                  />
                ),
              });
            }}
          >
            <div className="interface-icon">
              <ObjectIcon icon={row.icon || ''} />
            </div>
            {col}
          </div>
        );
      },
    },
    {
      dataIndex: 'name',
      title: '英文名称',
    },
    {
      dataIndex: 'status',
      title: '状态',
      width: 60,
      render: (col, row, index) => {
        return <Switch size="small" checked={Boolean(col)} onChange={() => swicthStatus(row)} />;
      },
    },
    {
      dataIndex: 'oper',
      title: '操作',
      width: 100,
      render: (col, row, index) => {
        return (
          <div className="obj-oper-group">
            <Button
              size="mini"
              type="text"
              onClick={() => {
                handleDelete([row.id]);
              }}
            >
              删除
            </Button>
          </div>
        );
      },
    },
  ];
  useEffect(() => {
    return () => {
      // 组件卸载时清理定时器
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  return (
    <Spin className="obj-manager-spin" loading={loading}>
      <div className="obj-manager">
        <div className="obj-manager-header">
          <div className="pos-left">
            <span className="title">接口</span>
            <Tag size="small">{pagination.total}</Tag>
          </div>
          <div className="pos-right">
            <Input
              value={filterVal}
              allowClear
              suffix={
                <IconSearchColor
                  style={{cursor:'pointer'}}
                  onClick={() => {
                    // 重置到第一页并搜索
                    setPagination({ ...pagination, current: 1 });
                    setShouldFetch(true);
                  }}
                />
              }
              placeholder="请输入"
              onChange={val => {
                setFilterVal(val);

                // 清除之前的定时器
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }

                // 设置新的定时器，500ms后重置页码并搜索
                searchTimeoutRef.current = setTimeout(() => {
                  setPagination(prev => ({ ...prev, current: 1 }));
                  setShouldFetch(true);
                }, 500);
              }}
              onPressEnter={() => {
                // 重置到第一页并搜索
                setPagination({ ...pagination, current: 1 });
                setShouldFetch(true);
              }}
            />
            <Dropdown
              key="1"
              trigger="click"
              droplist={
                <Menu
                  onClickMenuItem={(key, e) => {
                    e.stopPropagation();
                    if (selectedRowKeys.length === 0) {
                      Message.warning('请先选择一个接口');
                      return;
                    }
                    if (key === '1') {
                      handleDelete(selectedRowKeys);
                    }
                    if (key === '2') {
                      const params = selectedRowKeys.map(id => ({
                        interfaceId: id,
                        status: 1,
                      }));
                      handleUpdateStatus(params, 1);
                    }
                    if (key === '3') {
                      const params = selectedRowKeys.map(id => ({
                        interfaceId: id,
                        status: 0,
                      }));

                      handleUpdateStatus(params, 0);
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
            <Button onClick={() => setInterfaceVisible(true)}>新建接口</Button>
          </div>
        </div>
        <div className="obj-manager-content">
          <Table
            scroll={{ y: true }}
            rowKey="id"
            columns={columns}
            data={data}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (newSelectedRowKeys, newSelectedRows) => {
                console.log('onChange:', newSelectedRowKeys, newSelectedRows);
                setSelectedRowKeys(newSelectedRowKeys);
                setSelectedRows(newSelectedRows);
              },
              onSelect: (selected, record, selectedRows) => {
                console.log('onSelect:', selected, record, selectedRows);
              },
              checkboxProps: record => {
                return {
                  disabled: record.id === '4',
                };
              },
            }}
            onChange={onChangeTable}
            pagination={{
              size: 'mini',
              ...pagination,
              onChange: handlePageChange,
            }}
          />
        </div>
      </div>
      {/* <AttrImpactAnalysisModal /> */}
      {interfaceVisible && (
        <InterfaceModal
          visible={interfaceVisible}
          ontology={props.ontology}
          close={() => setInterfaceVisible(false)}
          afterCreated={() => {
            fetchData();
            props.updateParent && props.updateParent();
          }}
        />
      )}
    </Spin>
  );
};

export default InterfaceManager;
