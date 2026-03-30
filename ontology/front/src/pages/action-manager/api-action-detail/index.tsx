import { getActionDetail } from '@/pages/action-type-detail/api';
import emptyIcon from '@/pages/object/images/empty.svg';
import { Alert, Button, Drawer, Empty, Form, Input, Spin, Table } from '@arco-design/web-react';
import { IconBack, IconInformationColor, IconRefreshColor } from 'modo-design/icon';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { actionExists } from '../api/index';

import './style/index.less';
const FormItem = Form.Item;

interface ActionData {
  ontologyId?: string;
  ontology?: {
    ontologyLabel?: string;
    ontologyName?: string;
    id?: string;
  };
  codeUrl?: string;
  actionLabel?: string;
  createTime?: string;
  actionName?: string;
  actionDesc?: string;
  ownerId?: string;
  objectType?: {
    apiInfo?: {
      apiName?: string;
      url?: string;
      apiMethod?: string;
      apiTimeout?: number;
      apiDesc?: string;
      params?: Array<{
        id?: string;
        parentId?: string;
        paramName?: string;
        paramMethod?: string;
        paramType?: string;
        paramDesc?: string;
        isRequired?: number;
        defaultValue?: string;
        paramMode?: string;
        children?: Array<any>;
      }>;
    };
  };
  apiInputParam?: Array<any>;
  apiOutputParam?: Array<any>;
}

