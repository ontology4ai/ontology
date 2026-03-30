import LogicTypeEditModal from '@/pages/function-manager/logic-type-edit-modal/index';
import { Button, Drawer, Message, Tooltip } from '@arco-design/web-react';
import Table from '@/components/Table';
import { IconHomeColor, IconBack, IconRefreshColor, IconTopologyColor } from 'modo-design/icon';
import React, { useState, useEffect, useRef } from 'react';
import { logicList, syncFunction } from '@/pages/function-manager/api/index';
import './style/index.less';
import { set } from 'lodash';

const buildTypeMap = {
  function: '函数',
  api: 'API',
  link: 'Link',
};

const LogicDev = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>();
  const [codeServerVisible, setCodeServerVisible] = useState(false);
  const [codeUrl, setCodeUrl] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const handleLogicDev = (row: any) => {
    setCodeServerVisible(true);
    setCodeUrl(`${window.location.origin}${row.codeUrl}`);
    //   window.location.href = `https://10.21.20.170/ontology_ontology_dev_dev/?folder=${filepath}`;
  };
  const columns = [
    {
      dataIndex: 'logicTypeLabel',
      title: '中文名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.logicTypeLabel} position="top">
            <div
              role="button"
              tabIndex={0}
              className="logic-name active"
              onClick={() => handleLogicDev(record)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLogicDev(record);
                }
              }}
            >
              <IconTopologyColor /> <span className="logic-text">{record.logicTypeLabel}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'logicTypeName',
      title: '英文名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.logicTypeName}>
            <span className="overflow-text">{record.logicTypeName}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'fileName',
      title: '文件名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.fileName}>
            <span className="overflow-text">{record.fileName}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'buildType',
      title: '构建方式',
      width: 120,
      render: (col: string, row: any) => {
        return <>{buildTypeMap[row.buildType as keyof typeof buildTypeMap]}</>;
      },
    },
    {
      dataIndex: 'ontologyLabel',
      title: '所属本体',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.ontologyLabel}>
            <span className="overflow-text">{record.ontologyLabel}</span>
          </Tooltip>
        );
      },
    },
  ];
  const refreshData = () => {
    setLoading(true);
    syncFunction({})
      .then(res => {
        if (res.data.success) {
          Message.success('同步成功');
          getData();
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const getData = () => {
    setLoading(true);
    logicList({
      page: pagination.current,
      limit: pagination.pageSize,
    })
      .then((res: any) => {
        setTableData(res.data.data.content);
        setPagination({
          total: res.data.data.totalElements,
          current: res.data.data.pageable.pageNumber + 1,
          pageSize: res.data.data.size,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getData();
  }, []);
  // const handleGetData = () => {
  //   const filepath = '';
  //   window.location.href = `https://10.21.20.170/ontology_ontology_dev_dev/?folder=${filepath}`;
  //   // https://10.21.20.170/ontology_ontology_dev_dev/?folder=/home/coder/code_gen/core/ontology/ontology_dev
  //   // setLoading(true);
  // };
  return (
    <div className="logic-dev-wrap">
      <div className="logic-dev-content" ref={containerRef}>
        <div className="logic-dev-content-title">
          <span>
            <IconHomeColor />
            逻辑开发
          </span>

          <span className="action">
            <Button
              onClick={() => {
                refreshData();
              }}
            >
              <IconRefreshColor />
              刷新
            </Button>
            <Button
              onClick={() => {
                setCreateModalVisible(true);
              }}
            >
              新建逻辑类型
            </Button>
          </span>
        </div>
        <div className="logic-dev-content-content">
          <div className="wrap">
            <Table
              {...({ scroll: { y: true } } as any)}
              columns={columns}
              rowKey="id"
              data={tableData}
              pagination={{
                size: 'mini',
                ...pagination,
              }}
              className="table"
            />
          </div>
        </div>
        {createModalVisible && (
          <LogicTypeEditModal
            visible={createModalVisible}
            selectOntology
            onClose={() => {
              setCreateModalVisible(false);
            }}
            afterCreated={() => {
              getData();
              setCreateModalVisible(false);
            }}
          />
        )}
      </div>
      <Drawer
        className="repository-code-server"
        width="100%"
        mask={false}
        title={null}
        footer={null}
        closable={false}
        visible={codeServerVisible}
        getPopupContainer={() => {
          return containerRef.current || document.body;
        }}
      >
        <Button
          type="secondary"
          className="back-btn"
          onClick={() => {
            setCodeServerVisible(false);
          }}
        >
          <IconBack />
          {/* <span className="text">退出</span> */}
        </Button>
        <iframe src={codeUrl} title="代码服务器页面" />
      </Drawer>
    </div>
  );
};

export default LogicDev;
