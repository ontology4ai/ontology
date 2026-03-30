import {
  logicDetail,
  getLogicDetailByName,
  logicExist,
  syncFunction,
  updateLogic,
} from '@/pages/function-manager/api';
import emptyIcon from '@/pages/object/images/empty.svg';
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Message,
  Space,
  Modal,
  Spin,
  Transfer,
  Tooltip,
  Table,
} from '@arco-design/web-react';
import {
  IconBack,
  IconCaretBottom,
  IconPlus,
  IconDataResDirColor,
  IconInformationColor,
  IconInputParametersColor,
  IconRefreshColor,
  IconTurnDotDeltaColor,
  IconCross,
} from 'modo-design/icon';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import ObjectIcon from '@/components/ObjectIcon';
import './style/index.less';
import { getAllObject } from '@/pages/object/api';
const FormItem = Form.Item;

// 定义 logicData 的类型，包含实际用到的字段
interface LogicData {
  ontologyId?: string;
  ontology?: {
    ontologyLabel?: string;
    ontologyName?: string;
  };
  codeUrl?: string;
  logicTypeLabel?: string;
  createTime?: string;
  logicTypeName?: string;
  logicTypeDesc?: string;
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

interface FuncDetailProps {
  data: any;
  onUpdateUseSaveBtn: Function;
  ontology: any;
}
const FuncDetail = forwardRef<any, FuncDetailProps>(
  ({ data, onUpdateUseSaveBtn, ontology }, ref) => {
    const logicDataId = data.id;
    const [functionCode, setFunctionCode] = useState('');
    const [paramsIn, setParamsIn] = useState<string[]>([]);
    const [paramsOut, setParamsOut] = useState([]);
    const [logicData, setLogicData] = useState<LogicData>({});
    const [form] = Form.useForm();
    const [codeServerVisible, setCodeServerVisible] = useState(false);
    const [codeUrl, setCodeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [objectIds, setObjectIds] = useState<string[]>([]);
    const [selectObjects, setSelectObjects] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const buildType = data.buildType;
    const [apiInfo, setApiInfo] = useState(data.apiInfo || {});

    // 构建嵌套参数结构的函数
    const buildNestedParams = (params: any[]) => {
      const paramMap: Record<string, any> = {};
      const rootParams: any[] = [];

      // 首先将所有参数放入map中
      params.forEach(param => {
        paramMap[param.id] = { ...param, children: [] };
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

    const apiInputParamData =
      apiInfo?.params?.filter((item: any) => item.paramMode === 'request') || [];
    const nestedApiInputParamData = buildNestedParams(apiInputParamData);
    const [apiInputParam, setApiInputParam] = useState(nestedApiInputParamData);

    const apiOutputParamData =
      apiInfo?.params?.filter((item: any) => item.paramMode === 'response') || [];
    const nestedApiOutputParamData = buildNestedParams(apiOutputParamData);
    const [apiOutputParam, setApiOutputParam] = useState(nestedApiOutputParamData);
    const history = useHistory();
    const rules = {
      logicTypeLabel: [
        {
          required: true,
          message: '请输入中文名称',
        },
        {
          validator: async (value: any, cb: (err?: string) => void) => {
            if (logicData.id && logicData.logicTypeLabel === value) {
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
            await logicExist({
              ontologyId: logicData.ontologyId,
              logicTypeLabel: value,
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
      logicTypeName: [
        {
          required: true,
          message: '请输入英文名称',
        },
        {
          validator: async (value: any, cb: (err?: string) => void) => {
            if (logicData.id && logicData.logicTypeName === value) {
              cb();
              return;
            }
            await logicExist({
              ontologyId: logicData.ontologyId,
              logicTypeName: value,
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
      onUpdateUseSaveBtn(data.logicTypeName, false);
      setCodeServerVisible(true);
      setCodeUrl(`${window.location.origin}${logicData.codeUrl}`);
    };
    const getData = () => {
      setLoading(true);
      getLogicDetailByName({ logicTypeName: data.logicTypeName, ontologyId: ontology.id })
        .then(res => {
          if (res.data && res.data.success) {
            const detailData = res.data.data;
            setLogicData(detailData);
            setSelectObjects(detailData.objectTypeList || []);
            setObjectIds(detailData.objectTypeList?.map(item => item.id) || []);
            form.setFieldsValue({
              logicTypeLabel: detailData.logicTypeLabel || '',
              createTime: detailData.createTime || '-',
              logicTypeName: detailData.logicTypeName || '',
              logicTypeDesc: detailData.logicTypeDesc || '',
              ownerId: detailData.ownerId || '',
            });
            setFunctionCode(detailData.functionCode);
            if (detailData.inputParam) {
              setParamsIn(Object.keys(JSON.parse(detailData.inputParam)));
            }
            if (detailData.apiInfo) {
              setApiInfo(detailData.apiInfo);
              const inputParams =
                detailData.apiInfo.params?.filter((item: any) => item.paramMode === 'request') ||
                [];
              setApiInputParam(buildNestedParams(inputParams));
              const outputParams =
                detailData.apiInfo.params?.filter((item: any) => item.paramMode === 'response') ||
                [];
              setApiOutputParam(buildNestedParams(outputParams));
            }
          } else {
            Message.error(res.data?.message || '查询失败');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    };

    const getAllObjects = () => {
      getAllObject({ ontologyId: ontology.id }).then(res => {
        if (res.data.success) {
          const data = res.data.data;
          data.forEach(item => {
            item.key = item.id;
            item.value = item.objectTypeLabel;
          });
          setDataSource(data);
        }
      });
    };
    useImperativeHandle(ref, () => ({
      handleSave,
    }));

    const handleSync = () => {
      setLoading(true);
      syncFunction({
        ontologyId: logicData.ontologyId,
      })
        .then(res => {
          if (res.data.success) {
            Message.success('同步成功');
          }
        })
        .finally(() => {
          setLoading(false);
          getData();
        });
    };
    const handleSave = async callback => {
      let valid = true;
      try {
        await form.validate();
        setLoading(true);
        const formData = form.getFieldsValue();
        const data = {
          // ...logicData,
          logicTypeName: formData.logicTypeName,
          logicTypeLabel: formData.logicTypeLabel,
          logicTypeDesc: formData.logicTypeDesc,
          objectTypeIds: objectIds,
        };
        updateLogic(logicDataId, data)
          .then(res => {
            if (res.data.success) {
              typeof callback === 'function' &&
                callback({
                  type: 'updateTab',
                  tabId: ontology.id,
                  view: 'function',
                  tabName: data.logicTypeLabel,
                });
              Message.success('保存成功！');
              return;
            }
            throw 'err';
          })
          .catch(err => {
            console.log(err);
            Message.error('保存失败！');
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (e) {
        valid = false;
      }
      if (!valid) {
      }
    };
    const addObjectType = () => {
      const ids = selectObjects.map(item => item.id);
      setObjectIds(ids);
      setVisible(true);
    };
    useEffect(() => {
      getData();
      getAllObjects();
    }, [data.logicTypeName]);
    return (
      <Spin loading={loading}>
        <div className="function-overview" ref={containerRef}>
          {buildType !== 'api' && (
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
                      handleSync();
                    }}
                    style={{ marginRight: '8px' }}
                  >
                    <IconRefreshColor />
                    刷新
                  </Button>
                  <Button size="mini" type="outline" onClick={() => handleGoDev()}>
                    逻辑开发
                  </Button>
                </div>
              }
            />
          )}
          <div className="overview-wrap">
            <div className="left">
              <div className="base-info function-overview-item border-item">
                <div className="func-title">逻辑基础信息</div>
                <Form form={form} layout="vertical" className="base-info-form">
                  <div className="gird">
                    <FormItem label="中文名称" field="logicTypeLabel" rules={rules.logicTypeLabel}>
                      <Input placeholder="请输入逻辑类型的中文名称" maxLength={100} showWordLimit />
                    </FormItem>
                    <FormItem label="存储路径" field="createTime">
                      {buildType !== 'api' ? (
                        logicData && logicData?.ontology && logicData?.ontology?.ontologyLabel ? (
                          <div className="form-text-field">{logicData.storagePath || '-'}</div>
                        ) : null
                      ) : (
                        <span>-</span>
                      )}
                    </FormItem>
                    <FormItem label="英文名称" field="logicTypeName" rules={rules.logicTypeName}>
                      <Input
                        disabled
                        placeholder="请输入逻辑类型的英文名称"
                        maxLength={100}
                        showWordLimit
                      />
                    </FormItem>
                    <FormItem label="创建时间" field="createTime">
                      <div className="form-text-field">{logicData?.createTime || '-'}</div>
                    </FormItem>
                    <FormItem disabled label="描述" field="logicTypeDesc">
                      <Input.TextArea
                        placeholder="请输入描述"
                        maxLength={200}
                        showWordLimit
                        style={{ height: '62px' }}
                      />
                    </FormItem>
                    <FormItem label="创建人" field="ownerId">
                      <div className="form-text-field">{logicData?.ownerId || '-'}</div>
                    </FormItem>
                  </div>
                </Form>
              </div>
              {buildType !== 'api' && (
                <div className="func-detail function-overview-item border-item">
                  <div className="func-title">逻辑预览</div>
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
              )}
              {buildType !== 'api' && (
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
                  {/* <div className="func-param-out border-item">
                <div className="func-title">出参</div>
                <div className="func-param-item">
                  {logicData && logicData?.outputParam && logicData?.outputParam.length > 0 ? (
                    <div>{logicData.outputParam}</div>
                  ) : (
                    // logicData.outputParam.map((item: any) => (
                    //   <div className="params-item">
                    //     <IconInputParametersColor />
                    //     {item}
                    //   </div>
                    // ))
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
                          <img src={emptyIcon} alt="此函数没有出参信息" />
                        </div>
                      }
                      description="此函数没有出参信息"
                      style={{ paddingTop: '50px' }}
                    />
                  )}
                </div>
              </div> */}
                </div>
              )}
              {buildType === 'api' && (
                <div className="api-params-box">
                  <div
                    className="func-param function-overview-item border-item"
                    style={{ marginBottom: '16px' }}
                  >
                    <div className="func-title">API详情</div>
                    <div className="func-param-item api-func-param-item">
                      <div className="api-params-item">
                        <div className="api-params-item-title">API名称：</div>
                        <div className="api-params-item-content">{apiInfo?.apiName}</div>
                      </div>
                      <div className="api-params-item">
                        <div className="api-params-item-title">URL地址：</div>
                        <div className="api-params-item-content" title={apiInfo?.url}>
                          {apiInfo?.url}
                        </div>
                      </div>
                      <div className="api-params-item">
                        <div className="api-params-item-title">请求方法：</div>
                        <div className="api-params-item-content">{apiInfo?.apiMethod}</div>
                      </div>
                      <div className="api-params-item">
                        <div className="api-params-item-title">超时时间(ms)：</div>
                        <div className="api-params-item-content">{apiInfo?.apiTimeout}</div>
                      </div>
                      <div className="api-params-item">
                        <div className="api-params-item-title">API描述：</div>
                        <div className="api-params-item-content">{apiInfo?.apiDesc}</div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="func-param function-overview-item border-item"
                    style={{ marginBottom: '16px' }}
                  >
                    <div className="func-title">入参</div>
                    <div className="func-param-item">
                      {apiInputParam.length > 0 ? (
                        <Table
                          data={apiInputParam}
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
                      {apiOutputParam.length > 0 ? (
                        <Table
                          data={apiOutputParam}
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
              )}
            </div>
            <div className="right">
              <div className="title">
                <IconTurnDotDeltaColor />
                引用资源
              </div>
              <div className="label">
                <span className="text">
                  对象类型{' '}
                  <span className="num">
                    {selectObjects && selectObjects.length ? selectObjects.length : 0}
                  </span>
                </span>
                <Button shape="circle" size="mini" onClick={addObjectType} type="text">
                  <IconPlus />
                </Button>
              </div>
              <div className="content">
                {selectObjects && selectObjects.length
                  ? selectObjects.map((item: any) => (
                      <div className="item">
                        <ObjectIcon icon={item.icon || ''} />
                        <Tooltip content={`${item.objectTypeLabel}（${item.objectTypeName}）`}>
                          <span>
                            {' '}
                            {item.objectTypeLabel}（{item.objectTypeName}）
                          </span>
                        </Tooltip>
                      </div>
                    ))
                  : null}
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
                onUpdateUseSaveBtn(data.logicTypeName, true);
                setCodeServerVisible(false);
                getData();
              }}
            >
              <IconBack />
              {/* <span className="text">退出</span> */}
            </Button>
            <iframe src={codeUrl} title="代码服务器页面" />
          </Drawer>
        </div>
        <Modal
          title={<div style={{ textAlign: 'left', fontWeight: 600 }}>选择对象</div>}
          style={{ width: '600px' }}
          visible={visible}
          onOk={() => {
            const selectObjectList = dataSource.filter(item => objectIds.includes(item.key));
            setSelectObjects(selectObjectList);
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
          autoFocus={false}
          focusLock={true}
        >
          <Transfer
            oneWay
            showSearch
            listStyle={{
              width: 240,
              height: 520,
            }}
            key={visible}
            dataSource={dataSource}
            searchPlaceholder="请输入搜索内容"
            defaultTargetKeys={objectIds}
            filterOption={(inputValue, item) => {
              return (
                item.objectTypeName.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
                item.objectTypeLabel.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
              );
            }}
            titleTexts={['对象列表', '已选择列表']}
            onChange={(keys: string[]) => setObjectIds(keys)}
          />
        </Modal>
      </Spin>
    );
  },
);

export default FuncDetail;
