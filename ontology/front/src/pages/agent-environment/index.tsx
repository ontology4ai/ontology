import React, { useState, useEffect, useRef } from 'react';
import {
  Input,
  Modal,
  Message,
  Popconfirm,
  Switch,
  Spin,
  Form,
  Select,
  Tooltip,
  Button,
} from '@arco-design/web-react';
import Table from '@/components/Table';
import {
  IconAdd,
  IconEditColor,
  IconDeleteColor,
  IconRefresh,
  IconInformationColor,
} from 'modo-design/icon';
import {
  searchGroup,
  saveGroup,
  updateGroup,
  deleteGroup,
  enableGroup,
  detailGroup,
  checkGroupCodeExist,
  disableGroup,
} from './api';
import './style/index.less';

const FormItem = Form.Item;

// 定义配置项类型
interface ConfigItem {
  configKey: string;
  configValue: string;
  description?: string;
}

// 定义配置项模板
const PLATFORM_CONFIGS = {
  aap: [
    { key: 'aap.host', description: 'AAP主机地址', required: true },
    { key: 'aap.port', description: 'AAP端口', required: true },
    { key: 'aap.context-path', description: 'AAP上下文路径', required: false },
    { key: 'aap.admin.username', description: 'AAP管理员用户名', required: true },
    { key: 'aap.user.username', description: 'AAP用户用户名', required: true },
    { key: 'aap.user.password', description: 'AAP用户密码', required: true },
    { key: 'aap.workspace.name', description: 'AAP工作区名称', required: true },
    { key: 'aap.security.pem', description: 'AAP安全证书', required: true },
  ],
  dify: [
    { key: 'dify.host', description: 'DIFY主机地址', required: true },
    { key: 'dify.port', description: 'DIFY端口', required: true },
  ],
};

// 定义数据类型
interface Environment {
  id: string;
  code: string;
  name: string;
  groupType: string;
  status: number;
  createTime: string;
  lastUpdate: string;
  syncStatus?: number;
  operStatus?: number;
  configs?: ConfigItem[];
}

