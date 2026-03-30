import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Message, Modal, Space, Tag, Typography, Form, Dropdown, Menu, Select, Upload, Tooltip } from '@arco-design/web-react';
import { IconDelete, IconPlus } from '@arco-design/web-react/icon';
import { IconArrowDown, IconCaretRight, IconSearchColor, IconAdd, IconDownloadColor, IconDocumentColor, IconDeleteColor, IconTick } from 'modo-design/icon';
import Table from '@/components/Table';
import type { TestCase, TestResultStatus } from '../../types';
import { addTestCase, batchImportTestCase, deleteTestCase, editTestCase, getTestCaseList, downloadTemple } from '../../api';
import '../../components/test-case-manager-modal/index.less';

import getAppName from "modo-plugin-common/src/core/src/utils/getAppName";

const { Text } = Typography;
const FormItem = Form.Item;

/** 执行状态：0=排队中，1=执行中；仅这两种状态需要定时刷新 */
const isRunningOrPending = (s: any) => s === 0 || s === 1 || s === '0' || s === '1';
const hasRunningOrPending = (list: any[]) =>
  list.some((item: any) => isRunningOrPending(item?.task?.status));

const POLL_INTERVAL = 3000;
const REFRESH_AFTER_RUN_DELAY = 2000;

export const RESULT_MAP: Record<string, { text: string; color: string }> = {
  通过: { text: '通过', color: 'green' },
  未通过: { text: '未通过', color: 'red' },
  未测试: { text: '未测试', color: 'gray' },
  部分通过: { text: '部分通过', color: 'orange' },
  测试中: { text: '测试中', color: 'blue' },
  '0': { text: '排队中', color: 'gray' },
  '1': { text: '执行中', color: 'blue' },
  '2': { text: '正常结束', color: 'green' },
  '3': { text: '异常退出', color: 'red' },
  '-1': { text: '未执行', color: 'gray' },
  '4': { text: '任务中止', color: 'orange' },
};

