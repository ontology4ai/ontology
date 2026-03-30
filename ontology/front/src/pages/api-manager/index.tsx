import {
  Button,
  Tooltip,
  Input,
  Spin,
  Modal,
  Message,
  Space,
  Select,
} from '@arco-design/web-react';
import Table from '@/components/Table';
import {
  IconHomeColor,
  IconSearchColor,
  IconInformationColor,
  IconEditColor,
  IconDeleteColor,
} from 'modo-design/icon';
import React, { useState, useEffect, useRef } from 'react';
import { getData as getOntology, publishOntology } from '@/pages/ontology-manager/api/index';
import PublishModel from '@/pages/ontology-manager/publish-model/index';
import AddManager from '@/pages/api-manager/components/add-manager';
import './style/index.less';
import { searchApi, deleteApi } from '@/pages/api-manager/api/index';

const LogicDev = () => {
  const [apiNameSearch, setApiNameSearch] = useState('');
  const [apiTypeSearch, setApiTypeSearch] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const columns = [
    {
      dataIndex: 'apiName',
      title: 'API名称',
      render: (col: string, record: any) => (
        <Tooltip content={record.apiName} position="top">
          <div className="ontology-name">
            <span className="ontology-text">{record.apiName}</span>
          </div>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'apiDesc',
      title: 'API描述',
      render: (col: string, record: any) => (
        <Tooltip content={record.apiDesc}>
          <span className="overflow-text">{record?.apiDesc ?? '--'}</span>
        </Tooltip>
      ),
    },
    // {
    //   dataIndex: 'apiMethod',
    //   title: '请求方法',
    //   render: (col: string) => (
    //     <Tooltip content={col}>
    //       <span className="overflow-text">{col ?? '--'}</span>
    //     </Tooltip>
    //   ),
    // },
    {
      title: '接口超时时间(ms)',
      dataIndex: 'apiTimeout',
      key: 'apiTimeout',
      render: (text: string) => text || '--',
    },
    {
      title: '接口类型',
      dataIndex: 'apiType',
      key: 'apiType',
      render: (text: string) => {
        const typeMap = { object: '对象', logic: '逻辑', action: '动作' };
        return typeMap[text as keyof typeof typeMap] || '--';
      },
    },

    // {
    //   dataIndex: 'url',
    //   title: 'URL地址',
    //   render: (col: string) => (
    //     <Tooltip content={col}>
    //       <span className="overflow-text">{col ?? '--'}</span>
    //     </Tooltip>
    //   ),
    // },

    {
      dataIndex: 'createTime',
      title: '创建时间',
      render: (col: string) => (
        <Tooltip content={col}>
          <span className="overflow-text">{col ?? '--'}</span>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'lastUpdate',
      title: '更新时间',
      render: (col: string) => (
        <Tooltip content={col}>
          <span className="overflow-text">{col ?? '--'}</span>
        </Tooltip>
      ),
    },
    {
      dataIndex: 'createUser',
      title: '创建用户',
      render: (col: string) => (
        <Tooltip content={col}>
          <span className="overflow-text">{col ?? '--'}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      render: (text: any, record: any) => (
        <span>
          <Tooltip content="编辑">
            <IconEditColor
              style={{
                cursor: 'pointer',
                fontSize: 16,
                marginRight: 8,
                color: 'rgb(var(--primary-6))',
              }}
              onClick={() => {
                setEditData(record);
                setPublishModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip content="删除">
            <IconDeleteColor
              style={{ cursor: 'pointer', fontSize: 16, color: 'rgb(var(--primary-6))' }}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除该API吗？',
                  onOk: () => {
                    deleteApi({ id: record.id })
                      .then((res: any) => {
                        if (res?.data?.success) {
                          Message.success('删除成功');
                          getData();
                        }
                      })
                      .catch(error => {
                        Message.error('删除失败');
                      });
                  },
                });
              }}
            />
          </Tooltip>
        </span>
      ),
    },
  ];
  const getData = () => {
    setLoading(true);
    searchApi({
      apiName: apiNameSearch || '',
      apiType: apiTypeSearch || '',
    })
      .then((res: any) => {
        // 添加对返回数据的检查
        if (res?.data?.data) {
          setTableData(res.data.data || []);
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
    Promise.all([progressPromise, publishOntology([])])
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
          <span className="title">API管理</span>
          <span className="action">
            <Input
              placeholder="请输入API名称"
              style={{ width: 200 }}
              value={apiNameSearch}
              onChange={value => setApiNameSearch(value)}
              allowClear
            />
            <Select
              placeholder="请选择接口类型"
              style={{ width: 160 }}
              value={apiTypeSearch}
              onChange={value => setApiTypeSearch(value)}
              allowClear
            >
              <Select.Option value="object">对象</Select.Option>
              <Select.Option value="logic">逻辑</Select.Option>
              <Select.Option value="action">动作</Select.Option>
            </Select>
            <Button
              type="primary"
              onClick={() => {
                getData();
              }}
              style={{ marginLeft: 8 }}
            >
              搜索
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setEditData(null);
                setPublishModalVisible(true);
              }}
            >
              新增API
            </Button>
          </span>
        </div>
        <div className="ontology-publish-content-content">
          <Spin loading={loading} className="wrap">
            <Table
              {...({ scroll: { y: true } } as any)}
              columns={columns}
              rowKey={record => record.id}
              data={tableData}
              pagination={{
                size: 'mini',
                ...pagination,
              }}
              className="table"
            />
          </Spin>
        </div>
      </div>
      {publishModalVisible && (
        <AddManager
          visible={publishModalVisible}
          onClose={() => {
            setPublishModalVisible(false);
            setEditData(null);
            getData();
          }}
          ontologyList={[]}
          editData={editData}
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