const AgentEnvironment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [filterVal, setFilterVal] = useState('');
  const [data, setData] = useState<Environment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingRecord, setEditingRecord] = useState<Environment | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    current: 1,
    pageSize: 20,
  });
  const [groupType, setGroupType] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用真实API获取数据
  const fetchData = () => {
    setLoading(true);
    // 构建请求参数
    const params = {
      page: pagination.current - 1, // API使用从0开始的页码
      limit: pagination.pageSize,
      name: filterVal, // 使用搜索值作为name参数
    };

    // 调用真实API
    searchGroup(params)
      .then(res => {
        if (res?.data?.success && res.data.data) {
          const responseData = res.data.data;
          setData(responseData.content || []);
          setPagination({
            total: responseData.totalElements || 0,
            current: (responseData.pageable?.pageNumber || 0) + 1, // 转换为从1开始的页码
            pageSize: responseData.size || 20,
          });
        } else {
          setData([]);
          setPagination({
            total: 0,
            current: 1,
            pageSize: 20,
          });
        }
      })
      .catch(error => {
        console.error('获取环境列表失败:', error);
        setData([]);
        setPagination({
          total: 0,
          current: 1,
          pageSize: 20,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 处理表格分页变化
  const handlePageChange = (current: number, pageSize: number) => {
    setPagination({
      ...pagination,
      current,
      pageSize,
    });
    fetchData();
  };

  // 处理新增按钮点击
  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setGroupType('');
    // 新增时不设置configs，等用户选择平台类型后再生成
    setModalVisible(true);
  };

  // 处理编辑按钮点击
  const handleEdit = async (record: Environment) => {
    setEditingRecord(record);
    setModalLoading(true);

    try {
      // 调用detailGroup接口获取详情数据
      const res = await detailGroup(record.id);
      if (res?.data?.success && res.data.data) {
        const detailData = res.data.data;
        const groupType = detailData.groupType || '';
        // 确保configs为数组格式，避免表单初始化错误
        const originalConfigs = Array.isArray(detailData.configs) ? detailData.configs : [];

        // 根据PLATFORM_CONFIGS中定义的顺序重新排序配置项
        const currentConfigsTemplate =
          PLATFORM_CONFIGS[groupType as keyof typeof PLATFORM_CONFIGS] || [];
        const reorderedConfigs = currentConfigsTemplate.map(configTemplate => {
          // 从原始配置中找到对应的配置项
          const matchedConfig = originalConfigs.find(
            config => config.configKey === configTemplate.key,
          );
          return {
            configKey: configTemplate.key,
            configValue: matchedConfig?.configValue || '',
            description: matchedConfig?.description || '',
          };
        });

        const formValues = {
          ...detailData,
          groupType,
          configs: reorderedConfigs,
        };
        form.setFieldsValue(formValues);
        setGroupType(groupType);
        setModalVisible(true);
      } else {
        Message.error(res?.data?.message || '获取详情失败');
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      Message.error('获取详情失败');
    } finally {
      setModalLoading(false);
    }
  };

  // 监听groupType字段变化
  const handleGroupTypeChange = (value: string) => {
    setGroupType(value);

    // 根据平台类型初始化配置项
    const currentConfigs = PLATFORM_CONFIGS[value as keyof typeof PLATFORM_CONFIGS] || [];

    // 初始化配置项数据
    const configsData = currentConfigs.map(config => ({
      configKey: config.key,
      configValue: '',
      description: '',
    }));

    // 更新表单的configs数据
    form.setFieldsValue({
      configs: configsData,
    });
  };

  // 处理删除按钮点击
  const handleDelete = (id: string) => {
    // 使用真实API调用删除接口
    deleteGroup([id])
      .then(res => {
        if (res?.data?.success) {
          Message.success('删除成功');
          fetchData();
        } else {
          Message.error(res?.data?.message || '删除失败');
        }
      })
      .catch(error => {
        console.error('删除失败:', error);
        Message.error('删除失败');
      });
  };

  // 处理表单提交
  const handleSubmit = () => {
    form
      .validate()
      .then(values => {
        // 构建API请求参数
        const requestData = {
          ...values,
          // 确保groupType为字符串类型
          groupType: values.groupType,
        };

        // 使用真实API调用保存或更新接口
        const apiCall = editingRecord
          ? updateGroup(editingRecord.id, requestData)
          : saveGroup(requestData);

        apiCall
          .then(res => {
            if (res?.data?.success) {
              Message.success(editingRecord ? '修改成功' : '新增成功');
              setModalVisible(false);
              fetchData();
            } else {
              Message.error(res?.data?.message || (editingRecord ? '修改失败' : '新增失败'));
            }
          })
          .catch(error => {
            console.error(editingRecord ? '修改失败:' : '新增失败:', error);
            Message.error(editingRecord ? '修改失败' : '新增失败');
          });
      })
      .catch(() => {});
  };

  // 处理状态切换
  const handleStatusChange = (id: string, status: boolean) => {
    if (status) {
      // 调用enableGroup接口启用当前环境，后端会自动停止其他环境
      enableGroup(id)
        .then(res => {
          if (res?.data?.success) {
            Message.success('启动成功');
            fetchData();
          } else {
            Message.error(res?.data?.message || '环境启动失败');
          }
        })
        .catch(error => {
          console.error('环境启动失败:', error);
          Message.error('环境启动失败');
        });
    } else {
      // 调用disableGroup接口禁用当前环境
      disableGroup(id)
        .then(res => {
          if (res?.data?.success) {
            Message.success('禁用成功');
            fetchData();
          } else {
            Message.error(res?.data?.message || '环境禁用失败');
          }
        })
        .catch(error => {
          console.error('环境禁用失败:', error);
          Message.error('环境禁用失败');
        });
    }
  };

  // 定义表格列
  const columns = [
    {
      dataIndex: 'code',
      title: '环境编码',
      render: (col: string, record: any, index: number) => {
        return <span className="overflow-text">{record?.code ?? '--'}</span>;
      },
    },
    {
      dataIndex: 'name',
      title: '环境名称',
      render: (col: string, record: any, index: number) => {
        return (
          <div role="button" tabIndex={0} className="ontology-name">
            <span className="ontology-text">{record.name}</span>
          </div>
        );
      },
    },
    {
      dataIndex: 'createTime',
      title: '创建时间',
    },
    {
      dataIndex: 'lastUpdate',
      title: '更新时间',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number, record: Environment) => (
        <Switch checked={status === 1} onChange={value => handleStatusChange(record.id, value)} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: Environment) => (
        <span>
          {/* 启用状态不展示编辑和删除按钮 */}
          {record.status !== 1 && (
            <>
              <Tooltip content="编辑">
                <IconEditColor
                  style={{
                    cursor: 'pointer',
                    fontSize: 16,
                    marginRight: 8,
                    color: 'rgb(var(--primary-6))',
                  }}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Tooltip content="删除">
                <IconDeleteColor
                  style={{
                    cursor: 'pointer',
                    fontSize: 16,
                    color: 'rgb(var(--primary-6))',
                  }}
                  onClick={() => {
                    Modal.confirm({
                      title: '确认删除',
                      content: '确定要删除这个环境吗？',
                      onOk: () => {
                        deleteGroup([record.id])
                          .then((res: any) => {
                            if (res?.data?.success) {
                              Message.success('删除成功');
                              fetchData();
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
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="ontology-publish-wrap">
      <div className="ontology-publish-content" ref={containerRef}>
        <div className="ontology-publish-content-title">
          <span className="title">
            <IconInformationColor />
            智能体环境管理
          </span>

          <span className="action">
            <Input
              value={filterVal}
              placeholder="搜索环境名称"
              onChange={val => {
                setFilterVal(val);
              }}
              onPressEnter={() => {
                fetchData();
              }}
            />
            <Button type="primary" onClick={handleAdd} icon={<IconAdd />}>
              新增环境
            </Button>
            <Button onClick={fetchData} type="outline" icon={<IconRefresh />}>
              刷新
            </Button>
          </span>
        </div>
        <div className="ontology-publish-content-content">
          <Spin loading={loading} className="wrap">
            <Table
              {...({ scroll: { y: true } } as any)}
              columns={columns}
              data={data}
              rowKey={record => record.id}
              pagination={{
                size: 'mini',
                ...pagination,
              }}
              className="table"
            />
          </Spin>
        </div>
      </div>
      <Modal
        title={editingRecord ? '编辑环境' : '新增环境'}
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        className="agent-env-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="环境编码"
            field="code"
            rules={[
              { required: true, message: '请输入环境编码' },
              {
                validator: async (value: any, cb: (err?: string) => void) => {
                  // 编辑模式下环境编码不可修改，不需要校验
                  if (editingRecord) {
                    cb();
                    return;
                  }

                  try {
                    // 新增模式下，调用checkGroupCodeExist接口校验编码是否存在
                    const res = await checkGroupCodeExist({ code: value });
                    if (res?.data?.success && res.data.data) {
                      cb('环境编码已存在');
                    } else {
                      cb();
                    }
                  } catch (err) {
                    cb('校验环境编码失败');
                  }
                },
              },
            ]}
          >
            <Input
              placeholder="请输入环境编码"
              maxLength={50}
              showWordLimit
              disabled={!!editingRecord}
            />
          </Form.Item>
          <Form.Item
            label="环境名称"
            field="name"
            rules={[{ required: true, message: '请输入环境名称' }]}
          >
            <Input maxLength={50} showWordLimit placeholder="请输入环境名称" />
          </Form.Item>
          <Form.Item
            label="平台类型"
            field="groupType"
            rules={[{ required: true, message: '请选择平台类型' }]}
          >
            <Select placeholder="请选择平台类型" onChange={handleGroupTypeChange}>
              <Select.Option value="aap">AAP平台</Select.Option>
              <Select.Option value="dify">Dify平台</Select.Option>
            </Select>
          </Form.Item>
          {/* 只有选择了平台类型才显示配置项 */}
          {groupType && (
            <Form.Item label="配置项">
              <div style={{ margin: '16px 0' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid #e8e8e8',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#fafafa' }}>
                      <th
                        style={{
                          padding: '12px 16px',
                          border: '1px solid #e8e8e8',
                          textAlign: 'left',
                          width: '30%',
                        }}
                      >
                        Key
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          border: '1px solid #e8e8e8',
                          textAlign: 'left',
                          width: '40%',
                        }}
                      >
                        值
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          border: '1px solid #e8e8e8',
                          textAlign: 'left',
                          width: '30%',
                        }}
                      >
                        描述
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 动态生成配置项 */}
                    {groupType &&
                      PLATFORM_CONFIGS[groupType as keyof typeof PLATFORM_CONFIGS]?.map(
                        (config, index) => (
                          <tr key={config.key}>
                            <td
                              style={{
                                padding: '12px 16px',
                                border: '1px solid #e8e8e8',
                                fontWeight: 500,
                              }}
                            >
                              <Form.Item
                                field={`configs[${index}].configKey`}
                                initialValue={config.key}
                              >
                                <span>{config.key}</span>
                              </Form.Item>
                            </td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e8e8e8' }}>
                              <Form.Item
                                field={`configs[${index}].configValue`}
                                rules={
                                  config.required
                                    ? [{ required: true, message: `请输入${config.key}的配置值` }]
                                    : []
                                }
                              >
                                {/* 将aap.security.pem的值设置为文本框 */}
                                {config.key === 'aap.security.pem' ? (
                                  <Input.TextArea
                                    placeholder={`请输入${config.description}`}
                                    style={{ width: '100%', minHeight: '100px' }}
                                  />
                                ) : (
                                  <Input
                                    placeholder={`请输入${config.description}`}
                                    style={{ width: '100%' }}
                                  />
                                )}
                              </Form.Item>
                            </td>
                            <td style={{ padding: '12px 16px', border: '1px solid #e8e8e8' }}>
                              <Form.Item field={`configs[${index}].description`}>
                                <Input placeholder="请输入描述" style={{ width: '100%' }} />
                              </Form.Item>
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AgentEnvironment;
