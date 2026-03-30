import { Input, Spin, Table } from '@arco-design/web-react';
import { IconSearchColor } from 'modo-design/icon';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { getData } from '../../obj-manager/api/index';
import './style/index.less';

interface ObjectTypeSelectTableProps {
  ontologyId: string;
  onTotalChange?: (total: number) => void;
}

export interface ObjectTypeSelectTableRef {
  getChildData: () => {
    selectedRowKeys: (string | number)[];
  };
  getAllData: () => any[];
}

const ObjectTypeSelectTable = forwardRef<ObjectTypeSelectTableRef, ObjectTypeSelectTableProps>(
  ({ ontologyId, onTotalChange }, ref) => {
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
    const [allData, setAllData] = useState<any[]>([]);

    const columns = [
      {
        title: '对象类型',
        dataIndex: 'objectTypeLabel',
      },
    ];

    const filteredData = useMemo(() => {
      if (!keyword) return allData;
      return allData.filter(item =>
        item.objectTypeLabel?.toLowerCase().includes(keyword.toLowerCase()),
      );
    }, [allData, keyword]);

    const handleGetData = () => {
      setLoading(true);
      getData({
        ontologyId,
        page: 1,
        limit: 9999,
        keyword: '',
        status: 1,
      })
        .then(res => {
          if (Array.isArray(res?.data?.data?.content)) {
            const fetchedData = res?.data?.data?.content || [];
            const total = res?.data?.data?.totalElements || 0;

            setAllData(fetchedData);

            const allIds = fetchedData.map((item: any) => item.id);
            setSelectedRowKeys(allIds);

            if (onTotalChange) {
              onTotalChange(total);
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    };

    const handleSelect = (selected: boolean, record: any) => {
      setSelectedRowKeys(prev => {
        if (selected) {
          if (!prev.includes(record.id)) {
            return [...prev, record.id];
          }
          return prev;
        }
        return prev.filter(key => key !== record.id);
      });
    };

    const handleSelectAll = (selected: boolean) => {
      setSelectedRowKeys(prev => {
        if (selected) {
          const newSelectedKeys = [...prev];
          filteredData.forEach(item => {
            if (!newSelectedKeys.includes(item.id)) {
              newSelectedKeys.push(item.id);
            }
          });
          return newSelectedKeys;
        }
        return prev.filter(key => !filteredData.some(item => item.id === key));
      });
    };

    const handleSearch = (value: string) => {
      setKeyword(value);
    };

    const getAllData = () => {
      return allData;
    };

    useEffect(() => {
      handleGetData();
    }, [ontologyId]);

    useImperativeHandle(ref, () => ({
      getChildData: () => ({ selectedRowKeys }),
      getAllData,
    }));

    return (
      <>
        <Input
          suffix={<IconSearchColor />}
          value={keyword}
          placeholder="搜索"
          className="share-object-search-input"
          onChange={handleSearch}
        />
        <Spin loading={loading}>
          <div className="object-type-select-table">
            <div className="total">
              共<span className="num">{filteredData.length}</span>个对象类型，已选择
              <span className="num">{selectedRowKeys.length}</span>个
            </div>
            <Table
              rowKey="id"
              columns={columns}
              data={filteredData}
              scroll={{
                y: 300,
              }}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedRowKeys.filter(key =>
                  filteredData.some(item => item.id === key),
                ),
                onSelect: handleSelect,
                onSelectAll: handleSelectAll,
              }}
              pagination={false} // 禁用分页
            />
          </div>
        </Spin>
      </>
    );
  },
);

export default ObjectTypeSelectTable;
