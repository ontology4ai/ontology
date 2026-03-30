import { getActionDetail } from '@/pages/action-type-detail/api';
import emptyIcon from '@/pages/object/images/empty.svg';
import { Alert, Button, Drawer, Empty, Form, Input, Spin } from '@arco-design/web-react';
import {
  IconBack,
  IconInformationColor,
  IconInputParametersColor,
  IconRefreshColor,
} from 'modo-design/icon';
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
  fileName?: string;
  inputParam?: string;
  functionCode?: string;
  objectType?: Array<{
    objectTypeName?: string;
    objectTypeLabel?: string;
  }>;
  // 可根据实际需要补充其它字段
}

interface FuncActionDetailProps {
  actionDataId: any;
  onUpdateUseSaveBtn: Function;
}
const FuncActionDetail: React.FC<FuncActionDetailProps> = ({
  actionDataId,
  onUpdateUseSaveBtn,
}) => {
  const [functionCode, setFunctionCode] = useState('');
  const [paramsIn, setParamsIn] = useState<string[]>([]);
  const [actionData, setActionData] = useState<ActionData>({});
  const [form] = Form.useForm();
  const [codeServerVisible, setCodeServerVisible] = useState(false);
  const [codeUrl, setCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rules = {
    actionLabel: [
      {
        required: true,
        message: '请输入中文名称',
      },
      {
        validator: async(value: any, cb: (err?: string) => void) => {
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
    fileName: [
      {
        required: true,
        message: '请选择逻辑存放的代码文件',
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
      setActionData(detailData);
      form.setFieldsValue({
        actionLabel: detailData.actionLabel || '',
        createTime: detailData.createTime || '-',
        actionName: detailData.actionName || '',
        actionDesc: detailData.actionDesc || '',
        ownerId: detailData.ownerId || '',
      });
      setFunctionCode(detailData.functionCode);
      if (detailData.inputParam) {
        setParamsIn(Object.keys(JSON.parse(detailData.inputParam)));
      }
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
    <Spin loading={loading} className="function-action-detail">
      <div className="function-action-overview" ref={containerRef}>
        <Alert
          style={{ overflow: 'clip' }}
          content="本体设计中的函数均为只读状态，您可以在函数编辑器中编写和修改函数。"
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
              <Button size="mini" type="outline" onClick={() => handleGoDev()}>
                动作开发
              </Button>
            </div>
          }
        />
        <div className="overview-wrap">
          <div className="base-info function-overview-item border-item">
            <div className="func-title">动作基础信息</div>
            <Form form={form} layout="vertical" className="base-info-form">
              <div className="gird">
                <FormItem label="中文名称" field="actionLabel" rules={rules.actionLabel}>
                  <Input placeholder="请输入逻辑类型的中文名称" maxLength={100} showWordLimit/>
                </FormItem>
                <FormItem label="存储路径" field="createTime">
                  <div className="form-text-field">
                    {actionData?.storagePath|| '-'}
                  </div>
                </FormItem>
                <FormItem disabled label="英文名称" field="actionName" rules={rules.actionName}>
                  <Input placeholder="请输入逻辑类型的英文名称" maxLength={100} showWordLimit/>
                </FormItem>
                <FormItem label="创建时间" field="createTime">
                  <div className="form-text-field">{actionData?.createTime || '-'}</div>
                </FormItem>
                <FormItem disabled label="描述" field="actionDesc">
                  <Input.TextArea
                    placeholder="请输入描述"
                    maxLength={200}
                    showWordLimit
                    style={{ height: '62px' }}
                  />
                </FormItem>
                <FormItem label="创建人" field="ownerId">
                  <div className="form-text-field">{actionData?.ownerId || '-'}</div>
                </FormItem>
              </div>
            </Form>
          </div>
          <div className="func-detail function-overview-item border-item">
            <div className="func-title">动作预览</div>
            <div className="func-code-view">
              {functionCode ? (
                // 带行号的只读代码块
                (() => {
                  const codeString = functionCode || '';
                  const codeLines = codeString.split('\n');
                  return (
                    <div style={{ display: 'flex' }}>
                      <div className="func-code-view-index">
                        {codeLines.map((_: any, idx: number) => (
                          <div style={{ height: 20, lineHeight: '20px' }}>{idx + 1}</div>
                        ))}
                      </div>
                      <pre style={{ margin: 0, flex: 1 }}>
                        <code>
                          {codeLines.map((line: any, idx: any) => (
                            <div style={{ height: 20, lineHeight: '20px' }}>{line}</div>
                          ))}
                        </code>
                      </pre>
                    </div>
                  );
                })()
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
                      <img src={emptyIcon} alt="此函数没有代码信息" />
                    </div>
                  }
                  description="此函数没有代码信息"
                  style={{ paddingTop: '50px' }}
                />
              )}
            </div>
          </div>
          <div className="func-param function-overview-item border-item">
            <div className="func-title">入参</div>
            <div className="func-param-item">
              {paramsIn.length > 0 ? (
                paramsIn.map((item: any) => (
                  <div className="params-item">
                    <IconInputParametersColor />
                    {item}
                  </div>
                ))
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
                      <img src={emptyIcon} alt="此函数没有入参信息" />
                    </div>
                  }
                  description="此函数没有入参信息"
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

export default FuncActionDetail;
