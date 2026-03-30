import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import Table from '@/components/Table';
import ObjectIcon from '@/components/ObjectIcon';
import { processDetail } from '../api';

interface TaskRecordDetailInterfaceProps {
  taskId: string;
}

interface InterfaceItem {
  icon: string;
  content: string;
}
const TaskRecordDetailInterface: React.FC<TaskRecordDetailInterfaceProps> = ({ taskId }) => {
  const columns = [
    {
      dataIndex: 'label',
      title: '中文名称',
      width: 200,
      render: (col: string, row: InterfaceItem) => {
        return (
          <div>
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
  ];

  const [tableData, setTableData] = useState<Array<InterfaceItem>>([]);

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
        resourceType: 'interface',
        page: pageNumber,
        limit: pageSize,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setTableData(
          data.content.map((item: InterfaceItem) => ({
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
    <div className="task-record-detail-interface">
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

export default TaskRecordDetailInterface;
