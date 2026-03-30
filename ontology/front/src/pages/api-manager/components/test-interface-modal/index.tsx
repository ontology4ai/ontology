import React, { useState, useEffect } from 'react';
import { Drawer, Button, Table, Input, Message } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { testApi } from '@/pages/api-manager/api';
import { v4 as uuidv4 } from 'uuid';
interface ApiTestParams {
  apiMethod: string;
  url: string;
  apiTimeout: number;
  params: Array<any>;
}

interface TestInterfaceModalProps {
  visible: boolean;
  onClose: () => void;
  apiTestParams?: ApiTestParams;
}

const TestInterfaceModal: React.FC<TestInterfaceModalProps> = ({
  visible,
  onClose,
  apiTestParams,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string>('');
  const [inputParams, setInputParams] = useState<ApiTestParams['params']>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    if (apiTestParams?.params) {
      // 递归处理参数，将默认值赋值给paramValue，包括children
      const processParam = (param: any) => {
        // 创建新的参数对象，设置paramValue
        const processedParam = {
          ...param,
          paramValue: param.defaultValue || null,
        };

        // 如果有children，递归处理每个子参数
        if (param.children && param.children.length > 0) {
          processedParam.children = param.children.map((child: any) => processParam(child));
        }

        return processedParam;
      };

      // 处理所有顶层参数
      const requestParams = apiTestParams.params.map(processParam);
      setInputParams(requestParams);

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
      const expandedKeys = getAllExpandedKeys(requestParams);
      setExpandedRowKeys(expandedKeys);
    }
  }, [apiTestParams]);

  // Update handleParamChange to modify inputParams
  const handleParamChange = (paramKey: string | number, value: string) => {
    // 递归更新参数值
    const updateParamValue = (params: any[]) => {
      return params.map(param => {
        if (param.id === paramKey) {
          return { ...param, paramValue: value };
        }
        if (param.children && param.children.length > 0) {
          return { ...param, children: updateParamValue(param.children) };
        }
        return param;
      });
    };
    setInputParams(updateParamValue(inputParams));
  };

  // 递归将children转换为对应类型的数据
  const convertChildrenData = (children: any[], paramType: string): any => {
    if (paramType === 'object') {
      const result: any = {};
      children.forEach(child => {
        if (child.children && child.children.length > 0 && child.paramType === 'object') {
          // 如果子参数也是object类型，递归处理
          result[child.paramName] = convertChildrenData(child.children, child.paramType);
        } else if (child.children && child.children.length > 0 && child.paramType === 'array') {
          // 如果子参数是array类型，递归处理
          result[child.paramName] = convertChildrenData(child.children, child.paramType);
        } else {
          // 否则直接使用paramValue
          result[child.paramName] = child.paramValue;
        }
      });
      return result;
    }
    if (paramType === 'array') {
      // 对于array类型，直接返回子参数的paramValue数组
      return children.map(child => {
        if (child.children && child.children.length > 0 && child.paramType === 'object') {
          // 如果子参数是object类型，递归处理
          return convertChildrenData(child.children, child.paramType);
        }
        if (child.children && child.children.length > 0 && child.paramType === 'array') {
          // 如果子参数是array类型，递归处理
          return convertChildrenData(child.children, child.paramType);
        }
        // 否则直接使用paramValue
        return child.paramValue;
      });
    }
    return null;
  };

  const handleTest = async () => {
    if (!apiTestParams) return;

    // Validate required parameters
    const requiredParams = inputParams.filter(param => param.isRequired === 1);
    const missingParams = requiredParams.filter(param => {
      if (param.paramType === 'object') {
        // 对于object类型，检查其children中的必填参数
        const hasMissingChild = param.children.some(
          (child: any) => child.isRequired === 1 && !child.paramValue?.trim(),
        );
        return hasMissingChild;
      }
      return !param.paramValue?.trim();
    });
    if (missingParams.length > 0) {
      Message.warning(`请填写必填参数: ${missingParams.map(p => p.paramName).join(', ')}`);
      return;
    }

    setLoading(true);
    setTestResult('');
    try {
      // 处理inputParams，将object和array类型的第一层参数的children转换为对应类型的数据
      const processedParams = inputParams.map(param => {
        if (
          (param.paramType === 'object' || param.paramType === 'array') &&
          param.children &&
          param.children.length > 0
        ) {
          // 将children转换为对应类型的数据
          const paramValue = convertChildrenData(param.children, param.paramType);
          return {
            ...param,
            paramValue,
          };
        }
        return param;
      });

      // 提取第一层的body参数，合并成apiBody对象
      const bodyParams = processedParams.filter(param => param.paramMethod === 'body');
      const apiBody = bodyParams.reduce((acc, param) => {
        acc[param.paramName] = param.paramValue;
        return acc;
      }, {});

      // 过滤出非body参数，用于params字段
      const nonBodyParams = processedParams.filter(param => param.paramMethod !== 'body');

      // 去除数据里面的children，只保留必要的属性
      const paramsForRequest = nonBodyParams.map(param => {
        const { children, ...rest } = param;
        return rest;
      });

      // Prepare request data with apiBody
      const requestData = {
        apiMethod: apiTestParams.apiMethod,
        url: apiTestParams.url,
        apiTimeout: apiTestParams.apiTimeout,
        params: paramsForRequest,
        apiBody: apiBody,
      };

      // 调用测试接口
      const response = await testApi(requestData);
      // 1. 确保解析完整的JSON字符串（处理嵌套字符串情况）
      let resultData = response?.data?.message;
      if (typeof resultData === 'string') {
        try {
          // 尝试解析顶层JSON
          resultData = JSON.parse(resultData);
          // 2. 递归检查并解析所有字符串类型的JSON字段
          const parseNestedJSON = (obj: any): any => {
            if (typeof obj === 'string') {
              try {
                return JSON.parse(obj);
              } catch (error) {
                return obj;
              }
            }
            if (Array.isArray(obj)) return obj.map(parseNestedJSON);
            if (obj && typeof obj === 'object') {
              const newObj = { ...obj };
              Object.keys(newObj).forEach(key => {
                newObj[key] = parseNestedJSON(newObj[key]);
              });
              return newObj;
            }
            return obj;
          };
          resultData = parseNestedJSON(resultData);
        } catch (e) {
          // 处理解析错误
          console.error('解析测试结果失败:', e);
        }
      }
      // 3. 格式化最终结果
      setTestResult(resultData ? JSON.stringify(resultData, null, 2) : '');
    } catch (error) {
      Message.error('测试接口失败，请检查网络或接口配置');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // 清除所有数据
    setTestResult('');
    setInputParams([]);
    setLoading(false);
    onClose();
  };

  return (
    <Drawer
      title="接口测试"
      visible={visible}
      onCancel={handleClose}
      placement="right"
      width={600}
      footer={[]}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 14 }}>参数和值</span>
        <Table
          style={{ marginTop: 4 }}
          data={inputParams || []}
          expandedRowKeys={expandedRowKeys}
          onExpand={(record, expanded) =>
            setExpandedRowKeys(
              expanded
                ? [...expandedRowKeys, record.id]
                : expandedRowKeys.filter(key => key !== record.id),
            )
          }
          columns={[
            {
              title: '参数名称',
              dataIndex: 'paramName',
              key: 'paramName',
            },
            {
              title: '参数类型',
              dataIndex: 'paramType',
              key: 'paramType',
            },
            {
              title: '是否必填',
              dataIndex: 'isRequired',
              key: 'isRequired',
              render: (isRequired: number) => (isRequired === 1 ? '是' : '否'),
            },
            {
              title: '参数值',
              dataIndex: 'paramValue',
              key: 'paramValue',
              render: (text: string, record: any) => {
                // 对于object类型，不展示参数值填写框
                if (record.paramType === 'object') {
                  return null;
                }
                // 对于array类型，展示+图标按钮
                if (record.paramType === 'array') {
                  const handleAddArrayItem = () => {
                    // 新增一个和当前children[0]一模一样的，但是id重新生成，参数值为空
                    const originalItem = record.children[0];
                    // 递归处理子项，生成新的id，参数值为空
                    const createNewItem = (item: any) => {
                      const newItem = {
                        ...item,
                        id: uuidv4(),
                        paramValue: '',
                      };
                      // 如果有children，递归处理
                      if (item.children && item.children.length > 0) {
                        newItem.children = item.children.map((child: any) => createNewItem(child));
                      }
                      return newItem;
                    };
                    const newItem = createNewItem(originalItem);
                    // 更新inputParams，在当前记录的children中添加新项
                    const updateInputParams = (params: any[]) => {
                      return params.map(param => {
                        if (param.id === record.id) {
                          return {
                            ...param,
                            children: [...param.children, newItem],
                          };
                        }
                        if (param.children && param.children.length > 0) {
                          return {
                            ...param,
                            children: updateInputParams(param.children),
                          };
                        }
                        return param;
                      });
                    };
                    setInputParams(updateInputParams(inputParams));
                  };
                  return (
                    <Button
                      type="text"
                      icon={<IconPlus />}
                      onClick={handleAddArrayItem}
                      style={{ padding: 0 }}
                    ></Button>
                  );
                }
                // 其他类型，显示普通的参数值填写框
                return (
                  <Input
                    value={text}
                    onChange={value => handleParamChange(record.id, value)}
                    style={{ width: '100%' }}
                  />
                );
              },
            },
          ]}
          pagination={false}
          rowKey={record => record.id}
        />
      </div>
      <div className="test-btn" style={{ textAlign: 'right', padding: '0 12px', marginBottom: 16 }}>
        <Button key="test" type="primary" loading={loading} onClick={handleTest}>
          执行测试
        </Button>
      </div>
      {testResult && (
        <div style={{ marginTop: 16 }}>
          <span style={{ fontSize: 14 }}>测试结果</span>
          <pre
            style={{
              padding: 12,
              borderRadius: 4,
              height: 320,
              overflow: 'auto',
              fontSize: 12,
              backgroundColor: '#edeff2',
              color: '#697586',
            }}
          >
            {testResult}
          </pre>
        </div>
      )}
    </Drawer>
  );
};

export default TestInterfaceModal;
