import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import Table from '@/components/Table';
import { Tooltip, Space, Typography, Tag } from '@arco-design/web-react';
import fxActiveIcon from '@/pages/function-manager/images/fxactive.svg';
import { processDetail } from '../api';

interface TaskRecordDetailLogicProps {
  taskId: string;
}

interface LogicItem {
  id: string;
  logicTypeName: string;
  logicTypeLabel: string;
  buildType: string;
  status: number;
  lastUpdate: string;
  createTime: string;
  content: string;
}
const TaskRecordDetailLogic: React.FC<TaskRecordDetailLogicProps> = ({ taskId }) => {
  const columns = [
    {
      dataIndex: 'label',
      title: '中文名称',
      render: (col: string, record: LogicItem, index: number) => {
        return (
          <Tooltip content={col} position="top">
            <div role="button" tabIndex={0} style={{ display: 'flex' }}>
              <img src={fxActiveIcon} alt="" />
              <span className="logic-text">{col}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'name',
      title: '英文名称',
      render: (col: string, record: LogicItem, index: number) => {
        return (
          <Tooltip content={col}>
            <span className="overflow-text">{col}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'fileName',
      title: '文件名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={col}>
            <span className="overflow-text">{col}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'objectLabels',
      title: '对象',
      width: 180,
      render: (col: string, row: LogicItem, index: number) => {
        console.log(col, 'objectLabels');
        if (col && col.length) {
          const objs = col;
          return Array.isArray(objs) && objs.length > 0 ? (
            <Space wrap key={row.id} style={{ marginTop: '4px' }}>
              {objs.slice(0, 3).map((item: any, objIndex: number) => (
                <Tag key={`${index}${objIndex}`} style={{ maxWidth: '100px' }}>
                  <Typography.Text ellipsis={{ showTooltip: true }}>{item}</Typography.Text>
                </Tag>
              ))}
              {objs.length > 3 ? (
                <Tag key={index}>
                  {' '}
                  <Tooltip
                    content={objs
                      .slice(3)
                      .map((item: any) => {
                        return item;
                      })
                      .join('，')}
                  >
                    ···
                  </Tooltip>
                </Tag>
              ) : (
                ''
              )}
            </Space>
          ) : (
            ''
          );
        }
        return '全局';
      },
    },
    {
      dataIndex: 'buildType',
      title: '构建方式',
      width: 120,
      render: (col: string, row: LogicItem) => {
        const buildTypeMap = {
          function: '函数',
          api: 'API',
          link: 'Link',
        };
        return <>{buildTypeMap[row.buildType as keyof typeof buildTypeMap]}</>;
      },
    },
  ];

  const [tableData, setTableData] = useState<LogicItem[]>([]);

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
        resourceType: 'logic',
        page: pageNumber,
        limit: pageSize,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setTableData(
          data.content.map((item: LogicItem) => ({
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
    <div className="task-record-detail-logic">
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

export default TaskRecordDetailLogic;
