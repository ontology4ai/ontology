import Table from '@/components/Table';
import {
  Button,
  Space,
  Dropdown,
  Menu,
  Message,
  Modal,
  Spin,
  Switch,
} from '@arco-design/web-react';
import { IconArrowDown } from 'modo-design/icon';
import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import ObjectIcon from '@/components/ObjectIcon';
import oneToOneIcon from '@/pages/link-manager/images/oToO.svg';
import oneToManyIcon from '@/pages/link-manager/images/oToM.svg';
import CreateRelationModal from './components/create-relation-modal';
import { exploreConstraintPage, deleteConstraint } from '../../api/index';
import ConstraintDetailDrawer from './components/constraint-detail-drawer';
import './style/index.less';

const RelationshipConstraint = forwardRef((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [tableData, setTableData] = useState<[]>();
  const [detailVisible, setDetailVisible] = useState(false);
  const [constraintData, setConstraintData] = useState<any>();
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });

  const columns = [
    {
      dataIndex: 'actionLabel',
      title: '关系约束',
      render: (col: string, record: any, index: number) => {
        return (
          <div
            className="relationship-title"
            role="button"
            tabIndex={0}
            onClick={() => {
              setConstraintData(record);
              setDetailVisible(true);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setConstraintData(record);
                setDetailVisible(true);
              }
            }}
          >
            <Space>
              <div className="link-type-item">
                <ObjectIcon icon={record.interfaceIcon || ''} />
                {props.interfaceData.label}
              </div>
              <img src={getLinkIcon(record.constraintRelation)} alt="" />
              <div className="link-type-item">
                <ObjectIcon icon={record.objectTypeIcon || ''} />
                {record.objectTypeLabel}
              </div>
            </Space>
          </div>
        );
      },
    },
    {
      dataIndex: 'actionName',
      title: '连接目标类型',
      render: (col: string, record: any) => {
        return <Space>{record.constraintType === 1 ? '对象' : '接口'}</Space>;
      },
    },
    {
      dataIndex: 'oper',
      title: '操作',
      width: 170,
      render: (col: string, row: any) => {
        return (
          <div className="obj-oper-group">
            <Button size="mini" type="text" onClick={() => handleDelete({ id: row.id })}>
              删除
            </Button>
          </div>
        );
      },
    },
  ];
  const getLinkIcon = constraintRelation => {
    if (constraintRelation === '1To1') {
      return oneToOneIcon;
    }
    return oneToManyIcon;
  };
  useImperativeHandle(ref, () => ({
    handleCreate,
  }));
  const getData = async () => {
    setLoading(true);
    try {
      const { data } = await exploreConstraintPage({
        interfaceId: props.interfaceData.id,
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
    }
  };
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({ ...pagination, current, pageSize });
    getData();
  };

  const deleteActionFn = async params => {
    try {
      setLoading(true);
      // const params = ids.map(id => ({ id }));
      await deleteConstraint(params);
      Message.success('删除成功');
      getData();
    } catch (e) {
      setLoading(false);
      Message.error('删除失败');
    }
  };

  const updateActionFn = async (ids: Array<string>, status: number) => {
    // setLoading(true);
    // changeStatus({ ids, status })
    //   .then(res => {
    //     if (res.data.success) {
    //       Message.success('更新成功');
    //     } else {
    //       Message.error('更新失败');
    //     }
    //   })
    //   .finally(() => {
    //     getData();
    //   });
  };

  const handleDelete = params => {
    Modal.confirm({
      title: '提示',
      content: '删除关系约束时，与之映射的对象关系将取消继承。',
      onOk: () => {
        deleteActionFn(params);
      },
    });
  };

  const handleBatchAction = (key: string) => {
    if (key === '1') {
      Modal.confirm({
        title: '确认批量删除动作?',
        content: '',
        onOk: () => {
          // console.log('selectedRowKeys---', selectedRowKeys)
          // const params = selectedRowKeys.map(id => ({
          //   id,
          // }));
          // deleteActionFn(params);
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
  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <Spin loading={loading}>
      <div className="relationship">
        <div className="relationship-title">
          <div className="relationship-title__label">
            <div className="marker" />
            <div className="text">接口关系约束</div>
            <div className="total">{pagination.total}</div>
          </div>
          <div className="relationship-title__action">
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
                  {/* <Menu.Item key="2">批量启用</Menu.Item>
                  <Menu.Item key="3">批量禁用</Menu.Item> */}
                </Menu>
              }
            >
              <Button type="secondary">
                批量操作
                <IconArrowDown />
              </Button>
            </Dropdown>
            <Button onClick={() => handleCreate()}>新建关系约束</Button>
          </div>
        </div>
        <div className="relationship-content">
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
              onChange: (keys: string[], rows: any[]) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              },
            }}
          />
        </div>
      </div>
      {createModalVisible && (
        <CreateRelationModal
          interfaceData={props.interfaceData}
          onCancel={() => setCreateModalVisible(false)}
          onSuccess={() => {
            setCreateModalVisible(false);
            getData();
          }}
        />
      )}
      <ConstraintDetailDrawer
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        onSuccess={() => setDetailVisible(false)}
        interfaceData={props.interfaceData}
        constraintData={constraintData}
      />
    </Spin>
  );
});

export default RelationshipConstraint;
