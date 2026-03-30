import React, { useEffect, useState } from 'react';
import { Tabs, Typography, Space, Tag, Button, Switch } from '@arco-design/web-react';
import Table from '@/components/Table';
import './index.less';
import {
  IconBackupsShareColor,
  IconDataGovernanceColor,
  IconNetworkRouterColor,
  IconDataResDirColor,
} from 'modo-design/icon';
import { centerTypeExplorePage } from '../../api';
import ObjectTypeDrawer from '../object-type-drawer';
import ObjectTypeTree from '../object-type-tree';

const { TabPane } = Tabs;

const SharedObjectType = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });

  const [tableLoading, setTableLoading] = useState(false);

  const [tableData, setTableData] = useState([]);

  const [selectedNodeInfo, setSelectedNodeInfo] = useState({});

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

  const columns = [
    {
      title: '逻辑中文名',
      dataIndex: 'objectTypeLabel',
      render: (col, row) => {
        return (
          <Button
            onClick={e => {
              e.stopPropagation();
              setSelectedObject(row);
              setDrawerVisible(true);
            }}
            type="text"
            icon={<IconDataResDirColor />}
          >
            {col}
          </Button>
        );
      },
    },
    {
      title: '逻辑英文名',
      dataIndex: 'objectTypeName',
    },
    {
      title: '逻辑描述',
      dataIndex: 'objectTypeDesc',
    },
    // {
    //   title: '状态',
    //   dataIndex: 'status',

    //   render: (col, row, index) => {
    //     return <Switch size="small" checked={Boolean(col)} />;
    //   },
    // },
  ];

  const onChangeTable = pagination => {
    setPagination({
      ...pagination,
    });
    const { current, pageSize } = pagination;
    const param = {
      current: current,
      limit: pageSize,
    };
  };

  const tabMap = {
    object: {
      icon: <IconDataResDirColor />,
      label: '对象',
    },
    attribute: {
      icon: <IconBackupsShareColor />,
      label: '属性',
    },
    relation: {
      icon: <IconDataGovernanceColor />,
      label: '关系标签',
    },
    graph: {
      icon: <IconNetworkRouterColor />,
      label: '本体',
    },
  };

  const renderTitle = (key: string) => {
    return (
      <div className="tab-title">
        <div className="title-content">{tabMap[key]?.label}(15)</div>
      </div>
    );
  };

  const getTableData = async () => {
    setTableLoading(true);
    try {
      const res = await centerTypeExplorePage({
        centerId: selectedNodeInfo.id,
        limit: pagination.pageSize,
        page: pagination.current,
      });

      const { success, data } = res.data;

      if (success) {
        setTableData(data.content);
        setPagination({ ...pagination, total: data.totalElements });
      }
    } catch (error) {
      console.error(error);
    }
    setTableLoading(false);
  };

  useEffect(() => {
    getTableData();
  }, [selectedNodeInfo]);

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedObject(null);
  };

  return (
    <div className="object-type-container">
      <div className="left-content">
        <ObjectTypeTree onClickTreeNode={setSelectedNodeInfo} />
      </div>
      <div className="right-content">
        <Tabs defaultActiveTab="1" className="shared-center-tab">
          <TabPane key="1" title={renderTitle('object')}>
            <div className="content-header">
              <div className="dot"></div>
              <Space>
                {selectedNodeInfo.title || '分组名称'}
                <Tag size="mini">{pagination.total}</Tag>
              </Space>
            </div>
            <Table
              className="object-type-table"
              rowKey="id"
              columns={columns}
              scroll={{
                y: true,
              }}
              loading={tableLoading}
              data={tableData}
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys,
                onChange: (selectedRowKeys, selectedRows) => {
                  console.log('onChange:', selectedRowKeys, selectedRows);
                  setSelectedRowKeys(selectedRowKeys);
                },
                onSelect: (selected, record, selectedRows) => {
                  console.log('onSelect:', selected, record, selectedRows);
                },
                checkboxProps: record => {
                  return {
                    disabled: record.id === '4',
                  };
                },
              }}
              onChange={onChangeTable}
              pagination={{
                size: 'mini',
                ...pagination,
              }}
            />
          </TabPane>
          <TabPane key="2" title={renderTitle('attribute')} disabled>
            <Typography.Paragraph>Content of Tab Panel 2</Typography.Paragraph>
          </TabPane>
          <TabPane key="3" title={renderTitle('relation')} disabled>
            <Typography.Paragraph>Content of Tab Panel 3</Typography.Paragraph>
          </TabPane>
          <TabPane key="4" title={renderTitle('graph')} disabled>
            <Typography.Paragraph>Content of Tab Panel 3</Typography.Paragraph>
          </TabPane>
        </Tabs>
      </div>
      {drawerVisible && selectedObject && (
        <ObjectTypeDrawer
          visible={drawerVisible}
          object={selectedObject}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
};
export default SharedObjectType;
