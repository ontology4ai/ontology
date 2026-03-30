import React, { useState } from 'react';
import {
  Drawer,
  Select,
  Input,
  Button,
  Form,
  Modal,
  Transfer,
  Checkbox,
  Pagination,
  Message,
} from '@arco-design/web-react';
import InfoCircle from './img/InfoCircleFilled.svg';
import './style/index.less';
import draClose from './img/dra-close.svg';
import ObjectIcon from './img/obj-title.png';
import { IconDown, IconPlus, IconSearch, IconLoading } from '@arco-design/web-react/icon';
import { getObjectExploreSummary } from '../api';
import { v4 as uuidv4 } from 'uuid';
import CustomEmpty from '../Empty';
import { lowerCase } from 'lodash';

interface RuleSimulationDrawerProps {
  visible: boolean;
  onCancel: () => void;
  onExecute: (data: any) => void;
  getPopupContainer?: React.RefObject<HTMLElement>;
  afterOpen?: () => void;
  ontologyGraph?: any[];
  selectData?: any;
  objDetail?: any;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; name: string; englishName: string }[];
}

const Option = Select.Option;

// 自定义下拉选择框组件
const CustomSelect = (props: CustomSelectProps) => {
  const { value, onChange, options } = props;
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // 获取当前选中的选项
  const selectedOption = options.find(opt => opt.value === value) || {};

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // 点击外部关闭下拉框
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="custom-select-container" ref={selectRef}>
      {/* 选择框主显示区域 */}
      <div className="custom-select-main" onClick={() => {}}>
        <div className="custom-select-content">
          <img src={ObjectIcon} alt="对象图标" className="custom-select-icon" />
          <div className="custom-select-text">
            <div className="custom-select-name">{selectedOption.name || ''}</div>
            <div className="custom-select-english-name">{selectedOption.englishName || ''}</div>
          </div>
        </div>
        {/* <IconDown className={`custom-select-arrow ${isOpen ? 'open' : ''}`} /> */}
      </div>

      {/* 下拉选项列表 */}
      {isOpen && (
        <div className="custom-select-dropdown">
          {options.map(option => (
            <div
              key={option.value}
              className={`custom-select-option ${option.value === value ? 'active' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              <img src={ObjectIcon} alt="对象图标" className="custom-select-icon" />
              <div className="custom-select-text">
                <div className="custom-select-name">{option.name}</div>
                <div className="custom-select-english-name">{option.englishName}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RuleSimulationDrawer: React.FC<RuleSimulationDrawerProps> = ({
  ontologyGraph,
  visible,
  onCancel,
  onExecute,
  getPopupContainer,
  afterOpen,
  selectData,
  objDetail,
}) => {
  const [form] = Form.useForm();

  // 为Select组件定义新的挂载节点ref
  const actionSelectContainerRef = React.useRef<HTMLDivElement>(null);
  const propertySelectContainerRef = React.useRef<HTMLDivElement>(null);

  // 存储不同selectData.id对应的表单数据缓存
  const formDataCacheRef = React.useRef<Record<string, any>>({});

  // 存储当前正在编辑的selectData.id
  const currentSelectDataIdRef = React.useRef<string | null>(null);

  // 使用selectData找到对应的object节点，然后从该节点的actionRelations生成动作选项数据
  const actionOptions = React.useMemo(() => {
    if (!ontologyGraph || !selectData || !selectData.id) {
      return [];
    }

    // 找到对应的object节点 - 注意：使用elementId匹配，因为selectOptions使用的是elementId作为value
    const objectNode = ontologyGraph.find(
      (node: any) => node.nodeType === 'object' && node.elementId === selectData.id,
    );

    if (!objectNode || !objectNode.actionRelations) {
      return [];
    }

    return objectNode.actionRelations.map((item: any) => ({
      value: item.id,
      label: item.actionLabel,
      signatureDetail: item.signatureDetail, // 保存signatureDetail信息
    }));
  }, [ontologyGraph, selectData]);

  // 存储当前选中的动作
  const [selectedAction, setSelectedAction] = useState<any>(null);

  // 存储穿梭框左边的数据
  const [instanceData, setInstanceData] = useState<any[]>([]);

  // 实例选择弹窗可见状态
  const [instanceModalVisible, setInstanceModalVisible] = useState(false);
  // 实例选择弹窗中的目标值
  const [instanceModalTargetKeys, setInstanceModalTargetKeys] = useState<string[]>([]);

  // 存储上次请求的属性ID和数据，用于优化性能
  const [lastRequestData, setLastRequestData] = useState({
    attributeId: '',
    instanceData: [] as any[],
    targetKeys: [] as string[],
  });

  // 加载状态，用于控制添加实例按钮的图标和禁用状态
  const [isLoading, setIsLoading] = useState(false);

  // 处理实例选择弹窗打开
  const handleInstanceModalOpen = async () => {
    // 获取选中的属性id和selectData的id
    const selectedProperty = form.getFieldValue('selectedProperty');
    const objectTypeId = selectData?.id;

    // 校验是否选择了属性，没有则不打开弹窗
    if (!selectedProperty) {
      Message.info('请先选择属性');
      return;
    }

    // 检查是否正在加载中，如果是则禁止重复点击
    if (isLoading) {
      return;
    }

    // 初始化弹窗中的目标值为当前表单中的值
    const currentValue = form.getFieldValue('selectedInstances') || [];
    setInstanceModalTargetKeys(currentValue);

    // 检查属性ID是否改变，如果没有改变则使用上次的数据，不重新请求
    if (selectedProperty === lastRequestData.attributeId) {
      // 属性ID没有改变，使用上次保存的数据
      setInstanceData(lastRequestData.instanceData);
      setInstanceModalTargetKeys(lastRequestData.targetKeys);
      setInstanceModalVisible(true);
      return;
    }

    if (objectTypeId) {
      try {
        // 设置加载状态为true
        setIsLoading(true);

        // 调用接口获取穿梭框左边的数据
        const response = await getObjectExploreSummary({
          objectTypeId,
          attributeId: selectedProperty,
          limit: 1000,
        });

        // 假设接口返回的数据格式需要转换为Transfer组件要求的格式
        // 实际项目中，根据接口返回的数据结构进行调整
        if (response?.data?.success && response?.data?.data) {
          const data = response.data.data.map((item: any) => ({
            ...item,
            key: 'option_' + item.value, // 使用value生成key
            value: String(item.value), // 将value转换为字符串，确保搜索功能正常
            metaData: item.value, // 保存原始元数据，可能是number类型
          }));
          setInstanceData(data);
          // 保存本次请求的数据
          setLastRequestData({
            attributeId: selectedProperty,
            instanceData: data,
            targetKeys: currentValue,
          });
        }
      } catch (error) {
        console.error('获取实例数据失败:', error);
      } finally {
        // 无论请求成功还是失败，都设置加载状态为false
        setIsLoading(false);
      }
    }

    setInstanceModalVisible(true);
  };

  // 处理实例选择弹窗确认
  const handleInstanceModalConfirm = () => {
    // 将弹窗中的目标值更新到表单
    form.setFieldValue('selectedInstances', instanceModalTargetKeys);

    // 保存当前的穿梭框数据
    const selectedProperty = form.getFieldValue('selectedProperty');
    if (selectedProperty) {
      setLastRequestData(prev => ({
        ...prev,
        targetKeys: instanceModalTargetKeys,
      }));
    }

    setInstanceModalVisible(false);
  };

  // 处理实例选择弹窗关闭
  const handleInstanceModalClose = () => {
    // 保存当前的穿梭框数据
    const selectedProperty = form.getFieldValue('selectedProperty');
    if (selectedProperty) {
      setLastRequestData(prev => ({
        ...prev,
        targetKeys: instanceModalTargetKeys,
      }));
    }

    setInstanceModalVisible(false);
  };

  // 解析signatureDetail为表单字段
  const formFields = React.useMemo(() => {
    if (!selectedAction?.signatureDetail) {
      return [];
    }

    try {
      // 检查signatureDetail是否为字符串，如果是则解析为对象
      const signatureData =
        typeof selectedAction.signatureDetail === 'string'
          ? JSON.parse(selectedAction.signatureDetail)
          : selectedAction.signatureDetail;

      return Object.keys(signatureData).map(key => {
        const param = signatureData[key];
        return {
          name: key,
          label: param.label || key,
          type: param.type ? lowerCase(param.type) : typeof param,
          isRequired: param.is_required || false,
          desc: param.desc || '',
        };
      });
    } catch (error) {
      console.error('解析signatureDetail失败:', error);
      return [];
    }
  }, [selectedAction]);

  const attrId = Form.useWatch('selectedProperty', form);

  // 监听属性选择变化，当属性变化时清空已选实例
  React.useEffect(() => {
    const checkPropertyChange = () => {
      const selectedProperty = form.getFieldValue('selectedProperty');
      if (selectedProperty && selectedProperty !== lastRequestData.attributeId) {
        // 属性变化时，清空已选实例
        form.setFieldValue('selectedInstances', []);
        // 清空实例选择弹窗中的目标值
        setInstanceModalTargetKeys([]);
        // 同时清空lastRequestData中的targetKeys
        setLastRequestData(prev => ({
          ...prev,
          targetKeys: [],
        }));
      }
    };

    checkPropertyChange();
  }, [attrId, lastRequestData.attributeId]);

  // 监听selectData变化，保存当前表单数据到缓存中，并恢复新selectData.id对应的缓存数据
  React.useEffect(() => {
    if (selectData && selectData.id) {
      // 1. 保存当前表单数据到缓存中（如果当前有正在编辑的selectData.id）
      if (currentSelectDataIdRef.current) {
        const currentFormData = form.getFieldsValue();
        formDataCacheRef.current = {
          ...formDataCacheRef.current,
          [currentSelectDataIdRef.current]: {
            formData: currentFormData,
            instanceData: instanceData,
            lastRequestData: lastRequestData,
          },
        };
      }

      // 2. 更新当前正在编辑的selectData.id
      currentSelectDataIdRef.current = selectData.id;

      // 3. 从缓存中获取新selectData.id对应的表单数据
      const cachedData = formDataCacheRef.current[selectData.id];

      if (cachedData) {
        // 恢复缓存的表单数据
        form.setFieldsValue(cachedData.formData);
        // 恢复缓存的实例数据和请求数据
        setInstanceData(cachedData.instanceData);
        setLastRequestData(cachedData.lastRequestData);
        // 更新selectedAction
        const executeActionValue = cachedData.formData.executeAction;
        if (executeActionValue) {
          const action = actionOptions.find(opt => opt.value === executeActionValue);
          setSelectedAction(action);
        } else {
          setSelectedAction(null);
        }
      } else {
        // 没有缓存数据，使用默认值
        // 清空表单数据
        form.resetFields();

        // 设置当前选中对象
        form.setFieldsValue({ selectedObject: selectData.id });

        // 如果有actionOptions，默认选择第一个
        if (actionOptions.length > 0) {
          form.setFieldsValue({ executeAction: actionOptions[0].value });
          setSelectedAction(actionOptions[0]);
        } else {
          form.setFieldsValue({ executeAction: undefined });
          setSelectedAction(null);
        }

        // 清空相关状态
        setInstanceData([]);
        setLastRequestData({ attributeId: '', instanceData: [], targetKeys: [] });
      }
    }
  }, [form, selectData, actionOptions]);

  // 监听表单中executeAction字段的变化，更新selectedAction
  React.useEffect(() => {
    const executeActionValue = form.getFieldValue('executeAction');
    if (executeActionValue) {
      const action = actionOptions.find(opt => opt.value === executeActionValue);
      setSelectedAction(action);
    } else {
      setSelectedAction(null);
    }
  }, [form.getFieldValue('executeAction'), actionOptions]);

  // 使用ontologyGraph生成选项数据，只包含对象类型
  const selectOptions = React.useMemo(() => {
    if (!ontologyGraph) {
      return [];
    }
    return ontologyGraph
      .filter(item => item.nodeType === 'object')
      .map(item => ({
        value: item.elementId,
        name: item.label,
        englishName: item.name,
      }));
  }, [ontologyGraph]);

  return (
    <Drawer
      title={null}
      visible={visible}
      onCancel={onCancel}
      focusLock={false}
      autoFocus={false}
      width={400}
      getPopupContainer={() => getPopupContainer && getPopupContainer.current}
      footer={null}
      mask={false}
      className="rule-simulation-drawer node-detail-drawer"
      afterOpen={afterOpen}
    >
      {/* 自定义标头 */}
      <div className="node-detail-drawer-custom-header rule-simulation-drawer-custom-header">
        <div className="title-content">
          <div className="node-detail-drawer-custom-header-title">规则仿真</div>
          <div className="node-detail-drawer-custom-header-close" onClick={onCancel}>
            <img src={draClose} alt="关闭" style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </div>
      <div className="node-detail-drawer-content">
        {/* 顶部提示信息 */}
        <div className="rule-simulation-drawer-property-header-content">
          <img src={InfoCircle} alt="" style={{ marginTop: 2 }} />
          <span style={{ fontSize: '12px', lineHeight: '1.5' }}>
            在开始仿真前请先完成画布排布和所有数据初始化，并保存。
          </span>
        </div>

        <Form form={form} layout="vertical">
          {/* 当前选中对象 */}
          <div className="node-detail-drawer-property">
            <div className="node-detail-drawer-property-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="node-detail-drawer-property-header-icon"></div>
                <span>当前选中对象</span>
              </div>
            </div>
            <Form.Item
              field="selectedObject"
              label=""
              rules={[{ required: true, message: '请选择对象' }]}
            >
              <CustomSelect
                value={form.getFieldValue('selectedObject') || ''}
                onChange={value => form.setFieldValue('selectedObject', value)}
                options={selectOptions}
              />
            </Form.Item>
          </div>
          {/* 选择执行动作 */}
          <div className="node-detail-drawer-property">
            <div className="node-detail-drawer-property-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="node-detail-drawer-property-header-icon"></div>
                <span>选择执行动作</span>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div
                style={{ marginBottom: 12, position: 'relative' }}
                ref={actionSelectContainerRef}
              >
                <Form.Item
                  field="executeAction"
                  label="执行动作"
                  rules={[{ required: true, message: '请选择执行动作' }]}
                >
                  <Select
                    placeholder="请选择动作名称"
                    onChange={value => {
                      // 当选择变化时，更新selectedAction状态
                      const action = actionOptions.find(opt => opt.value === value);
                      setSelectedAction(action);
                    }}
                    showSearch
                    filterOption={(inputValue, option) =>
                      option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                      option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                    }
                    getPopupContainer={() => actionSelectContainerRef.current}
                  >
                    {actionOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
          </div>
          {/* 选择分析范围 */}
          {/* <div className="node-detail-drawer-property">
            <div className="node-detail-drawer-property-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="node-detail-drawer-property-header-icon"></div>
                <span>选择分析范围</span>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div
                style={{ marginBottom: 12, position: 'relative' }}
                ref={propertySelectContainerRef}
              >
                <Form.Item field="selectedProperty" label="选择属性">
                  <Select
                    placeholder="选择目标属性"
                    showSearch
                    filterOption={(inputValue, option) =>
                      option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                      option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                    }
                    getPopupContainer={() => propertySelectContainerRef.current}
                  >
                    {objDetail?.attributes?.map((attr: any) => (
                      <Option key={attr.id} value={attr.id}>
                        {attr.attributeName}
                      </Option>
                    )) || <Option value="property1">属性名称1</Option>}
                  </Select>
                </Form.Item>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Form.Item field="selectedInstances" label="选择实例">
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        已添加{' '}
                        <span style={{ color: '#1890FF' }}>
                          {form.getFieldValue('selectedInstances')?.length || 0}
                        </span>{' '}
                        项实例
                      </span>
                      <div
                        className="add-instance-btn"
                        onClick={handleInstanceModalOpen}
                        style={{
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isLoading ? <IconLoading className="loading-icon" /> : <IconPlus />}
                        <span>{isLoading ? '加载中...' : '添加实例'}</span>
                      </div>
                    </div>
                  </div>
                </Form.Item>
              </div>

              <Modal
                title="添加实例"
                visible={instanceModalVisible}
                onCancel={handleInstanceModalClose}
                footer={[
                  <Button key="cancel" onClick={handleInstanceModalClose}>
                    取消
                  </Button>,
                  <Button key="save" type="primary" onClick={handleInstanceModalConfirm}>
                    保存
                  </Button>,
                ]}
              >
                <Transfer
                  pagination
                  showSearch
                  searchPlaceholder="搜索"
                  dataSource={instanceData}
                  targetKeys={instanceModalTargetKeys}
                  onChange={setInstanceModalTargetKeys}
                  titleTexts={[
                    ({ countTotal, countSelected, checkbox }) => (
                      <>
                        <span style={{ flex: 'none' }}>{checkbox}</span>
                        <span>{countTotal}项</span>
                        <span style={{ flex: 1, textAlign: 'end' }}>全量数据</span>
                      </>
                    ),
                    ({ countTotal, countSelected, checkbox }) => (
                      <>
                        <span style={{ flex: 'none' }}>{checkbox}</span>
                        <span>{countTotal}项</span>
                        <span style={{ flex: 1, textAlign: 'end' }}>目标分析的数据</span>
                      </>
                    ),
                  ]}
                  listStyle={{ height: 300 }}
                />
              </Modal>
            </div>
          </div> */}

          {/* 配置参数 */}
          <div className="node-detail-drawer-property">
            <div className="node-detail-drawer-property-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="node-detail-drawer-property-header-icon"></div>
                <span>配置参数</span>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              {/* 动态生成表单字段 */}
              {formFields.map(field => (
                <div key={field.name} style={{ marginBottom: 12 }}>
                  <Form.Item
                    field={field.name}
                    label={field.label}
                    rules={[
                      { required: field.isRequired, message: `请输入${field.name}` },
                      ...(field.type === 'dict' || field.type === 'list'
                        ? [
                            {
                              validator: (value, callback) => {
                                if (value && typeof value === 'string') {
                                  try {
                                    JSON.parse(value);
                                    callback(); // 验证通过
                                  } catch (e) {
                                    callback(`${field.name} 必须是有效的 JSON 格式`); // 验证失败
                                  }
                                } else {
                                  callback(); // 空值验证通过
                                }
                              },
                            },
                          ]
                        : []),
                    ]}
                  >
                    <Input placeholder={`请输入${field.name}`} maxLength={200} />
                  </Form.Item>
                </div>
              ))}

              {/* 如果没有参数，显示提示 */}
              {formFields.length === 0 && <CustomEmpty />}
            </div>
          </div>
        </Form>
      </div>

      {/* 执行按钮 */}
      <div style={{ textAlign: 'center' }} className="rule-simulation-drawer-execute-button">
        <Button
          type="primary"
          size="large"
          onClick={() => {
            form
              .validate()
              .then(values => {
                // 处理selectedInstances，将key转换为对应的元数据
                const processedSelectedInstances =
                  values.selectedInstances?.map((instanceKey: string) => {
                    const instance = instanceData.find(item => item.key === instanceKey);
                    // 返回元数据，如果没有找到则返回key
                    return instance ? instance.metaData : instanceKey;
                  }) || [];

                // 获取原始数据
                // 提取动态配置参数，将非固定字段放在params中
                const fixedFields = [
                  'selectedObject',
                  'executeAction',
                  'selectedProperty',
                  'selectedInstances',
                ];
                const params = {};
                const fixedValues = {};

                // 遍历values，将固定字段和动态字段分离，并根据类型转换动态字段值
                Object.keys(values).forEach(key => {
                  if (!fixedFields.includes(key)) {
                    // 查找对应的字段定义以获取type信息
                    const fieldDefinition = formFields.find(field => field.name === key);
                    if (fieldDefinition) {
                      const { type } = fieldDefinition;
                      const value = values[key];
                      // 根据type进行数据转换
                      if (type === 'string' || type === 'any') {
                        // string、any -> 字符串
                        params[key] = String(value);
                      } else if (type === 'integer' || type === 'float') {
                        // integer、float -> 数字
                        params[key] = Number(value);
                      } else if (type === 'bool') {
                        // bool -> 布尔值
                        params[key] = Boolean(value);
                      } else if (type === 'dict' || type === 'list') {
                        // dict、list -> JSON转换
                        try {
                          params[key] = JSON.parse(value);
                        } catch (e) {
                          // 如果JSON解析失败，使用原始值
                          params[key] = value;
                        }
                      } else {
                        // 其他类型保持不变
                        params[key] = value;
                      }
                    } else {
                      // 没有找到字段定义，使用原始值
                      params[key] = values[key];
                    }
                  } else {
                    fixedValues[key] = values[key];
                  }
                });

                const originalData = {
                  ...fixedValues,
                  // 将selectedInstances替换为元数据
                  selectedInstances: processedSelectedInstances,
                  // 将动态配置参数包装在params字段中
                  params: params,
                  // 添加原始动作数据
                  originalAction: actionOptions.find(
                    action => action.value === fixedValues.executeAction,
                  ),
                  // 添加原始属性数据
                  originalProperty: objDetail?.attributes?.find(
                    attr => attr.id === fixedValues.selectedProperty,
                  ),
                  // 添加原始实例数据
                  originalInstances: fixedValues.selectedInstances?.map((instanceKey: string) => {
                    const data = instanceData.find(instance => instance.key === instanceKey);
                    return {
                      ...data,
                      value: data?.metaData,
                    };
                  }),
                  // 添加完整的objDetail
                  objDetail: objDetail,
                };
                onExecute(originalData);

                // 更新当前selectData.id的缓存
                if (selectData?.id) {
                  const currentFormData = form.getFieldsValue();
                  formDataCacheRef.current = {
                    ...formDataCacheRef.current,
                    [selectData.id]: {
                      formData: currentFormData,
                      instanceData: instanceData,
                      lastRequestData: lastRequestData,
                    },
                  };
                }

                // 执行成功后关闭抽屉
                onCancel();
              })
              .catch(errorInfo => {
                console.error('表单验证失败:', errorInfo);
              });
          }}
        >
          执行
        </Button>
      </div>
    </Drawer>
  );
};

export default RuleSimulationDrawer;
