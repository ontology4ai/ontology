import { Button, Tooltip, Input, Spin, Modal, Message } from '@arco-design/web-react';
import Table from '@/components/Table';
import { IconHomeColor, IconSearchColor, IconInformationColor } from 'modo-design/icon';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getData as getOntology, publishOntology } from '@/pages/ontology-manager/api/index';
import PublishModel from '@/pages/ontology-manager/publish-model/index';
import './style/index.less';

const LogicDev = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [filterVal, setFilterVal] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const columns = [
    {
      dataIndex: 'ontologyLabel',
      title: '本体中文名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.ontologyLabel} position="top">
            <div role="button" tabIndex={0} className="ontology-name">
              {/* <IconTopologyColor /> */}
              <span className="ontology-text">{record.ontologyLabel}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'ontologyName',
      title: '本体英文名称',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.ontologyName}>
            <span className="overflow-text">{record.ontologyName}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'ontologyDesc',
      title: '描述',
      render: (col: string, record: any, index: number) => {
        return (
          <Tooltip content={record.ontologyDesc}>
            <span className="overflow-text">{record?.ontologyDesc ?? '--'}</span>
          </Tooltip>
        );
      },
    },
    {
      dataIndex: 'lastUpdate',
      title: '更新时间',
    },
    {
      dataIndex: 'versionName',
      title: '最新版本',
      render: (col: string, record: any, index: number) => {
        return <span className="overflow-text">{record?.versionName ?? '--'}</span>;
      },
    },
  ];
  const getData = (pageNumber?:number,pageSize?:number) => {
    setLoading(true);
    getOntology({
      keyword: filterVal,
      page: pageNumber || pagination.current,
      limit: pageSize || pagination.pageSize,
      status: 1,
    })
      .then((res: any) => {
        // 添加对返回数据的检查
        if (res?.data?.data?.content) {
          setTableData(res.data.data.content);
        } else {
          setTableData([]);
        }

        // 处理分页信息
        if (res?.data?.data) {
          setPagination({
            total: res.data.data.totalElements || 0,
            current: (res.data.data.pageable?.pageNumber || 0) + 1,
            pageSize: res.data.data.size || 20,
          });
        } else {
          // 设置默认分页值
          setPagination(prev => ({
            ...prev,
            total: 0,
            current: 1,
          }));
        }
      })
      .catch(error => {
        // 添加错误处理，确保不会因为API错误导致白屏
        setTableData([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          current: 1,
        }));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  const [showPublishProgress, setShowPublishProgress] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const handlePublish = () => {
    // 先显示弹窗，进度为0
    setShowPublishProgress(true);
    setPublishProgress(0);

    // 使用 Promise 确保进度条完成后再处理接口结果
    const progressPromise = new Promise(resolve => {
      let progress = 0;

      const animateProgress = () => {
        progress += 2; // 每次增加2%
        setPublishProgress(Math.min(progress, 100));

        if (progress < 100) {
          setTimeout(animateProgress, 20); // 20ms 间隔，总共约1秒到100%
        } else {
          resolve(); // 进度条完成
        }
      };

      animateProgress();
    });

    setPublishModalVisible(false);

    // 同时等待进度条完成和接口请求
    Promise.all([progressPromise, publishOntology(selectedRowKeys)])
      .then(([, res]) => {
        // 进度条已经100%，保持显示，稍后关闭
        setTimeout(() => {
          setShowPublishProgress(false);

          if (res?.data?.data) {
            Message.success('发布成功');
            getData();
          } else {
            Message.error(res?.data?.message || '发布失败');
          }
        }, 300);
      })
      .catch(error => {
        // 即使出错也要等进度条完成
        progressPromise.then(() => {
          setTimeout(() => {
            setShowPublishProgress(false);
            Message.error('发布失败');
          }, 300);
        });
      });
  };
  return (
    <div className="ontology-publish-wrap">
      <div className="ontology-publish-content" ref={containerRef}>
        <div className="ontology-publish-content-title">
          <span className="title">
            <IconHomeColor />
            本体发布
          </span>

          <span className="action">
            <Input
              value={filterVal}
              suffix={
                <IconSearchColor
                  onClick={() => {
                    getData(1);
                  }}
                />
              }
              placeholder="搜索本体"
              onChange={val => {
                setFilterVal(val);
              }}
              onPressEnter={() => {
                getData(1);
              }}
            />
            <Button
              type="primary"
              onClick={() => {
                if (selectedRows.length > 0) {
                  setPublishModalVisible(true);
                }
              }}
            >
              批量发布
            </Button>
          </span>
        </div>
        <div className="ontology-publish-content-content">
          <Spin loading={loading} className="wrap">
            <Table
              {...({ scroll: { y: true } } as any)}
              columns={columns}
              rowKey="id"
              data={tableData}
              pagination={{
                size: 'mini',
                ...pagination,
                onChange: (page: number, pageSize: number) => {
                  setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize,
                  }));
                  // 触发数据重新获取
                  getData(page, pageSize);
                },
              }}
              className="table"
              rowSelection={{
                selectedRowKeys,
                preserveSelectedRowKeys: true,
                onChange: (keys: string[], rows: any[]) => {
                  setSelectedRowKeys(keys);
                  setSelectedRows(rows);
                },
              }}
            />
          </Spin>
        </div>
      </div>
      {publishModalVisible && (
        <PublishModel
          visible={publishModalVisible}
          onClose={() => setPublishModalVisible(false)}
          ontologyList={selectedRows}
          handlePublish={handlePublish}
        />
      )}
      <Modal
        visible={showPublishProgress}
        footer={null}
        closable={false}
        maskClosable={false}
        alignCenter={false}
        className="progress-modal"
      >
        <div className="publish-progress">
          <div className="title">
            <IconInformationColor /> 正在发布
          </div>
          <div className="progress-wrapper">
            <div className="progress" style={{ width: `${publishProgress}%` }}></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LogicDev;
