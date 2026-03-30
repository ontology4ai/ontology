import React, { useEffect, useRef, useState } from 'react';
import './index.less';
import Table from '@/components/Table';
import { Button, Input, Message, Modal, Select, Spin, Tag, Badge } from '@arco-design/web-react';
import { IconSearchColor } from 'modo-design/icon';
import TaskRecordDetail from './detail';
import { processSearch, processDelete } from './api';

interface TaskRecordProps {
  ontologyId: string;
}
interface TaskRecordItem {
  taskId: string;
  state: number;
  message?: string;
  resourceInfo: {
    object: number;
    link: number;
    logic: number;
    action: number;
    interface: number;
  };
}
const TaskRecord: React.FC<TaskRecordProps> = ({ ontologyId }) => {
  const [searchKey, setSearchKey] = useState('');
  const [taskType, setTaskType] = useState('');
  const [state, setState] = useState('');
  const taskTypeOptions = [
    { label: '全部任务类型', value: '' },
    { label: 'RDF导入', value: 'owl_import' },
    { label: '代码导入', value: 'code_import' },
    { label: '文档导入', value: 'doc_import' },
    { label: '工程导入', value: 'ontology_import' },
    { label: 'Excel导入', value: 'csv_import' },
    { label: '工程导出', value: 'ontology_export' },
    { label: 'RDF导出', value: 'rdf_export' },
  ];

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      width: 150,
      ellipsis: true,
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      width: 105,
      render: (col: string, record: TaskRecordItem) => {
        const map = taskTypeOptions.reduce((acc, cur) => {
          acc[cur.value] = cur.label;
          return acc;
        }, {} as Record<string, string>);
        return (
          <Tag color={col.endsWith('export') ? 'orange' : 'green'} bordered>
            {map[col]}
          </Tag>
        );
      },
    },
    {
      title: '导入/导出数据集',
      dataIndex: 'fileName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '任务状态',
      dataIndex: 'state',
      width: 95,
      render: (col: number, record: TaskRecordItem) => {
        return (
          <Badge status={col === 1 ? 'success' : 'error'} text={col === 1 ? '成功' : '失败'} />
        );
      },
    },
    {
      title: '统计资源',
      dataIndex: 'resourceInfo',
      width: 350,
      render: (col: number, record: TaskRecordItem) => {
        const { resourceInfo } = record;
        return record.state === 1 ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <Tag color="arcoblue" bordered>
              对象：{resourceInfo.object}
            </Tag>
            <Tag bordered>关系：{resourceInfo.link}</Tag>
            <Tag color="green" bordered>
              逻辑：{resourceInfo.logic}
            </Tag>
            <Tag color="purple" bordered>
              动作：{resourceInfo.action}
            </Tag>
            <Tag color="magenta" bordered>
              接口：{resourceInfo.interface}
            </Tag>
          </div>
        ) : (
          '--'
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 155,
      ellipsis: true,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 155,
      ellipsis: true,
    },
    {
      dataIndex: 'oper',
      title: '操作',
      fixed: 'right',
      width: 162,
      render: (col: string, row: TaskRecordItem) => {
        return (
          <div className='task-record-oper'>
            <Button
              size="mini"
              type="text"
              onClick={() => {
                handleDetail(row);
              }}
            >
              详情
            </Button>
            <Button
              size="mini"
              type="text"
              onClick={() => {
                handleLog(row);
              }}
            >
              日志
            </Button>
            <Button size="mini" type="text" onClick={() => handleDelete([row.taskId])}>
              删除
            </Button>
          </div>
        );
      },
    },
  ];

  const [visible, setVisible] = useState(false);
  const [currentTaskItem, setCurrentTaskItem] = useState<TaskRecordItem | null>(null);

  const [logVisible, setLogVisible] = useState(false);
  const [currentLogMessage, setCurrentLogMessage] = useState<string>('');

  const handleDetail = (item: TaskRecordItem) => {
    setCurrentTaskItem(item);
    setVisible(true);
  };

  const handleLog = (item: TaskRecordItem) => {
    setCurrentLogMessage(item?.message || '');
    setLogVisible(true);
  };

  const handleDelete = (ids: Array<string>) => {
    Modal.confirm({
      title: '确认删除任务记录？',
      content: '',
      onOk: () => {
        processDelete(ids).then(res => {
          const { success } = res.data;
          if (success) {
            Message.success({
              content: '删除成功！',
            });

            setPagination({ ...pagination, current: 1 });
            getTableData(1);
          } else {
            Message.error({
              content: '删除失败！',
            });
          }
        });
      },
    });
  };

  const handleBatchDelete = () => {
    if (!selectedRowKeys.length) {
      Message.warning('请选择要删除的记录');
      return;
    }

    handleDelete(selectedRowKeys);
  };

  const [loading, setLoading] = useState(false);

  const [tableData, setTableData] = useState<Array<TaskRecordItem>>([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const [pagination, setPagination] = useState({
    total: 2,
    current: 1,
    pageSize: 20,
  });

  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({ ...pagination, current, pageSize });
    getTableData(current, pageSize);
  };

  const getTableData = async (
    pageNumber = pagination.current,
    pageSize = pagination.pageSize,
    params = {},
  ) => {
    setLoading(true);
    try {
      const res = await processSearch({
        ontologyId,
        page: pageNumber,
        limit: pageSize,
        query: searchKey,
        taskType,
        state,
        ...params,
      });

      const { data, success } = res.data;

      if (success) {
        setTableData(data.content);
        setPagination({ ...pagination, current: pageNumber, pageSize, total: data.totalElements });
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(true);
    }
  };

  const handleSearch = (params = {}) => {
    setPagination({ ...pagination, current: 1 });
    getTableData(1, pagination.pageSize, params);
  };

  useEffect(() => {
    getTableData();
  }, []);

  return (
    <Spin className="task-record" loading={loading}>
      <div className="task-record-header">
        <div className="task-record-title">
          <div className="task-record-title-marker"></div>
          <div className="task-record-title-text">任务记录</div>
          <div className="task-record-title-total">{6}</div>
        </div>
        <div className="task-record-header-right">
          <Select
            placeholder="任务类型"
            style={{ width: 200 }}
            allowClear
            options={taskTypeOptions}
            onChange={value => {
              setTaskType(value || '');
              handleSearch({ taskType: value || '' });
            }}
          />
          <Select
            placeholder="任务状态"
            style={{ width: 200 }}
            allowClear
            options={[
              { label: '全部任务状态', value: '' },
              { label: '成功', value: 1 },
              { label: '失败', value: -1 },
            ]}
            onChange={value => {
              setState(value || '');
              handleSearch({ state: value || '' });
            }}
          />
          <Input
            value={searchKey}
            style={{ width: 200 }}
            allowClear
            suffix={
              <IconSearchColor
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  handleSearch();
                }}
              />
            }
            placeholder="请输入"
            onChange={val => {
              setSearchKey(val);
              handleSearch({ query: val });
            }}
            onPressEnter={() => {
              handleSearch();
            }}
          />
          <Button onClick={handleBatchDelete}>批量删除</Button>
        </div>
      </div>
      <div className="task-record-main">
        <Table
          {...({ scroll: { y: true } } as any)}
          rowKey="taskId"
          columns={columns}
          data={tableData}
          pagination={{
            size: 'mini',
            ...pagination,
            onChange: handlePageChange,
          }}
          rowSelection={{
            selectedRowKeys,
            checkCrossPage: true,
            preserveSelectedRowKeys: true,
            onChange: (keys: string[]) => {
              setSelectedRowKeys(keys);
            },
          }}
        />
      </div>

      <Modal
        style={{ width: '75%' }}
        title="本体资源详情"
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        onOk={() => {
          setVisible(false);
        }}
      >
        {visible ? (
          <TaskRecordDetail
            taskId={currentTaskItem?.taskId || ''}
            resourceInfo={currentTaskItem?.resourceInfo || {}}
          />
        ) : null}
      </Modal>

      <Modal
        style={{ width: '60%' }}
        title={<div style={{ textAlign: 'left', fontWeight: 700 }}>日志详情</div>}
        visible={logVisible}
        onCancel={() => {
          setLogVisible(false);
        }}
        onOk={() => {
          setLogVisible(false);
        }}
      >
        <div
          style={{
            maxHeight: 480,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {currentLogMessage ? currentLogMessage : '--'}
        </div>
      </Modal>
    </Spin>
  );
};

export default TaskRecord;
