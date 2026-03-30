import Table from '@/components/Table';
import ActionModal from '@/pages/action-modal';
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
import {
  IconArrowDown,
  IconDataResDirColor,
  IconTopologyColor,
  IconWebSharedColor,
  IconIotColor,
  IconRefreshColor,
  IconSearchColor,
  IconServerNodeColor,
} from 'modo-design/icon';
import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import ActionTypeDetail from '../action-type-detail';
import FuncActionDetail from './function-action-detail';
import ApiActionDetail from './api-action-detail';
import FunctionActionModal from './function-action-modal';
import ApiActionModal from './api-action-modal';
import { deleteAction, getActionList, changeStatus, syncAction } from './api';
import './style/index.less';
interface Ontology {
  id: string;
  ontologyName: string;
}

interface ObjectType {
  objectTypeLabel: string;
}

interface ActionTypeItem {
  id: string;
  ontologyId: string;
  actionName: string;
  actionLabel: string;
  objectType: ObjectType;
  status: number;
  lastUpdate: string;
  createTime: string;
  actionDesc: string;
  buildType: string;
}

interface ActionManagerProps {
  ontology: Ontology;
  push: Function;
  updateParent: Function;
  onUpdateUseSaveBtn: Function;
}
export interface ActionManagerRef {
  handleSave: (callback: (...args: any) => void) => Promise<void> | void;
}
const ActionManager = forwardRef((props: ActionManagerProps, ref) => {
  const { ontology, push, updateParent, onUpdateUseSaveBtn } = props;
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<ActionTypeItem[]>([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [functionActionModalVisible, setFunctionActionModalVisible] = useState(false);
  const [apiActionModalVisible, setApiActionModalVisible] = useState(false);
  const [tableData, setTableData] = useState<ActionTypeItem[]>();
  const [filterVal, setFilterVal] = useState('');
  const searchTimeoutRef = useRef();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const actionTypeDetailRef = useRef(null);
  const columns = [
    {
      dataIndex: 'actionLabel',
      title: '中文名称',
      render: (col: string, record: ActionTypeItem, index: number) => {
        return (
          <div
            role="button"
            tabIndex={0}
            className="action-name active"
            onClick={() => gotoActionTypeDetail(record)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                gotoActionTypeDetail(record);
              }
            }}
          >
            <IconTopologyColor /> {col}
          </div>
        );
      },
    },
    {
      dataIndex: 'actionName',
      title: '英文名称',
    },
    {
      dataIndex: 'buildType',
      title: '构建方式',
      width: 120,
      render: (col: string) => {
        return col === 'function' ? '函数' : col === 'api' ? 'API' : '对象';
      },
    },
    {
      dataIndex: 'object',
      title: '执行对象',
      width: 200,
      render: (col: string, record: ActionTypeItem, index: number) => {
        const objectTypeLabel = record.objectType?.objectTypeLabel;
        return (
          <div className="action-name">
            <IconDataResDirColor /> {objectTypeLabel || '-'}
          </div>
        );
      },
    },
    {
      dataIndex: 'state',
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
      onFilter: (value: number, row: ActionTypeItem) => row.status === value,
      render: (col: string, row: ActionTypeItem) => {
        const state = row.status === 1;
        return (
          <Switch
            size="small"
            checked={state}
            onChange={value => updateActionFn([row.id], value ? 1 : 0)}
          />
        );
      },
    },
    {
      dataIndex: 'oper',
      title: '操作',
      width: 170,
      render: (col: string, row: ActionTypeItem) => {
        return (
          <div className="obj-oper-group">
            <Button size="mini" type="text" onClick={() => handleDelete([row.id])}>
              删除
            </Button>
          </div>
        );
      },
    },
  ];
  const gotoActionTypeDetail = (row: ActionTypeItem) => {
    const view =
      row.buildType === 'function' ? (
        <FuncActionDetail actionDataId={row.id} onUpdateUseSaveBtn={onUpdateUseSaveBtn} />
      ) : row.buildType === 'api' ? (
        <ApiActionDetail actionDataId={row.id} onUpdateUseSaveBtn={onUpdateUseSaveBtn} />
      ) : (
        <ActionTypeDetail
          ref={actionTypeDetailRef}
          action={row}
          ontology={ontology}
          onUpdateUseSaveBtn={onUpdateUseSaveBtn}
          getRef={() => actionTypeDetailRef.current}
        />
      );

    push({
      key: row.id,
      ontology: ontology,
      title: row.actionLabel,
      view,
    });
  };
  useImperativeHandle(ref, () => ({
    handleCreateAction,
    handleSave: async (callback: (...args: any) => void) => {
      if (
        actionTypeDetailRef.current &&
        typeof actionTypeDetailRef.current?.handleSave === 'function'
      ) {
        return await actionTypeDetailRef.current.handleSave(callback);
      }
    },
    getData,
  }));
  const getData = async () => {
    setLoading(true);
    try {
      const { data } = await getActionList({
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
      setShouldFetch(false);
      setLoading(false);
    }
  };
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({ ...pagination, current, pageSize });
    setShouldFetch(true);
    //getData();
  };
  useEffect(() => {
    if (shouldFetch) {
      getData();
    }
  }, [pagination.current, pagination.pageSize, shouldFetch]);

  const deleteActionFn = async (ids: Array<string>) => {
    try {
      setLoading(true);
      await deleteAction(ids);
      Message.success('删除成功');
      // 重置到第一页并搜索
      setPagination({ ...pagination, current: 1 });
      setShouldFetch(true);
    } catch (e) {
      setLoading(false);
      Message.error('删除失败');
    }
  };

  const updateActionFn = async (ids: Array<string>, status: number) => {
    setLoading(true);
    changeStatus({ ids, status })
      .then(res => {
        if (res.data.success) {
          Message.success('更新成功');
        } else {
          Message.error('更新失败');
        }
      })
      .finally(() => {
        getData();
      });
  };

  const handleDelete = (ids: Array<string>) => {
    Modal.confirm({
      title: '确认删除动作?',
      content: '',
      onOk: () => {
        deleteActionFn(ids);
      },
    });
  };

  const handleBatchAction = (key: string) => {
    if (key === '1') {
      Modal.confirm({
        title: '确认批量删除动作?',
        content: '',
        onOk: () => {
          deleteActionFn(selectedRowKeys);
        },
      });
    }
    if (key === '2') {
      Modal.confirm({
        title: '确认批量启用动作?',
        content: '',
        onOk: () => {
          updateActionFn(selectedRowKeys, 1);
        },
      });
    }
    if (key === '3') {
      Modal.confirm({
        title: '确认批量禁用动作?',
        content: '',
        onOk: () => {
          updateActionFn(selectedRowKeys, 0);
        },
      });
    }
  };
  const syncActionList = () => {
    setSyncLoading(true);
    return syncAction({ ontologyId: ontology?.id })
      .then(res => {
        if (res.data.success) {
          Message.success('同步成功');
        } else {
          Message.error('同步失败');
        }
      })
      .finally(() => {
        setSyncLoading(false);
      });
  };
  const handleCreateAction = (key: string) => {
    if (key === 'object') {
      setActionModalVisible(true);
    } else if (key === 'function') {
      setFunctionActionModalVisible(true);
    } else if (key === 'api') {
      setApiActionModalVisible(true);
    }
  };

  useEffect(() => {
    getData();
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
      <div className="action-manager">
        <div className="action-manager-title">
          <div className="action-manager-title__label">
            <div className="marker" />
            <div className="text">动作</div>
            <div className="total">{pagination.total}</div>
          </div>
          <div className="action-manager-title__action">
            <Input
              value={filterVal}
              allowClear
              suffix={
                <IconSearchColor
                  style={{ cursor: 'pointer' }}
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
              loading={syncLoading}
              onClick={async () => {
                await syncActionList();
                await setPagination({ ...pagination, current: 1, pageSize: 20 });
                await getData();
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
                    if(selectedRowKeys.length==0){
                      Message.warning('请先选择一个动作');
                      return
                  }
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
            <Dropdown
              key="1"
              trigger="click"
              droplist={
                <Menu
                  onClickMenuItem={(key, e) => {
                    e.stopPropagation();
                    handleCreateAction(key);
                  }}
                >
                  <Menu.Item key="object">
                    <IconWebSharedColor />
                    基于对象创建
                  </Menu.Item>
                  <Menu.Item key="function">
                    <IconIotColor />
                    基于函数创建
                  </Menu.Item>
                  <Menu.Item key="api">
                    <IconServerNodeColor />
                    基于API创建
                  </Menu.Item>
                </Menu>
              }
            >
              <Button>
                新建动作
                <IconArrowDown />
              </Button>
            </Dropdown>
          </div>
        </div>
        <div className="action-manager-content">
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
              onChange: (keys: string[], rows: ActionTypeItem[]) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              },
            }}
          />
        </div>
      </div>
      {actionModalVisible && (
        <ActionModal
          ontology={ontology}
          close={() => {
            setActionModalVisible(false);
          }}
          afterCreated={() => {
            getData();
            updateParent && updateParent();
          }}
        />
      )}
      <FunctionActionModal
        visible={functionActionModalVisible}
        ontologyId={ontology.id}
        ontologyName={ontology.ontologyName}
        onClose={() => {
          setFunctionActionModalVisible(false);
        }}
        afterCreated={row => {
          setFunctionActionModalVisible(false);
          getData();
          updateParent && updateParent();
          gotoActionTypeDetail(row);
        }}
      />
      <ApiActionModal
        visible={apiActionModalVisible}
        ontologyId={ontology.id}
        ontologyName={ontology.ontologyName}
        onClose={() => {
          setApiActionModalVisible(false);
        }}
        afterCreated={row => {
          setApiActionModalVisible(false);
          getData();
          updateParent && updateParent();
          gotoActionTypeDetail(row);
        }}
      />
    </Spin>
  );
});

export default ActionManager;
