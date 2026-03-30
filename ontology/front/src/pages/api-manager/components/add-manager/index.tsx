import React, { useRef, useEffect, useState, Children } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Table,
  Switch,
  Message,
  InputNumber,
} from '@arco-design/web-react';
import TestInterfaceModal from '../test-interface-modal';
import { IconPlus } from '@arco-design/web-react/icon';
import './style/index.less';
import { saveApi, updateApi, validApiName, searchApiFunction } from '@/pages/api-manager/api/index';
import object from '@/pages/object';
import { v4 as uuidv4 } from 'uuid';

const { TextArea } = Input;

interface AddManagerProps {
  visible: boolean;
  onClose: () => void;
  editData?: any;
}

const AddManager: React.FC<AddManagerProps> = ({ visible, onClose, editData }) => {
  const [form] = Form.useForm();
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [inputParams, setInputParams] = useState([]);
  const [outputParams, setOutputParams] = useState([]);
  const message = Message;
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // 缓存API名称的初始值
  const [initialApiName, setInitialApiName] = useState('');
  // 存储函数列表
  const [functionList, setFunctionList] = useState([]);
  // 加载函数列表的状态
  const [functionLoading, setFunctionLoading] = useState(false);
  // 初始化表单实例和参数数据
  useEffect(() => {
    if (visible) {
      // 加载函数列表
      const loadFunctionList = async () => {
        setFunctionLoading(true);
        try {
          const response = await searchApiFunction();
          if (response?.data?.success && response.data?.data) {
            setFunctionList(response.data.data);
          } else {
            message.error(response?.data?.devMsg || '获取函数列表失败');
          }
        } catch (error) {
          console.error('获取函数列表失败:', error);
          message.error('获取函数列表失败');
        } finally {
          setFunctionLoading(false);
        }
      };
      loadFunctionList();
      if (editData) {
        // 编辑模式，设置表单值和参数数据
        // 从params分离输入输出参数
        const initInputParams =
          editData.params
            ?.filter(p => p.paramMode === 'request')
            .map(param => ({
              id: param.id || uuidv4(),
              paramName: param.paramName,
              paramMethod: param.paramMethod,
              paramType: param.paramType,
              paramDesc: param.paramDesc,
              isRequired: param.isRequired,
              isBuiltins: param.isBuiltins,
              defaultValue: param.defaultValue,
              isVirtual: param.isVirtual,
              children: param.children || [],
              functionId: param.functionId,
            })) || [];
        const initOutputParams =
          editData.params
            ?.filter(p => p.paramMode === 'response')
            .map(param => ({
              id: param.id || uuidv4(),
              paramName: param.paramName,
              paramType: param.paramType,
              paramDesc: param.paramDesc,
              isRequired: param.isRequired,
              isBuiltins: param.isBuiltins,
              defaultValue: param.defaultValue,
              isVirtual: param.isVirtual,
              children: param.children || [],
              functionId: param.functionId,
            })) || [];

        form.setFieldsValue({
          apiName: editData.apiName || '',
          apiDescription: editData.apiDesc || '',
          apiMethod: editData.apiMethod || '',
          url: editData.url || '',
          apiTimeout: editData.apiTimeout || '',
          apiType: editData.apiType || '',
        });
        setInputParams(initInputParams);
        setOutputParams(initOutputParams);
        // 设置API名称的初始值
        setInitialApiName(editData.apiName || '');
        // 递归获取所有拥有children的节点id
        const getAllExpandedKeys = (params: any[]) => {
          let keys: string[] = [];
          for (const param of params) {
            if (param.children && param.children.length > 0) {
              keys.push(param.id);
              // 递归处理子节点
              keys = keys.concat(getAllExpandedKeys(param.children));
            }
          }
          return keys;
        };

        // 初始化所有拥有children的节点默认展开
        const inputExpandedKeys = getAllExpandedKeys(initInputParams);
        const outputExpandedKeys = getAllExpandedKeys(initOutputParams);
        // 合并输入和输出参数的展开节点id
        const expandedKeys = [...inputExpandedKeys, ...outputExpandedKeys];
        setExpandedRowKeys(expandedKeys);
      } else {
        // 新增模式，重置表单和参数数据
        form.setFieldsValue({ apiMethod: 'GET' });
        setInputParams([]);
        setOutputParams([]);
        // 新增模式，初始API名称为空
        setInitialApiName('');
      }
    }
  }, [visible, form, editData]);

  const handleAddSubProperty = record => {
    // 查找当前记录在inputParams中的索引
    const newInputParams = [...inputParams];
    const param = findParamsItem(record, newInputParams);
    if (param) {
      // 定义默认的子属性结构，设置paramMode为request
      const defaultChild = {
        id: uuidv4().toString(),
        paramName: '',
        paramMethod: '',
        paramType: 'string',
        paramDesc: '',
        isRequired: 0,
        isBuiltins: 0,
        paramMode: 'request',
        functionId: undefined,
      };
      // 如果children不存在则初始化数组，否则添加新子属性
      param.children = param.children ? [...param.children, defaultChild] : [defaultChild];
      setInputParams(newInputParams);
      // 更新展开行键，确保新添加的子属性可见
      setExpandedRowKeys(prevKeys => [...prevKeys, record.id]);
    }
  };

  const validateParams = () => {
    let isValid = true;

    // 验证输入参数并设置错误状态
    const newInputParams = inputParams.map(param => ({
      ...param,
      nameError: !param.paramName,
    }));
    if (newInputParams.some(param => param.nameError)) {
      isValid = false;
    }
    setInputParams(newInputParams);

    // 验证输出参数并设置错误状态
    const newOutputParams = outputParams.map(param => ({
      ...param,
      nameError: !param.paramName,
    }));
    if (newOutputParams.some(param => param.nameError)) {
      isValid = false;
    }
    setOutputParams(newOutputParams);

    if (!isValid) {
      message.error('参数名称为必填项');
    }
    return isValid;
  };

  const handleTestClick = async () => {
    try {
      const formValues = await form.validate();
      if (!validateParams()) return;
      setTestModalVisible(true);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const formValues = await form.validate();
      if (!validateParams()) return;

      // 转换输入参数格式以匹配API要求
      // 直接设置paramMode，不需要递归遍历，因为新增参数时已经设置了正确的paramMode
      const requestParams = inputParams.map(param => ({
        ...param,
        paramMode: 'request',
      }));
      // 转换输出参数格式以匹配API要求
      // 直接设置paramMode，不需要递归遍历，因为新增参数时已经设置了正确的paramMode
      const responseParams = outputParams.map(param => ({
        ...param,
        paramMode: 'response',
      }));

      // 合并输入输出参数
      const params = [...requestParams, ...responseParams];

      // 构建API请求数据
      const apiData = {
        apiName: formValues.apiName,
        apiMethod: formValues.apiMethod,
        url: formValues.url,
        apiDesc: formValues.apiDescription || '',
        params: params,
        apiTimeout: formValues.apiTimeout,
        apiType: formValues.apiType || '',
      };
      try {
        if (editData) {
          const res = await updateApi({ ...apiData, id: editData.id });
          if (res?.data?.success) {
            message.success('更新成功');
          } else {
            message.error(res?.data?.devMsg || res?.message);
          }
        } else {
          const res = await saveApi(apiData);
          if (res?.data?.success) {
            message.success('保存成功');
          } else {
            message.error(res?.data?.devMsg || res?.message);
          }
        }
        onClose();
      } catch (error: any) {
        message.error(`操作失败：${error.response?.data?.message || error.message}`);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const isTopItem = record => {
    return inputParams.some(item => item === record);
  };

  // 递归查找参数项及其children中与record匹配的项
  const findParamsItem = (record, params) => {
    // 递归搜索函数
    const search = items => {
      for (const item of items) {
        // 找到匹配项则返回
        if (item === record) {
          return item;
        }

        // 如果有children，递归查找
        if (item.children && item.children.length > 0) {
          const foundItem = search(item.children);
          if (foundItem) {
            return foundItem;
          }
        }
      }
      return null;
    };

    return search(params);
  };

  // 递归删除参数项
  const deleteParamsItem = (record, params) => {
    // 递归删除函数
    const deleteItem = items => {
      // 遍历当前层级的所有项
      for (let i = 0; i < items.length; i++) {
        // 找到要删除的项，直接从当前数组中删除
        if (items[i] === record) {
          items.splice(i, 1);
          return true;
        }

        // 如果当前项有children，递归删除
        if (items[i].children && items[i].children.length > 0) {
          const deleted = deleteItem(items[i].children);
          if (deleted) {
            // 如果删除后children数组为空，可能需要更新展开状态
            if (items[i].children.length === 0) {
              // 移除该节点的展开状态
              setExpandedRowKeys(prevKeys => prevKeys.filter(key => key !== items[i].id));
            }
            return true;
          }
        }
      }
      return false;
    };

    // 复制一份params数组，避免直接修改原数组
    const newParams = [...params];
    deleteItem(newParams);
    return newParams;
  };

  return (
    <>
      <Modal
        title={editData ? '编辑API' : '新增API'}
        visible={visible}
        className="add-manager-modal"
        onCancel={onClose}
        footer={[
          <Button key="test" type="primary" onClick={handleTestClick}>
            测试接口
          </Button>,
          <Button key="cancel" onClick={onClose}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            保存
          </Button>,
        ]}
      >
        <div style={{ padding: '20px' }}>
          <div className="content-title">
            <div className="titile-icon"></div>
            <span>基础信息</span>
          </div>
          <Form
            form={form}
            layout="horizontal"
            initialValues={{}}
            onValuesChange={(changedValues, allValues) => {
              // 可根据需要添加状态更新逻辑
            }}
          >
            <Form.Item
              label="API名称"
              field="apiName"
              rules={[{ required: true, message: '请输入API名称' }]}
            >
              <Input
                style={{ width: 470 }}
                onBlur={async () => {
                  const apiName = form.getFieldValue('apiName');
                  const trimmedApiName = apiName.trim();
                  if (!trimmedApiName) return;
                  // 对比当前API名称和初始值，如果相同则不调用校验接口
                  if (trimmedApiName === initialApiName) {
                    return;
                  }
                  try {
                    const response = await validApiName({ apiName: trimmedApiName });
                    if (response?.data?.success && response.data?.data?.apiNameIsExist) {
                      form.setFields({
                        apiName: {
                          value: trimmedApiName,
                          error: { message: 'API名称已存在，请更换' },
                        },
                      });
                    }
                  } catch (error) {
                    // 处理验证API名称时的错误
                    console.error('验证API名称失败:', error);
                  }
                }}
                placeholder="请输入API名称，大模型将根据名称调用此API"
              />
            </Form.Item>
            <Form.Item
              label="请求方法"
              field="apiMethod"
              rules={[{ required: true, message: '请选择请求方法' }]}
            >
              <Select style={{ width: 180 }}>
                <Select.Option value="GET">GET</Select.Option>
                <Select.Option value="POST">POST</Select.Option>
                <Select.Option value="PUT">PUT</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="URL地址"
              field="url"
              rules={[{ required: true, message: '请输入URL地址' }]}
            >
              <Input style={{ width: 470 }} placeholder="请输入有效的访问地址或资源链接" />
            </Form.Item>
            <Form.Item
              label="接口类型"
              field="apiType"
              rules={[{ required: true, message: '请选择接口类型' }]}
            >
              <Select
                placeholder="请选择接口类型"
                options={[
                  { value: 'object', label: '对象' },
                  { value: 'logic', label: '逻辑' },
                  { value: 'action', label: '动作' },
                ]}
                style={{ width: 180 }}
              />
            </Form.Item>
            <Form.Item
              label="API描述"
              field="apiDescription"
              rules={[{ required: true, message: '请输入API描述' }]}
            >
              <TextArea
                style={{ width: 470 }}
                placeholder="请输入描述，让大模型知道什么情况下调用此API"
                rows={4}
              />
            </Form.Item>
            <Form.Item
              label="超时时间"
              field="apiTimeout"
              rules={[{ type: 'number', message: '请输入有效的数字' }]}
            >
              <InputNumber min={0} style={{ width: 180 }} placeholder="请输入超时时间(毫秒)" />
            </Form.Item>
          </Form>
          <div className="content-title">
            <div className="titile-icon"></div>
            <span>输入参数</span>
          </div>
          {/* 输入参数表格 */}
          <div style={{ margin: '16px 0' }}>
            <div>
              <Table
                expandedRowKeys={expandedRowKeys}
                onExpand={(record, expanded) => {
                  setExpandedRowKeys(
                    expanded
                      ? [...expandedRowKeys, record.id]
                      : expandedRowKeys.filter(key => key !== record.id),
                  );
                }}
                data={inputParams}
                columns={[
                  {
                    title: '参数名称',
                    dataIndex: 'paramName',
                    render: (_, record) => (
                      <Input
                        disabled={record.isVirtual}
                        placeholder="请输入"
                        style={{ width: 120, borderColor: record.nameError ? 'red' : '' }}
                        value={record.paramName}
                        onChange={(value, e) => {
                          const newData = [...inputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.paramName = value || '';
                            paramsItem.nameError = !value;
                          }
                          setInputParams(newData);
                        }}
                      />
                    ),
                  },
                  {
                    title: '传入方法',
                    dataIndex: 'paramMethod',
                    render: (_, record) =>
                      !isTopItem(record) ? null : (
                        <Select
                          defaultValue="path"
                          style={{ width: 100 }}
                          value={record.paramMethod}
                          onChange={value => {
                            const newData = [...inputParams];
                            const paramsItem = findParamsItem(record, newData);
                            if (paramsItem) {
                              paramsItem.paramMethod = value;
                            }
                            setInputParams(newData);
                          }}
                        >
                          <Select.Option value="path">path</Select.Option>
                          <Select.Option value="query">query</Select.Option>
                          <Select.Option value="body">body</Select.Option>
                          <Select.Option value="header">header</Select.Option>
                          <Select.Option value="cookie">cookie</Select.Option>
                        </Select>
                      ),
                  },
                  {
                    title: '参数类型',
                    dataIndex: 'paramType',
                    render: (_, record) => (
                      <Select
                        defaultValue="string"
                        style={{ width: 100 }}
                        value={record.paramType}
                        onChange={value => {
                          const newData = [...inputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.paramType = value;
                            paramsItem.children = [];
                          }
                          if (value === 'array') {
                            const defaultChild = {
                              id: uuidv4().toString(),
                              paramName: '[Array item]',
                              paramMethod: '',
                              paramType: 'string',
                              paramDesc: '',
                              isRequired: 0,
                              isBuiltins: 0,
                              isVirtual: true,
                              paramMode: 'request',
                              functionId: undefined,
                            };
                            const item = findParamsItem(record, newData);
                            if (item) {
                              item.children = [defaultChild];
                            }
                            setExpandedRowKeys(prevKeys => [...prevKeys, record.id]);
                          }
                          setInputParams(newData);
                        }}
                      >
                        <Select.Option value="string">string</Select.Option>
                        <Select.Option value="integer">integer</Select.Option>
                        <Select.Option value="number">number</Select.Option>
                        <Select.Option
                          disabled={record.paramMethod !== 'body' && isTopItem(record)}
                          value="object"
                        >
                          object
                        </Select.Option>
                        <Select.Option
                          disabled={
                            record.isVirtual || (record.paramMethod !== 'body' && isTopItem(record))
                          }
                          value="array"
                        >
                          array
                        </Select.Option>
                      </Select>
                    ),
                  },
                  {
                    title: '参数描述',
                    dataIndex: 'paramDesc',
                    render: (_, record) => (
                      <Input
                        placeholder="请输入"
                        style={{ width: 150 }}
                        value={record.paramDesc}
                        onChange={(value, e) => {
                          const newData = [...inputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.paramDesc = value || '';
                          }
                          setInputParams(newData);
                        }}
                      />
                    ),
                  },
                  {
                    title: '是否必填',
                    dataIndex: 'isRequired',
                    render: (_, record) => (
                      <Select
                        defaultValue="0"
                        style={{ width: 80 }}
                        value={record.isRequired === 1 ? '1' : '0'}
                        onChange={value => {
                          const newData = [...inputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.isRequired = value === '1' ? 1 : 0;
                          }
                          setInputParams(newData);
                        }}
                      >
                        <Select.Option value="0">否</Select.Option>
                        <Select.Option value="1">是</Select.Option>
                      </Select>
                    ),
                  },
                  {
                    title: '函数',
                    dataIndex: 'functionId',
                    render: (_, record) => (
                      <Select
                        placeholder="请选择函数"
                        style={{ width: 150 }}
                        value={record.functionId}
                        onChange={value => {
                          const newData = [...inputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.functionId = value;
                          }
                          setInputParams(newData);
                        }}
                        loading={functionLoading}
                      >
                        {functionList.map(functionItem => (
                          <Select.Option key={functionItem.id} value={functionItem.id}>
                            {functionItem.functionName}
                          </Select.Option>
                        ))}
                      </Select>
                    ),
                  },
                  {
                    title: '是否内置字段',
                    dataIndex: 'isBuiltins',
                    render: (_, record) => (
                      <Select
                        defaultValue="0"
                        style={{ width: 100 }}
                        value={record.isBuiltins === 1 ? '1' : '0'}
                        onChange={value => {
                          const newData = [...inputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.isBuiltins = value === '1' ? 1 : 0;
                          }
                          setInputParams(newData);
                        }}
                      >
                        <Select.Option value="0">否</Select.Option>
                        <Select.Option value="1">是</Select.Option>
                      </Select>
                    ),
                  },
                  {
                    title: '默认值',
                    dataIndex: 'defaultValue',
                    render: (_, record) => {
                      // 参数类型为object和array的时候，不展示默认值一项
                      if (record.paramType === 'object' || record.paramType === 'array') {
                        return null;
                      }
                      return (
                        <Input
                          placeholder="请输入"
                          style={{ width: 100 }}
                          value={record.defaultValue || ''}
                          onChange={(value, e) => {
                            const newData = [...inputParams];
                            const paramsItem = findParamsItem(record, newData);
                            if (paramsItem) {
                              paramsItem.defaultValue = value || '';
                            }
                            setInputParams(newData);
                          }}
                        />
                      );
                    },
                    width: 160,
                  },
                  {
                    title: '操作',
                    render: (_, record) => (
                      <>
                        <Button
                          type="text"
                          onClick={() => {
                            // 使用递归删除函数处理子节点删除
                            const newInputParams = deleteParamsItem(record, inputParams);
                            setInputParams(newInputParams);
                          }}
                        >
                          删除
                        </Button>

                        {record.paramType === 'object' && (
                          <Button
                            type="text"
                            onClick={() => handleAddSubProperty(record)}
                            style={{ marginRight: 8 }}
                          >
                            添加子属性
                          </Button>
                        )}
                      </>
                    ),
                    width: 220,
                  },
                ]}
                pagination={false}
                locale={{ emptyText: '暂无数据' }}
                rowKey={record => record.id}
              />
              <Button
                type="dashed"
                onClick={() => {
                  setInputParams([
                    ...inputParams,
                    {
                      id: uuidv4(),
                      paramName: '',
                      paramMethod: 'path',
                      paramType: 'string',
                      paramDesc: '',
                      isRequired: 0,
                      defaultValue: '',
                      isBuiltins: 0,
                      nameError: false,
                      paramMode: 'request',
                      functionId: undefined,
                    },
                  ]);
                }}
                style={{ width: 'calc(100% - 40px)', margin: '8px 20px 0 20px' }}
                icon={<IconPlus />}
              >
                新增参数
              </Button>
            </div>
          </div>
          <div className="content-title">
            <div className="titile-icon"></div>
            <span>输出参数</span>
          </div>
          {/* 输出参数表格 */}
          <div style={{ margin: '16px 0' }}>
            <div>
              <Table
                expandedRowKeys={expandedRowKeys}
                onExpand={(record, expanded) => {
                  setExpandedRowKeys(
                    expanded
                      ? [...expandedRowKeys, record.id]
                      : expandedRowKeys.filter(key => key !== record.id),
                  );
                }}
                data={outputParams}
                columns={[
                  {
                    title: '参数名称',
                    dataIndex: 'paramName',
                    render: (_, record) => (
                      <Input
                        disabled={record.isVirtual}
                        placeholder="请输入"
                        style={{ width: 120, borderColor: record.nameError ? 'red' : '' }}
                        value={record.paramName}
                        onChange={(value, e) => {
                          const newData = [...outputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.paramName = value || '';
                            paramsItem.nameError = !value;
                          }
                          setOutputParams(newData);
                        }}
                      />
                    ),
                  },
                  {
                    title: '参数类型',
                    dataIndex: 'paramType',
                    render: (_, record) => (
                      <Select
                        defaultValue="string"
                        style={{ width: 100 }}
                        value={record.paramType}
                        onChange={value => {
                          const newData = [...outputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.paramType = value;
                            paramsItem.children = [];
                          }
                          if (value === 'array') {
                            const defaultChild = {
                              id: uuidv4().toString(),
                              paramName: '[Array item]',
                              paramType: 'string',
                              paramDesc: '',
                              isRequired: 0,
                              isBuiltins: 0,
                              isVirtual: true,
                              paramMode: 'response',
                              functionId: undefined,
                            };
                            const item = findParamsItem(record, newData);
                            if (item) {
                              item.children = [defaultChild];
                            }
                            setExpandedRowKeys(prevKeys => [...prevKeys, record.id]);
                          }
                          setOutputParams(newData);
                        }}
                      >
                        <Select.Option value="string">string</Select.Option>
                        <Select.Option value="integer">integer</Select.Option>
                        <Select.Option value="number">number</Select.Option>

                        <Select.Option
                          disabled={record.paramMethod !== 'body' && isTopItem(record)}
                          value="object"
                        >
                          object
                        </Select.Option>
                        <Select.Option
                          disabled={
                            record.isVirtual || (record.paramMethod !== 'body' && isTopItem(record))
                          }
                          value="array"
                        >
                          array
                        </Select.Option>
                      </Select>
                    ),
                  },
                  {
                    title: '参数描述',
                    dataIndex: 'paramDesc',
                    render: (_, record) => (
                      <Input
                        placeholder="请输入"
                        style={{ width: 150 }}
                        value={record.paramDesc}
                        onChange={(value, e) => {
                          const newData = [...outputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.paramDesc = value || '';
                          }
                          setOutputParams(newData);
                        }}
                      />
                    ),
                  },
                  {
                    title: '是否必填',
                    dataIndex: 'isRequired',
                    render: (_, record) => (
                      <Select
                        defaultValue="0"
                        style={{ width: 80 }}
                        value={record.isRequired === 1 ? '1' : '0'}
                        onChange={value => {
                          const newData = [...outputParams];
                          const paramsItem = findParamsItem(record, newData);
                          if (paramsItem) {
                            paramsItem.isRequired = value === '1' ? 1 : 0;
                          }
                          setOutputParams(newData);
                        }}
                      >
                        <Select.Option value="0">否</Select.Option>
                        <Select.Option value="1">是</Select.Option>
                      </Select>
                    ),
                  },
                  {
                    title: '操作',
                    render: (_, record) => (
                      <>
                        <Button
                          type="text"
                          onClick={() => {
                            // 使用递归删除函数处理子节点删除
                            const newOutputParams = deleteParamsItem(record, outputParams);
                            setOutputParams(newOutputParams);
                          }}
                        >
                          删除
                        </Button>

                        {record.paramType === 'object' && (
                          <Button
                            type="text"
                            onClick={() => {
                              // 查找当前记录在outputParams中的索引
                              const newOutputParams = [...outputParams];
                              const param = findParamsItem(record, newOutputParams);
                              if (param) {
                                // 定义默认的子属性结构，设置paramMode为response
                                const defaultChild = {
                                  id: uuidv4().toString(),
                                  paramName: '',
                                  paramType: 'string',
                                  paramDesc: '',
                                  isRequired: 0,
                                  isBuiltins: 0,
                                  paramMode: 'response',
                                  functionId: undefined,
                                };
                                // 如果children不存在则初始化数组，否则添加新子属性
                                param.children = param.children
                                  ? [...param.children, defaultChild]
                                  : [defaultChild];
                                setOutputParams(newOutputParams);
                                // 更新展开行键，确保新添加的子属性可见
                                setExpandedRowKeys(prevKeys => [...prevKeys, record.id]);
                              }
                            }}
                            style={{ marginRight: 8 }}
                          >
                            添加子属性
                          </Button>
                        )}
                      </>
                    ),
                    width: 220,
                  },
                ]}
                pagination={false}
                locale={{ emptyText: '暂无数据' }}
                rowKey={record => record.id}
              />
              <Button
                type="dashed"
                onClick={() => {
                  setOutputParams([
                    ...outputParams,
                    {
                      id: uuidv4(),
                      paramName: '',
                      paramType: 'string',
                      paramDesc: '',
                      isRequired: 0,
                      isBuiltins: 0,
                      defaultValue: '',
                      nameError: false,
                      paramMode: 'response',
                    },
                  ]);
                }}
                style={{ width: 'calc(100% - 40px)', margin: '8px 20px 0 20px' }}
                icon={<IconPlus />}
              >
                新增参数
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <TestInterfaceModal
        visible={testModalVisible}
        onClose={() => setTestModalVisible(false)}
        apiTestParams={{
          apiMethod: form.getFieldValue('apiMethod'),
          url: form.getFieldValue('url'),
          apiTimeout: form.getFieldValue('apiTimeout'),
          params: inputParams,
        }}
      />
    </>
  );
};

export default AddManager;