interface ApiActionDetailProps {
  actionDataId: any;
  onUpdateUseSaveBtn: Function;
}
const ApiActionDetail: React.FC<ApiActionDetailProps> = ({ actionDataId, onUpdateUseSaveBtn }) => {
  const [actionData, setActionData] = useState<ActionData>({});
  const [form] = Form.useForm();
  const [codeServerVisible, setCodeServerVisible] = useState(false);
  const [codeUrl, setCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 构建嵌套参数结构的函数
  const buildNestedParams = (params: any[]) => {
    const paramMap: Record<string, any> = {};
    const rootParams: any[] = [];

    // 首先将所有参数放入map中，同时转换isRequired为布尔类型
    params.forEach(param => {
      paramMap[param.id] = {
        ...param,
        children: [],
        // 将isRequired从数字类型转换为布尔类型
        isRequired: !!param.isRequired,
      };
    });

    // 然后构建父子关系
    params.forEach(param => {
      if (param.parentId) {
        // 如果有parentId，添加到父参数的children中
        if (paramMap[param.parentId]) {
          paramMap[param.parentId].children.push(paramMap[param.id]);
        }
      } else {
        // 没有parentId的是根参数
        rootParams.push(paramMap[param.id]);
      }
    });

    return rootParams;
  };

  const rules = {
    actionLabel: [
      {
        required: true,
        message: '请输入中文名称',
      },
      {
        validator: async (value: any, cb: (err?: string) => void) => {
          if (actionData.actionLabel == value) {
            cb();
            return;
          }
          const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
          // 必须包含中文或字母的校验
          const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

          if (!formatRegex.test(value)) {
            cb('仅支持中文、字母、数字和下划线');
            return;
          } else if (!chineseOrLetterRegex.test(value)) {
            cb('必须包含中文或字母');
            return;
          }
          await actionExists({
            ontologyId: actionData?.ontology?.id,
            actionLabel: value,
          })
            .then(res => {
              if (res.data.data.exists) {
                cb('中文名称已存在');
              }
              cb();
            })
            .catch(err => {
              cb(err);
            });
        },
      },
    ],
    actionName: [
      {
        required: true,
        message: '请输入英文名称',
      },
      {
        validator: (value: any, cb: (err?: string) => void) => {
          actionExists({
            ontologyId: actionData?.ontology?.id,
            actionName: value,
          })
            .then(res => {
              if (res.data.data.exists) {
                cb('英文名称已存在');
              }
              cb();
            })
            .catch(err => {
              cb(err);
            });
        },
      },
    ],
  };

  const handleGoDev = () => {
    onUpdateUseSaveBtn(actionDataId, false);
    setCodeServerVisible(true);
    setCodeUrl(`${window.location.origin}${actionData.codeUrl}`);
  };

  const getData = () => {
    setLoading(true);
    getActionDetail(actionDataId).then(res => {
      const detailData = res.data.data;

      // 处理API参数，构建嵌套结构
      if (
        detailData.objectType &&
        detailData.objectType.apiInfo &&
        detailData.objectType.apiInfo.params
      ) {
        const params = detailData.objectType.apiInfo.params;

        // 过滤请求参数
        const inputParams = params.filter((item: any) => item.paramMode === 'request') || [];
        // 构建嵌套结构
        const nestedInputParams = buildNestedParams(inputParams);

        // 过滤响应参数
        const outputParams = params.filter((item: any) => item.paramMode === 'response') || [];
        // 构建嵌套结构
        const nestedOutputParams = buildNestedParams(outputParams);

        // 更新detailData中的参数
        detailData.apiInputParam = nestedInputParams;
        detailData.apiOutputParam = nestedOutputParams;
      }

      setActionData(detailData);
      form.setFieldsValue({
        actionLabel: detailData.actionLabel || '',
        createTime: detailData.createTime || '-',
        actionName: detailData.actionName || '',
        actionDesc: detailData.actionDesc || '',
        ownerId: detailData.ownerId || '',
      });
      setLoading(false);
    });
  };

  useEffect(() => {
    getData();
  }, [actionDataId]);
  useEffect(() => {
    onUpdateUseSaveBtn(actionDataId, true);
  }, []);
  return (
    <Spin loading={loading} className="api-action-detail">
      <div className="api-action-overview" ref={containerRef}>
        {/* <Alert
          style={{ overflow: 'clip' }}
          content="本体设计中的API均为只读状态，您可以在API管理器中编写和修改API。"
          icon={<IconInformationColor />}
          action={
            <div>
              <Button
                size="mini"
                type="outline"
                onClick={() => {
                  getData();
                }}
                style={{ marginRight: '8px' }}
              >
                <IconRefreshColor />
                刷新
              </Button>
            </div>
          }
        /> */}
        <div className="overview-wrap">
          <div className="base-info function-overview-item border-item">
            <div className="func-title">动作基础信息</div>
            <Form form={form} layout="vertical" className="base-info-form">
              <div className="gird">
                <FormItem label="中文名称" field="actionLabel" rules={rules.actionLabel}>
                  <Input placeholder="请输入逻辑类型的中文名称" maxLength={100} showWordLimit />
                </FormItem>
                <FormItem label="创建时间" field="createTime">
                  <div className="form-text-field">{actionData?.createTime || '-'}</div>
                </FormItem>
                <FormItem disabled label="英文名称" field="actionName" rules={rules.actionName}>
                  <Input placeholder="请输入逻辑类型的英文名称" maxLength={100} showWordLimit />
                </FormItem>
                <FormItem label="创建人" field="ownerId">
                  <div className="form-text-field">{actionData?.ownerId || '-'}</div>
                </FormItem>
                <FormItem disabled label="描述" field="actionDesc">
                  <Input.TextArea
                    placeholder="请输入描述"
                    maxLength={200}
                    showWordLimit
                    style={{ height: '62px' }}
                  />
                </FormItem>
              </div>
            </Form>
          </div>
          <div className="func-param function-overview-item border-item">
            <div className="func-title">API详情</div>
            <div className="func-param-item api-func-param-item">
              <div className="api-params-item">
                <div className="api-params-item-title">API名称：</div>
                <div className="api-params-item-content">
                  {actionData?.objectType?.apiInfo?.apiName}
                </div>
              </div>
              <div className="api-params-item">
                <div className="api-params-item-title">URL地址：</div>
                <div
                  className="api-params-item-content"
                  title={actionData?.objectType?.apiInfo?.url}
                >
                  {actionData?.objectType?.apiInfo?.url}
                </div>
              </div>
              <div className="api-params-item">
                <div className="api-params-item-title">请求方法：</div>
                <div className="api-params-item-content">
                  {actionData?.objectType?.apiInfo?.apiMethod}
                </div>
              </div>
              <div className="api-params-item">
                <div className="api-params-item-title">超时时间(ms)：</div>
                <div className="api-params-item-content">
                  {actionData?.objectType?.apiInfo?.apiTimeout}
                </div>
              </div>
              <div className="api-params-item">
                <div className="api-params-item-title">API描述：</div>
                <div className="api-params-item-content">
                  {actionData?.objectType?.apiInfo?.apiDesc}
                </div>
              </div>
            </div>
          </div>
          <div className="func-param function-overview-item border-item">
            <div className="func-title">入参</div>
            <div className="func-param-item">
              {actionData?.apiInputParam && actionData.apiInputParam.length > 0 ? (
                <Table
                  data={actionData.apiInputParam}
                  defaultExpandAllRows={true}
                  columns={[
                    { title: '参数名称', dataIndex: 'paramName', key: 'paramName' },
                    { title: '传入方法', dataIndex: 'paramMethod', key: 'paramMethod' },
                    { title: '参数类型', dataIndex: 'paramType', key: 'paramType' },
                    { title: '参数描述', dataIndex: 'paramDesc', key: 'paramDesc' },
                    {
                      title: '是否必填',
                      dataIndex: 'isRequired',
                      key: 'isRequired',
                      render: isRequired => (isRequired ? '是' : '否'),
                    },
                    {
                      title: '默认值',
                      dataIndex: 'defaultValue',
                      key: 'defaultValue',
                      width: 320,
                      ellipsis: true,
                    },
                  ]}
                  rowKey="id"
                  pagination={false}
                />
              ) : (
                <Empty
                  icon={
                    <div
                      style={{
                        display: 'inline-flex',
                        width: 48,
                        height: 48,
                        justifyContent: 'center',
                      }}
                    >
                      <img src={emptyIcon} alt="此API没有入参信息" />
                    </div>
                  }
                  description="此API没有入参信息"
                  style={{ paddingTop: '50px' }}
                />
              )}
            </div>
          </div>
          <div className="func-param function-overview-item border-item">
            <div className="func-title">出参</div>
            <div className="func-param-item">
              {actionData?.apiOutputParam && actionData.apiOutputParam.length > 0 ? (
                <Table
                  data={actionData.apiOutputParam}
                  defaultExpandAllRows={true}
                  columns={[
                    { title: '参数名称', dataIndex: 'paramName', key: 'paramName' },
                    { title: '参数类型', dataIndex: 'paramType', key: 'paramType' },
                    { title: '参数描述', dataIndex: 'paramDesc', key: 'paramDesc' },
                  ]}
                  rowKey="id"
                  pagination={false}
                />
              ) : (
                <Empty
                  icon={
                    <div
                      style={{
                        display: 'inline-flex',
                        width: 48,
                        height: 48,
                        justifyContent: 'center',
                      }}
                    >
                      <img src={emptyIcon} alt="此API没有出参信息" />
                    </div>
                  }
                  description="此API没有出参信息"
                  style={{ paddingTop: '50px' }}
                />
              )}
            </div>
          </div>
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
              onUpdateUseSaveBtn(actionDataId, true);
              setCodeServerVisible(false);
            }}
          >
            <IconBack />
          </Button>
          <iframe src={codeUrl} title="代码服务器页面" />
        </Drawer>
      </div>
    </Spin>
  );
};

export default ApiActionDetail;
