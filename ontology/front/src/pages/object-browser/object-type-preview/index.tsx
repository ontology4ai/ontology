import Table from '@/components/Table';
import { Message, Spin } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { getPreview } from '../api/index';
import { ObjectTypeItem } from '../type';
import './style/index.less';

interface ObjectTypePreviewProps {
  object: ObjectTypeItem;
}
const ObjectTypePreview: React.FC<ObjectTypePreviewProps> = ({ object }) => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const handlePageChange = (current: number, pageSize: number) => {
    const start = (current - 1) * pageSize;
    const end = start + pageSize;
    setTableData(allData.slice(start, end));
    setPagination(prev => ({
      ...prev,
      current,
      pageSize,
    }));
  };
  const handleGetPreview = async () => {
    setLoading(true);
    const res = await getPreview({
      objectTypeId: object.id,
    });
    if (res.data.code === '200' && res.data.data.success) {
      const cols = (res.data.data.titles || []).map((item: string) => ({
        dataIndex: item,
        title: item,
        width: 100,
        ellipsis: true,
      }));
      if (cols.length > 10) {
        for (const item of cols.slice(10)) {
          item.defaultHidden = true;
        }
      }
      setColumns(cols);
      const { datas } = res.data.data;
      setAllData(datas);
      setPagination(prev => ({
        ...prev,
        total: (datas || []).length,
        current: 1,
      }));
      const firstPageData = datas.slice(0, pagination.pageSize);
      setTableData(firstPageData);
    } else {
      Message.error(res.data.devMsg || res.data.message || res.data.data.msg || '查询失败');
    }
    setLoading(false);
  };
  useEffect(() => {
    handleGetPreview();
  }, []);
  return (
    <Spin loading={loading} className="object-type-preview-spin">
      <Table
        scroll={{ y: true }}
        tableLayout="fixed"
        rowKey="id"
        columns={columns}
        data={tableData}
        hiddenFooter={false}
        pagination={{
          size: 'mini',
          sizeCanChange: true,
          showJumper: true,
          showTotal: true,
          ...pagination,
          onChange: handlePageChange,
        }}
        className="object-type-preview-table"
      />
    </Spin>
  );
};

export default ObjectTypePreview;
