import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import Table from '@/components/Table';
import { Space, Tag, Typography, Tooltip } from '@arco-design/web-react';
import right from '@/pages/diagram/icons/right.svg';
import left from '@/pages/diagram/icons/left.svg';
import { IconDataMapColor, IconUserColor } from 'modo-design/icon';
import oneToOneIcon from './images/oToO.svg';
import oneToManyIcon from './images/oToM.svg';
import manyToManyIcon from './images/mToM.svg';
import { processDetail } from '../api';

interface TaskRecordDetailRelationProps {
  taskId: string;
}
interface RelationItem {
  id: string;
  linkType: number;
  linkMethod: number;
  sourceLabel: string;
  targetLabel: string;
  content: string;
}
const TaskRecordDetailRelation: React.FC<TaskRecordDetailRelationProps> = ({ taskId }) => {
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

  const [tagMap, setTagMap] = useState<{ [key: string]: { label: string } }>({});

  const renderLabel = (row: RelationItem) => {
    const labelIcon = <IconDataMapColor />;

    let imgSrc = manyToManyIcon;

    if (row.linkType === 1 && row.linkMethod === 1) {
      imgSrc = oneToOneIcon;
    }
    if (row.linkType === 1 && row.linkMethod === 2) {
      imgSrc = oneToManyIcon;
    }

    return (
      <Space className="link-type-content">
        <div className="link-type-item">
          <IconUserColor />
          {row.sourceLabel}
        </div>
        <img src={imgSrc} alt="" />
        <div className="link-type-item">
          {labelIcon}
          {row.targetLabel}
        </div>
      </Space>
    );
  };

  const columns = [
    {
      dataIndex: 'label',
      title: '关系',
      render: (col: any, row: RelationItem) => {
        return <div className="obj-name">{renderLabel(row)}</div>;
      },
    },
    {
      dataIndex: 'sourceTagLabel',
      title: (
        <Space size="mini" className="table-tag-item">
          关系标签
          <img src={right} alt="" />
        </Space>
      ),
      render: (col: any, row: RelationItem, index: any) => {
        return (
          <Tag>
            <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>
          </Tag>
        );
        // const tags = col;
        // return Array.isArray(tags) && tags.length > 0 ? (
        //   <Space wrap key={row.id} style={{ marginTop: '4px' }}>
        //     {tags.slice(0, 5).map((item, tagIndex) => (
        //       <Tag key={`${index}${tagIndex}`} style={{ maxWidth: '106px' }}>
        //         <Typography.Text ellipsis={{ showTooltip: true }}>
        //           {tagMap[item]?.label}
        //         </Typography.Text>
        //       </Tag>
        //     ))}
        //     {tags.length > 5 ? (
        //       <Tag key={index}>
        //         {' '}
        //         <Tooltip
        //           content={tags
        //             .slice(5)
        //             .map(item => {
        //               return tagMap[item]?.label;
        //             })
        //             .join('，')}
        //         >
        //           ···
        //         </Tooltip>
        //       </Tag>
        //     ) : (
        //       ''
        //     )}
        //   </Space>
        // ) : (
        //   ''
        // );
      },
    },
    {
      dataIndex: 'targetTagLabel',
      title: (
        <Space size="mini" className="table-tag-item">
          关系标签
          <img src={left} alt="" />
        </Space>
      ),
      render: (col: any, row: RelationItem, index: any) => {
        return (
          <Tag>
            <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>
          </Tag>
        );
        // const tags = col;
        // return Array.isArray(tags) && tags.length > 0 ? (
        //   <Space wrap key={row.id} style={{ marginTop: '4px' }}>
        //     {tags.slice(0, 5).map((item, tagIndex) => (
        //       <Tag key={`${index}${tagIndex}`} style={{ maxWidth: '106px' }}>
        //         <Typography.Text ellipsis={{ showTooltip: true }}>
        //           {tagMap[item]?.label}
        //         </Typography.Text>
        //       </Tag>
        //     ))}
        //     {tags.length > 5 ? (
        //       <Tag key={index}>
        //         {' '}
        //         <Tooltip
        //           content={tags
        //             .slice(5)
        //             .map(item => {
        //               return tagMap[item]?.label;
        //             })
        //             .join('，')}
        //         >
        //           ···
        //         </Tooltip>
        //       </Tag>
        //     ) : (
        //       ''
        //     )}
        //   </Space>
        // ) : (
        //   ''
        // );
      },
    },
  ];

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
        resourceType: 'link',
        page: pageNumber,
        limit: pageSize,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setTableData(
          data.content.map((item: RelationItem) => ({
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
    <div className="task-record-detail-relation">
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

export default TaskRecordDetailRelation;
