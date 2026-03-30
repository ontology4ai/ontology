import Table from '@/components/Table';
import {
    Button,
    Dropdown,
    Menu,
    Message,
    Modal,
    Spin,
    Switch,
    Tooltip,
    Input, Space,Typography,Tag
} from '@arco-design/web-react';
import {
  IconSearchColor,
  IconArrowDown,
  IconRefreshColor,
  IconTopologyColor,
} from 'modo-design/icon';
import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import FunctionOverview from '../function-overview';
import { changeStatus, deleteLogic, logicList, syncFunction } from './api';
import LogicTypeEditModal from './logic-type-edit-modal';
import './style/index.less';
import fxActiveIcon from "@/pages/function-manager/images/fxactive.svg";

interface Ontology {
  id: string;
  ontologyName: string;
}

interface LogicTypeItem {
  id: string;
  logicTypeName: string;
  logicTypeLabel: string;
  buildType: string;
  status: number;
  lastUpdate: string;
  createTime: string;
}

interface FunctionManagerProps {
  ontology: Ontology;
  push: Function;
  onUpdateUseSaveBtn: Function;
}

const buildTypeMap = {
  function: '函数',
  api: 'API',
  link: 'Link',
};

const FunctionManager = forwardRef(({
  ontology,
  push,
  onUpdateUseSaveBtn,
  updateParent,
},ref) => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<LogicTypeItem[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filterVal, setFilterVal] = useState('');
  const [tableData, setTableData] = useState<LogicTypeItem[]>([]);
  const searchTimeoutRef = useRef();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const detailRef = useRef();

  const columns = [
    {
      dataIndex: 'logicTypeLabel',
      title: '中文名称',
      render: (col: string, record: LogicTypeItem, index: number) => {
        return (
          <Tooltip content={record.logicTypeLabel} position="top">
            <div
              role="button"
              tabIndex={0}
              className="logic-name active"
              onClick={() => handleDetail(record)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDetail(record);
                }
              }}
            >
              <img src={fxActiveIcon} alt=""/>
              <span className="logic-text">{record.logicTypeLabel}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'logicTypeName',
      title: '英文名称',
      render: (col: string, record: LogicTypeItem, index: number) => {
        return (
          <Tooltip content={record.logicTypeName}>
            <span className="overflow-text">{record.logicTypeName}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'fileName',
      title: '文件名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.fileName}>
            <span className="overflow-text">{record.fileName}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'objectTypeList',
      title: '对象',
      width: 180,
      render: (col: string, row: LogicTypeItem,index) => {
          if(col && col.length){
              const objs = col;
              return (
                Array.isArray(objs) && objs.length > 0 ?
                  <Space wrap key={row.id} style={{marginTop: '4px'}}>
                      {objs.slice(0, 3).map((item, index) => (<Tag key={index} style={{maxWidth: '100px'}}>
                          <Typography.Text ellipsis={{showTooltip: true}}>
                              {item.objectTypeLabel}
                          </Typography.Text>
                      </Tag>))}
                      {objs.length > 3 ?
                        <Tag key={index}> <Tooltip
                          content={objs.slice(3).map(item=> {return item.objectTypeLabel}).join('，')}>···</Tooltip></Tag> : ''}
                  </Space> : ''
              );
          }
          return '全局';
      },
    },
    {
      dataIndex: 'buildType',
      title: '构建方式',
      width: 120,
      render: (col: string, row: LogicTypeItem) => {
        return <>{buildTypeMap[row.buildType as keyof typeof buildTypeMap]}</>;
      },
    },

    {
      dataIndex: 'status',
      title: '状态',
      width: 120,
      filters: [
        {
          text: '禁用',
          value: 0,
        },
        {
          text: '启用',
          value: 1,
        },
      ],
      onFilter: (value: number, row: LogicTypeItem) => row.status === value,
      render: (col: string, row: LogicTypeItem) => {
        const state = row.status === 1;
        return (
          <Switch
            size="small"
            checked={state}
            onChange={value => updateFn([row.id], value ? 1 : 0)}
          />
        );
      },
    },
    {
      dataIndex: 'oper',
      title: '操作',
      width: 120,
      render: (col: string, row: LogicTypeItem) => {
        return (
          <div>
            <Button size="mini" type="text" onClick={() => handleDelete([row.id])}>
              删除
            </Button>
          </div>
        );
      },
    },
  ];
  const handleDetail = (row: LogicTypeItem) => {
    push({
      key: row.logicTypeName,
      ontology: ontology,
      title: row.logicTypeLabel,
      view: (
        <FunctionOverview
          data={row}
          ref={detailRef}
          ontology={ontology}
          getRef={() => detailRef.current}
          onUpdateUseSaveBtn={onUpdateUseSaveBtn}
        />
      ),
    });
  };
    useImperativeHandle(ref, () => ({
        getData:handleGetData,
    }));
  const refreshData = () => {
    setLoading(true);
    syncFunction({
      ontologyId: ontology?.id,
    })
      .then(res => {
        if (res.data.success) {
          Message.success('同步成功');
          handleGetData();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGetData = async () => {
    setLoading(true);
    try {
      const { data } = await logicList({
        keyword: filterVal,
        ontologyId: ontology?.id,
        page: pagination.current,
        limit: pagination.pageSize,
      });
      setTableData(data.data.content as any);
      setPagination({
        total: data.data.totalElements,
        current: data.data.pageable.pageNumber + 1,
        pageSize: data.data.size,
      });
    } finally {
      setLoading(false);
      setShouldFetch(false);
    }
  };

  const deleteFn = async (ids: Array<string>) => {
    setLoading(true);
    deleteLogic(ids)
      .then(res => {
        if (res.data.success) {
          Message.success('删除成功');
          // 重置到第一页并搜索
          setPagination({ ...pagination, current: 1 });
          setShouldFetch(true);
        } else {
          Message.error(res?.data?.message || '删除失败');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const updateFn = async (ids: Array<string>, status: number) => {
    try {
      setLoading(true);
      await changeStatus({ ids, status });
      handleGetData();
    } catch (e) {
      setLoading(false);
      Message.error('更新失败');
    }
  };

  const handleDelete = (ids: Array<string>) => {
    Modal.confirm({
      title: '确认删除逻辑?',
      content: '',
      onOk: () => {
        deleteFn(ids);
      },
    });
  };
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({ ...pagination, current, pageSize });
    setShouldFetch(true);
  };
  useEffect(() => {
    if (shouldFetch) {
      handleGetData();
    }
  }, [pagination.current, pagination.pageSize, shouldFetch]);
  const handleBatchAction = (key: string) => {
    if (key === '1') {
      Modal.confirm({
        title: '确认批量删除逻辑?',
        content: '',
        onOk: () => {
          deleteFn(selectedRowKeys);
        },
      });
    }
    if (key === '2') {
      Modal.confirm({
        title: '确认批量启用逻辑?',
        content: '',
        onOk: () => {
          updateFn(selectedRowKeys, 1);
        },
      });
    }
    if (key === '3') {
      Modal.confirm({
        title: '确认批量禁用逻辑?',
        content: '',
        onOk: () => {
          updateFn(selectedRowKeys, 0);
        },
      });
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);
  useEffect(() => {
    return () => {
      // 组件卸载时清理定时器
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  return (
    <Spin loading={loading}>
      <div className="logic-manager">
        <div className="logic-manager-title">
          <div className="logic-manager-title__label">
            <div className="marker" />
            <div className="text">逻辑</div>
            <div className="total">{pagination.total}</div>
          </div>
          <div className="logic-manager-title__action">
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
            <Button
              onClick={() => {
                refreshData();
              }}
            >
              <IconRefreshColor />
              刷新
            </Button>
            <Dropdown
              key="1"
              trigger="click"
              droplist={
                <Menu
                  onClickMenuItem={(key, e) => {
                    e.stopPropagation();
                    handleBatchAction(key);
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
                setCreateModalVisible(true);
              }}
            >
              新建逻辑
            </Button>
          </div>
        </div>
        <div className="logic-manager-content">
          <Table
            {...({ scroll: { y: true } } as any)}
            rowKey="id"
            columns={columns}
            data={tableData}
            pagination={{
              size: 'mini',
              ...pagination,
              onChange: handlePageChange,
            }}
            className="table"
            rowSelection={{
              selectedRowKeys,
              preserveSelectedRowKeys: true,
              onChange: (keys: string[], rows: LogicTypeItem[]) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              },
            }}
          />
        </div>
      </div>
      {createModalVisible && (
        <LogicTypeEditModal
          visible={createModalVisible}
          ontologyId={ontology.id}
          ontologyName={ontology.ontologyName}
          onClose={() => {
            setCreateModalVisible(false);
          }}
          afterCreated={row => {
            setCreateModalVisible(false);
            handleGetData();
            updateParent && updateParent();
            handleDetail(row);
          }}
        />
      )}
    </Spin>
  );
});

export default FunctionManager;
