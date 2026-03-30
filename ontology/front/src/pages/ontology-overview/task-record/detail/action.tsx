import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import Table from '@/components/Table';
import { IconDataResDirColor, IconTopologyColor } from 'modo-design/icon';
import { processDetail } from '../api';

interface TaskRecordDetailActionProps {
  taskId: string;
}
interface ActionItem {
  id: string;
  ontologyId: string;
  actionName: string;
  actionLabel: string;
  objectType: { objectTypeLabel: string };
  status: number;
  lastUpdate: string;
  createTime: string;
  actionDesc: string;
  buildType: string;
  content: string;
}
const TaskRecordDetailAction: React.FC<TaskRecordDetailActionProps> = ({ taskId }) => {
  const columns = [
    {
      dataIndex: 'label',
      title: '中文名称',
      render: (col: string, record: ActionItem) => {
        return (
          <div role="button" tabIndex={0}>
            <IconTopologyColor /> {col}
          </div>
        );
      },
    },
    {
      dataIndex: 'name',
      title: '英文名称',
    },
    // {
    //   dataIndex: 'buildType',
    //   title: '构建方式',
    //   width: 120,
    //   render: (col: string) => {
    //     const buildTypeMap = {
    //       function: '函数',
    //       api: 'API',
    //       default: '对象',
    //     };
    //     return buildTypeMap[col as keyof typeof buildTypeMap] || buildTypeMap.default;
    //   },
    // },
    {
      dataIndex: 'objectLabel',
      title: '执行对象',
      width: 200,
      render: (col: string, record: ActionItem) => {
        // const objectTypeLabel = record.objectType?.objectTypeLabel;
        return (
          <div className="action-name">
            <IconDataResDirColor /> {col || '-'}
          </div>
        );
      },
    },
  ];

  const [tableData, setTableData] = useState([]);

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

  const [loading, setLoading] = useState(false);
  const getTableData = async (
    pageNumber = pagination.current,
    pageSize = pagination.pageSize,
    params = {},
  ) => {
    setLoading(true);
    try {
      const res = await processDetail({
        taskId,
        resourceType: 'action',
        page: pageNumber,
        limit: pageSize,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setTableData(
          data.content.map((item: ActionItem) => ({
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

  useEffect(() => {
    getTableData();
  }, []);

  return (
    <div className="task-record-detail-action">
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
      />
    </div>
  );
};

export default TaskRecordDetailAction;