function safeFormatTimestamp(ts?: any) {
  if (!ts) return '';
  const num = typeof ts === 'number' ? ts : Number(ts);
  const d = Number.isFinite(num) ? new Date(num > 1e12 ? num : num * 1000) : new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

interface CaseManagerPageProps {
  ontology?: any;
  onRunCase: (testCases: TestCase[]) => void;
  mode: string;
  modeSettingData: any;
  promptListData: any[];
  oagPromptListData: any[];
  /** 外部触发刷新列表（如保存用例后），变化时重新拉取列表 */
  listRefreshKey?: number;
  /** 编辑/删除/批量删除/批量导入成功后调用，用于同步右侧 CQ 测试用例库 */
  onTestCaseListChange?: () => void;
}

const CaseManagerPage: React.FC<CaseManagerPageProps> = ({ ontology, onRunCase, mode, modeSettingData, promptListData, oagPromptListData, listRefreshKey, onTestCaseListChange }) => {
  const [data, setData] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 表单弹窗状态
  const [formModalVisible, setFormModalVisible] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [form] = Form.useForm();

  // 批量导入
  const [batchImportVisible, setBatchImportVisible] = useState<boolean>(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [importBtnLoading, setImportBtnLoading] = useState<boolean>(false);

  const handleDownCaseTpl = () => {
    const host=`${window.location.host}`;
      const protocol=`${window.location.protocol}`;
      const _url=`${protocol}//${host}/${getAppName()}`;
      const url = _url +'/_api/v1/case/downTemplate';
      var a = document.createElement('a');
      a.href=url;
      a.click();
    // downloadTemple().then(res => {
    //   if (res.data) {
    //     const filename =
    //       res.headers['content-disposition']?.match(/filename="?(.+?)"?$/)?.[1] || '测试用例模板.csv';
    //     const blob = new Blob([res.data]);
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = filename;
    //     a.click();
    //     window.URL.revokeObjectURL(url);
    //   }
    // });
  };

  const renderImportUploadList = (fileList: any[]) => (
    <div className="arco-upload-list arco-upload-list-type-text rdf-upload">
      {fileList.map((file: any, index: number) => (
        <div
          key={`${index}-${file.name}`}
          className="arco-upload-list-item arco-upload-list-item-done"
        >
          <div className="arco-upload-list-item-text">
            <div className="arco-upload-list-item-text-content">
              <div className="arco-upload-list-item-text-name">
                <span className="arco-upload-list-file-icon">
                  <IconDocumentColor />
                </span>
                <span className="arco-upload-list-item-text-name-text">
                  <a>{file.name}</a>
                </span>
              </div>
            </div>
          </div>
          <div className="arco-upload-list-item-operation">
            <span className="arco-icon-hover">
              <span className="arco-upload-list-remove-icon">
                <IconDeleteColor
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    const next = importFileList.filter((item: any) => item.name !== file.name);
                    setImportFileList(next);
                  }}
                />
              </span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const onImportFileChange = (_fileList: any[], file: any) => {
    setImportFileList([file]);
  };

  const handleBatchImport = async () => {
    if (!ontology?.id) {
      Message.error('请先选择本体');
      return;
    }
    if (importFileList.length === 0) {
      Message.error('请先上传文件');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFileList[0].originFile as File);
    formData.append('ontologyId', ontology.id);
   // formData.append('promptType', mode === '0' ? '0' : '1');
    setImportBtnLoading(true);
    try {
      const res: any = await batchImportTestCase(formData);
      setBatchImportVisible(false);
      setImportFileList([]);
      if (res?.data?.success) {
        Message.success(res?.data?.message || '导入成功');
        onTestCaseListChange?.();
      } else {
        Message.error(res?.data?.message || '导入失败');
      }
      fetchTestCases();
    } catch (e) {
      Message.error('导入失败');
    } finally {
      setImportBtnLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const fetchTestCases = (silent = false) => {
    if (!ontology?.id) return;
    stopPolling();
    if (!silent) setLoading(true);
    getTestCaseList({
      ontologyId: ontology.id,
      promptType: mode=='0'?0:1,
      page: 1,
      limit: 10000,
    })
      .then((res: any) => {
        if (res.data?.success) {
          const pageData = res.data?.data || {};
          const list = pageData.content || [];
          list.forEach((item: any) => {
            item.lastTime = item.task?.lastExecTime || '';
            item.lastResult = item.task?.summary || '未测试';
          });
          setData(list);
          if (hasRunningOrPending(list)) {
            pollTimerRef.current = setTimeout(() => fetchTestCases(true), POLL_INTERVAL);
          }
        }
      })
      .finally(() => { if (!silent) setLoading(false); });
  };

  useEffect(() => {
    fetchTestCases();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ontology?.id, listRefreshKey]);

  const handleRunCase = (testCases: TestCase[]) => {
    onRunCase(testCases);
    setTimeout(() => fetchTestCases(), REFRESH_AFTER_RUN_DELAY);
  };

  const filteredData = useMemo(() => {
    const searchLower = (searchText || '').toLowerCase();
    return data.filter((item: any) => {
      if (!searchLower) return true;
      return (
        (item.id || '').toLowerCase().includes(searchLower) ||
        (item.question || '').toLowerCase().includes(searchLower) ||
        (item.expectedResult || '').toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchText]);

  const handleDelete = (ids: string[]) => {
    Modal.confirm({
      title: ids.length > 1 ? `确认删除选中的 ${ids.length} 条测试用例?` : '确认删除该测试用例?',
      content: '',
      onOk: () => {
        deleteTestCase({ caseIdList: ids }).then((res: any) => {
          if (res.data?.success) {
            Message.success('删除成功');
            setSelectedRowKeys([]);
            setSelectedRows([]);
            fetchTestCases();
            onTestCaseListChange?.();
          } else {
            Message.error('删除失败');
          }
        });
      },
    });
  };

  const handleAdd = () => {
    setFormMode('add');
    setEditingRecord(null);
    form.setFieldsValue({
      id: '',
      question: '',
      expectedResult: '',
      defaultPrompt: modeSettingData.defaultPrompt,
      oagPrompt: modeSettingData.oagPrompt,
    });
    setFormModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setFormMode('edit');
    setEditingRecord(record);
    form.setFieldsValue({
      id: record.id,
      question: record.question,
      expectedResult: record.expectedResult,
      defaultPrompt: record.normalPrompt.id,
      oagPrompt: record.oagPrompt.id,
    });
    setFormModalVisible(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validate();
      if (!ontology?.id) return;

      if (formMode === 'add') {
        addTestCase({
          ontologyId: ontology.id,
          question: values.question,
          expectedResult: values.expectedResult,
          normalPromptName: promptListData.find((item: any) => item.id === values.defaultPrompt)?.promptName || '',
          oagPromptName: oagPromptListData.find((item: any) => item.id === values.oagPrompt)?.promptName || '',
        })
          .then((res: any) => {
            if (res.data?.success) {
              Message.success('新增用例成功');
              fetchTestCases();
              onTestCaseListChange?.();
            } else {
              Message.error('新增用例失败');
            }
          })
          .finally(() => {});
      } else {
        editTestCase({
          id: values.id || editingRecord?.id,
          ontologyId: ontology.id,
          question: values.question,
          expectedResult: values.expectedResult,
          normalPromptName: promptListData.find((item: any) => item.id === values.defaultPrompt)?.promptName || '',
          oagPromptName: oagPromptListData.find((item: any) => item.id === values.oagPrompt)?.promptName || '',
        })
          .then((res: any) => {
            if (res.data?.success) {
              Message.success('更新用例成功');
              fetchTestCases();
              onTestCaseListChange?.();
            } else {
              Message.error('更新用例失败');
            }
          })
          .finally(() => {});
      }

      setFormModalVisible(false);
      form.resetFields();
      setEditingRecord(null);
    } catch (e) {
      // ignore
    }
  };

  const columns = [
    {
      title: '用例ID',
      dataIndex: 'id',
      width: 100,
      ellipsis: true,
      render: (col: any) => <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>,
    },
    {
      title: '问题',
      dataIndex: 'question',
      width: 220,
      ellipsis: true,
      render: (col: any) => <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>,
    },
    {
      title: '预期结果',
      dataIndex: 'expectedResult',
      width: 220,
      ellipsis: true,
      render: (col: any) => <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>,
    },
    {
      title: '提示词',
      dataIndex: 'prompt',
       width: 220,
        render: (col: any, row: any) => {
          return (
            <Space>
              {row?.normalPrompt && (
                <Tooltip content={row.normalPrompt.promptName} position="top">
                  <Tag bordered className="normal-prompt prompt-tag" size="small"> 
                   {row.normalPrompt.promptName}
                  </Tag>
                </Tooltip>
              )}
              {row?.oagPrompt && (
                <Tooltip content={row.oagPrompt.promptName} position="top">
                  <Tag bordered className="oag-prompt prompt-tag" color="arcoblue" size="small">
                      {row.oagPrompt.promptName}
                  </Tag>
                </Tooltip>
              )}
            </Space>
          );
        }
    },
    {
      title: '执行状态',
      dataIndex: 'status',
      width: 110,
      filters: [
        {
          text: '未执行',
          value: '-1',
        },
        {
          text: '排队中',
          value: '0',
        },
        {
          text: '执行中',
          value: '1',
        },
        {
          text: '正常结束',
          value: '2',
        },
        {
          text: '异常退出',
          value: '3',
        },
        {
          text: '任务中止',
          value: '4',
        },
      ],
      defaultFilters: [],
      onFilter: (value: any, row: any) => row.task?.status == value,  
      render: (_: any, record: any) => {
        const config = RESULT_MAP[record?.task?.status || '-1'];
        return (
          <div className="test-status">
            <div className="dot" style={{ backgroundColor: config.color }} />
            {config.text}
          </div>
        );
      },
    },
    {
      title: '最新测试结果',
      dataIndex: 'lastResult',
      width: 120,
      filters: [
        {
          text: '通过',
          value: '通过',
        },
        {
          text: '未通过',
          value: '未通过',
        },
        {
          text: '部分通过',
          value: '部分通过',
        },
        {
          text: '未测试',
          value: '未测试',
        },
        {
          text: '测试中',
          value: '测试中',
        },
      ],
      defaultFilters: [],
      onFilter: (value: any, row: any) => row.lastResult == value,
      render: (status: TestResultStatus) => {
        const config = RESULT_MAP[status || '未测试'];
        return <Tag bordered color={config.color}  size="small">{config.text}</Tag>;
      }
    },
    {
      title: '最新测试时间',
      dataIndex: 'lastTime',
      width: 160,
      sortable: true,
      sorter: (a: any, b: any) => {
        const t1 = (a?.task?.lastExecTime ?? a?.lastTime) || 0;
        const t2 = (b?.task?.lastExecTime ?? b?.lastTime) || 0;
        return new Date(t1).getTime() - new Date(t2).getTime();
      },
      render: (text: string) => <Text style={{ fontSize: 12 }}>{text || '-'}</Text>,
    },
    {
      title: '创建人',
      dataIndex: 'ownerId',
      width: 120,
      ellipsis: true,
      render: (col: any) => <Typography.Text ellipsis={{ showTooltip: true }}>{col}</Typography.Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
      sortable: true,
      sorter: (a: any, b: any) =>
        new Date(a?.createTime || 0).getTime() - new Date(b?.createTime || 0).getTime(),
      render: (text: string) => <Text style={{ fontSize: 12 }}>{ text|| '-'}</Text>,
    },
    {
      title: '操作',
      width: 160,
      dataIndex: 'action',
      fixed: "right",
      render: (_: any, record: any) => (
        <Space size="mini">
          <Button type="text" size="mini" onClick={() => handleRunCase([record])}>
            测试
          </Button>
          <Button type="text" size="mini" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="text" status="danger" size="mini" onClick={() => handleDelete([record.id])}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="test-case-mgr-modal" style={{ padding: 16,width: '100%' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <span style={{ fontSize: '14px',fontWeight:700 }}>用例管理</span>
          {/* <Tag bordered size="small">{data.length}</Tag> */}
        </Space>
        <Space size="medium">
          <Input
            suffix={<IconSearchColor />}
            placeholder="请输入"
            style={{ width: 260 }}
            value={searchText}
            onChange={setSearchText}
            allowClear
          />
          <Dropdown
            trigger="click"
            droplist={
              <Menu
                onClickMenuItem={(key:string, e:any) => {
                  e.stopPropagation();
                 
                  if (key === 'batch-delete') {
                    if (selectedRowKeys.length === 0) {
                      Message.warning('请先选择用例');
                      return;
                    }
                    handleDelete(selectedRowKeys);
                  }
                  if (key === 'batch-test') {
                    if (selectedRowKeys.length === 0) {
                      Message.warning('请先选择用例');
                      return;
                    }
                    handleRunCase(selectedRows as TestCase[]);
                  }
                  if (key === 'batch-import') {
                    setBatchImportVisible(true);
                    setImportFileList([]);
                  }
                }}
              >
                <Menu.Item key="batch-delete">批量删除</Menu.Item>
                <Menu.Item key="batch-test">批量测试</Menu.Item>
                <Menu.Item key="batch-import">批量导入</Menu.Item>
              </Menu>
            }
          >
              <Button
                type='secondary'>
                批量操作
                <IconArrowDown />
              </Button>
          </Dropdown>
          <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>
            新增用例
          </Button>
        </Space>
      </div>

      <Table
        style={{ height: 'calc(100% - 46px)' }}
        rowKey="id"
        columns={columns}
        data={filteredData}
        loading={loading}
        scroll={{ x: 1000,y:true }}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          checkCrossPage: true,
          onChange: (keys: any, rows: any[]) => {
            setSelectedRowKeys(keys as string[]);
            setSelectedRows(rows);
          },
        }}
        pagination={{ pageSize: 20 }}
        border={{ wrapper: true, cell: true }}
      />

      <Modal
        title={
          <div style={{ textAlign: 'left', fontWeight: 700 }}>
            <span style={{ fontSize: '16px' }}>{formMode === 'add' ? '新增用例' : '编辑用例'}</span>
          </div>
        }
        visible={formModalVisible}
        onOk={handleFormSubmit}
        onCancel={() => {
          setFormModalVisible(false);
          form.resetFields();
          setEditingRecord(null);
        }}
        style={{ width: 560 }}
        unmountOnExit
      >
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }}   layout="vertical">
          <FormItem label="问题" field="question" rules={[{ required: true, message: '请输入问题' }]}>
            <Input.TextArea placeholder="请输入问题" style={{ height: '100px' }} maxLength={500} showWordLimit />
          </FormItem>
          <FormItem label="预期结果" field="expectedResult" rules={[{ required: true, message: '请输入预期结果' }]}>
            <Input.TextArea placeholder="请输入预期结果" style={{ height: '200px' }} />
          </FormItem>
          <FormItem
            label="通用模板提示词"
            field="defaultPrompt"
            rules={[{ required: true, message: '请选择通用模板提示词' }]}
          >
            <Select
              placeholder="请选择通用模板提示词"
              allowClear={false}
              showSearch
              filterOption={(inputValue: string, option: any) =>
                (option?.props?.extra?.label ?? '')
                  .toLowerCase()
                  .indexOf(inputValue.toLowerCase()) >= 0
              }
            >
              {promptListData?.map((item: any) => (
                <Select.Option key={item.id} value={item.id} extra={{ label: item.promptName }}>
                  <span>
                    {item.promptName}
                    {(item.defaultType === 1 || item.defaultType === '1') && (
                      <span style={{ marginLeft: 6 }}>
                        <Tag bordered color="arcoblue" size="small">提示词模板</Tag>
                      </span>
                    )}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            label="OAG模板提示词"
            field="oagPrompt"
            rules={[{ required: true, message: '请选择OAG模板提示词' }]}
          >
            <Select
              placeholder="请选择OAG模板提示词"
              allowClear={false}
              showSearch
              filterOption={(inputValue: string, option: any) =>
                (option?.props?.extra?.label ?? '')
                  .toLowerCase()
                  .indexOf(inputValue.toLowerCase()) >= 0
              }
            >
              {oagPromptListData?.map((item: any) => (
                <Select.Option key={item.id} value={item.id} extra={{ label: item.promptName }}>
                  <span>
                    {item.promptName}
                    {(item.defaultType === 1 || item.defaultType === '1') && (
                      <span style={{ marginLeft: 6 }}>
                        <Tag bordered color="arcoblue" size="small">提示词模板</Tag>
                      </span>
                    )}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      </Modal>

      <Modal
        title={<div style={{ textAlign: 'left', fontWeight: 600 }}>批量导入</div>}
        visible={batchImportVisible}
        footer={
          <Space>
            <Button onClick={() => { setBatchImportVisible(false); setImportFileList([]); }}>
              取消
            </Button>
            <Button type="primary" onClick={handleBatchImport} loading={importBtnLoading}>
              导入
            </Button>
          </Space>
        }
        onCancel={() => { setBatchImportVisible(false); setImportFileList([]); }}
        autoFocus={false}
        focusLock
        className="import-modal"
      >
        <Form key={batchImportVisible ? 1 : 0} autoComplete="off" layout="vertical">
          <Form.Item label="下载模版" field="down">
            <Button
              type="outline"
              onClick={handleDownCaseTpl}
              style={{ color: 'var(--color-primary-6)' }}
            >
              <IconDownloadColor />
              下载模板
            </Button>
          </Form.Item>
          <Form.Item label="上传文件" field="upload">
            <Upload
              autoUpload={false}
              accept=".xlsx,.xls"
              renderUploadList={renderImportUploadList}
              onChange={onImportFileChange}
              fileList={importFileList}
            >
              <div className="upload-trigger">
                <IconAdd className="icon" />
                <div className="text">
                  将文件拖到此处，或
                  <span style={{ color: 'var(--color-primary-6)', padding: '0 4px' }}>
                    点击上传
                  </span>
                </div>
                <div className="tips">支持xlsx、xls格式文件</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaseManagerPage;

