import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import { processDetail } from '../api';
import Table from '@/components/Table';
import { render } from 'enzyme';

interface TaskRecordDetailObjectProps {
  taskId: string;
}

interface InnerTableState {
  data: any[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
}

interface TableItem {
  id: string;
  content: string;
}
interface InnerTableItem {
  id: string;
  content: string;
}
const TaskRecordDetailObject: React.FC<TaskRecordDetailObjectProps> = ({ taskId }) => {
  const columns = [
    {
      title: '中文名称',
      dataIndex: 'label',
    },
    {
      title: '英文名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'desc',
    },
  ];
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const getTableData = async (
    pageNumber = pagination.current,
    pageSize = pagination.pageSize,
    params = {},
  ) => {
    setLoading(true);
    try {
      const res = await processDetail({
        taskId,
        resourceType: 'object',
        page: pageNumber,
        limit: pageSize,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setTableData(
          data.content.map((item: TableItem) => ({
            ...item,
            ...(item.content ? JSON.parse(item.content) : {}),
          })),
        );
        setPagination({ ...pagination, current: pageNumber, pageSize, total: data.totalElements });
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(true);
    }
  };
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({
      ...pagination,
      current,
      pageSize,
    });

    getTableData(current, pageSize);
  };

  // 使用 Map 来管理每个展开行的内部表格状态
  const [innerTableStates, setInnerTableStates] = useState<Map<string, InnerTableState>>(new Map());

  const updateInnerTableState = (objectId: string, newState: Partial<InnerTableState>) => {
    setInnerTableStates(prev => {
      const newMap = new Map(prev);
      const currentState = newMap.get(objectId) || {
        data: [],
        loading: false,
        pagination: { current: 1, pageSize: 10, total: 0 },
      };

      newMap.set(objectId, { ...currentState, ...newState });
      return newMap;
    });
  };

  const innerColumns = [
    {
      title: '属性中文名',
      dataIndex: 'label',
    },
    {
      title: '属性英文名',
      dataIndex: 'name',
    },
    {
      title: '是否主键',
      dataIndex: 'isPrimaryKey',
      render: (isPrimaryKey: boolean) => (isPrimaryKey ? '是' : '否'),
    },
  ];
  const getInnerTableData = async (
    objectId: string,
    pageNumber = innerTableStates.get(objectId)?.pagination.current || 1,
    pageSize = innerTableStates.get(objectId)?.pagination.pageSize || 10,
  ) => {
    updateInnerTableState(objectId, { loading: true });

    try {
      const res = await processDetail({
        taskId,
        resourceType: 'attr',
        page: pageNumber,
        limit: pageSize,
        objectId, // 传入具体的objectId
      });

      const { data, success } = res.data;

      if (success) {
        updateInnerTableState(objectId, {
          data: data.content.map((item: InnerTableItem) => ({
            ...item,
            ...(item.content ? JSON.parse(item.content) : {}),
          })),
          pagination: {
            ...innerTableStates.get(objectId)?.pagination,
            current: pageNumber,
            pageSize,
            total: data.totalElements || 0,
          },
        });
      }
    } catch (error) {
      console.error(`Error fetching inner table data for object ${objectId}:`, error);
    } finally {
      updateInnerTableState(objectId, { loading: false });
    }
  };
  const handleInnerPageChange = (objectId: string) => (current: number, pageSize: number) => {
    getInnerTableData(objectId, current, pageSize);
  };

  const handleExpand = (record: any, expanded: boolean) => {
    const objectId = record.id; // 获取当前行的objectId

    expanded && getInnerTableData(objectId);
  };

  useEffect(() => {
    getTableData();
  }, []);

  return (
    <div className="task-record-detail-object">
      <Table
        {...({ scroll: { y: true } } as any)}
        rowKey="id"
        columns={columns}
        data={tableData}
        loading={loading}
        pagination={{
          size: 'mini',
          ...pagination,
          onChange: handlePageChange,
        }}
        expandedRowRender={(record: TableItem) => {
          const objectId = record.id;
          const state = innerTableStates.get(objectId);

          return (
            <div style={{ padding: '10px 0' }}>
              <Table
                {...({ scroll: { y: true } } as any)}
                style={{ height: '300px', margin: 0 }}
                rowKey="id"
                columns={innerColumns}
                data={state?.data || []}
                loading={state?.loading || false}
                pagination={{
                  size: 'mini',
                  ...state?.pagination,
                  onChange: handleInnerPageChange(objectId),
                }}
              />
            </div>
          );
        }}
        onExpand={handleExpand}
      />
    </div>
  );
};

export default TaskRecordDetailObject;
