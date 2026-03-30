import Table from '@/components/Table';
import { Spin } from '@arco-design/web-react';
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { getVersionList } from './api';
import './style/index.less';

interface ObjVersionProps {
  ontology: {
    id: string;
  };
}

interface ObjVersionRef {
  getData: () => void;
}

const ObjVersion = forwardRef<ObjVersionRef, ObjVersionProps>((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([
    {
      id: '1',
      version: 'v.1.0',
      publishTime: '2024-10-09 00:06:00',
      user: 'admin',
    },
    {
      id: '2',
      version: 'v.1.1',
      publishTime: '2024-10-09 00:06:00',
      user: 'admin',
    },
  ]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const columns = [
    {
      dataIndex: 'versionName',
      title: '版本号',
    },
    {
      dataIndex: 'createTime',
      title: '发布时间',
    },
    {
      dataIndex: 'owner',
      title: '发布人',
    },
  ];

  const getData = (page?: number, pageSize?: number) => {
    setLoading(true);
    const currentPage = page || pagination.current;
    const currentPageSize = pageSize || pagination.pageSize;
    getVersionList({
      ontologyId: props.ontology.id,
      page: currentPage,
      limit: currentPageSize,
    })
      .then(res => {
        if (res?.data?.data?.content) {
          setTableData(res.data.data.content);
          setPagination(prev => ({
            ...prev,
            current: currentPage,
            pageSize: currentPageSize,
            total: res.data.data.totalElements || res.data.data.content.length,
          }));
        }
      })
      .finally(() => setLoading(false));
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getData: () => {
      getData();
    },
  }));

  useEffect(() => {
    getData();
  }, []);

  return (
    <Spin loading={loading}>
      <div className="obj-version">
        <div className="obj-version-title">
          <div className="marker" />
          <div className="text">历史版本</div>
        </div>
        <div className="obj-version-content">
          <Table
            {...({ scroll: { y: true } } as any)}
            rowKey="id"
            columns={columns}
            data={tableData}
            pagination={{
              size: 'mini',
              ...pagination,
            }}
            className="table"
            onChange={(paginationInfo: any) => {
              getData(paginationInfo.current, paginationInfo.pageSize);
            }}
          />
        </div>
      </div>
    </Spin>
  );
});

export default ObjVersion;
