import {
  Alert,
  Button,
  Input,
  Form,
  Message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  TableColumnProps,
  Tag,
  Typography, Checkbox, Tooltip,
} from '@arco-design/web-react';
import {
  IconCalendarColor,
  IconCounterColor,
  IconDataIntegrationColor,
  IconDataResDirColor,
  IconDeleteColor,
  IconEditColor, IconHelpColor,
  IconInformationColor,
  IconPlateCreatedColor, IconSearchColor,
  IconTextareaColor,
  IconUnitMgrColor,
} from 'modo-design/icon';
import React, {useEffect, useRef, useState} from 'react';
import { updateAction } from '../api/index';
import './style/action-edit-modal.less';
import {getObjectDetail} from "@/pages/action-modal/api";
import IconExDependencyMgrColor from "@/pages/action-modal/images/exdependency-mgr-color.svg";

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const { Option } = Select;

const actionTypeMap = {
  create: {
    icon: <IconPlateCreatedColor />,
    name: '创建对象',
    label: '设置动作类型可新建对象实例',
  },
  update: {
    icon: <IconEditColor />,
    name: '修改对象（可批量）',
    label: '设置动作类型可编辑对象实例',
  },
  delete: {
    icon: <IconDeleteColor />,
    name: '删除对象（可批量）',
    label: '设置动作类型可删除对象实例',
  },
};

// 映射参数选项
const mapOptions = [
  { value: 1, label: '用户输入', desc: '允许用户自由输入' },
  { value: 2, label: '多项选择', desc: '允许用户从固定的选项中选择' },
  { value: 3, label: '静态值', desc: '动作执行时更新当前属性为静态值' },
];
const defaultFormData = {
  setDefault: false,
  defaultValue: '',
  limitMax: false,
  maxLength: '',
  limitMin: false,
  minLength: '',
  useRegex: false,
  regexPattern: ''
};
interface ActionEditModalProps {
  visible: boolean;
  action: any;
  onCancel: () => void;
  onSuccess: () => void;
}

const ActionEditModal: React.FC<ActionEditModalProps> = ({
  visible,
  action,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState<any[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<any[]>([]);
  const [allAttrData,setAllAttrData]=useState([]);
  const [allAttrGeted,setAllAttrGeted]=useState(false);
  const [currentActionType, setCurrentActionType] = useState<string>('create');
  const [loading, setLoading] = useState<boolean>(false);

  const [popVisible, setPopVisible] = useState(false);
  const [keySearchValue, setKeySearchValue] = useState('');
  const [checkedFields, setCheckedFields] = useState([]);
  const [userInputModalVisible, setUserInputModalVisible] = useState(false);
  const [multiSelectModalVisible, setMultiSelectModalVisible] = useState(false);
  const [staticInputModalVisible, setStaticInputModalVisible] = useState(false);

  const [formData, setFormData] = useState(defaultFormData);
  const formRef = useRef();
  const dropdownRef = useRef(null);
  const checkedFieldsRef = useRef([]);
  const allAttrDataRef = useRef(allAttrData);
  const activeTableRowRef = useRef();
  // 渲染属性图标
  /*const renderIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'string':
        return <IconTextareaColor />;
      case 'int':
        return <IconCounterColor />;
      case 'decimal':
        return <IconDataIntegrationColor />;
      case 'bool':
        return <IconUnitMgrColor />;
      case 'date':
        return <IconCalendarColor />;
      default:
        return null;
    }
  };*/
  const renderIcon = (option) => {
    let labelIcon = null;
    console.log(option);
    switch (option) {
      case 'string':
        labelIcon = <IconTextareaColor/>;
        break;
      case 'int':
        labelIcon = <IconCounterColor/>;
        break;
      case 'decimal':
        labelIcon = <IconDataIntegrationColor/>;
        break;
      case 'bool':
        labelIcon = <IconUnitMgrColor/>;
        break;
      case 'date':
        labelIcon = <IconCalendarColor/>;
        break
    }
    return labelIcon
  };

  // 表格列定义 - 根据动作类型展示不同的列
  const getColumns = (): TableColumnProps[] => {
    const baseColumns: TableColumnProps[] = [
      {
        title: '属性',
        dataIndex: 'attributeName',
        render: (_, record) => (
          <Space size="mini">
            {renderIcon(record.fieldType)}
            <Typography.Text ellipsis={{ showTooltip: true }}>
             {record.attributeName}
            </Typography.Text>
            {record.isPrimaryKey? <Tag size='small' bordered color='arcoblue'>Primary key</Tag>:''}
            {record.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
          </Space>
        ),
      },
      {
        title: '映射参数',
        dataIndex: 'map',
        width: 200,
        render: (col, record,index) => (
          <div className='map-tr'>
            <Select key={index}
                    value={col}
                    error={!col}
                    placeholder='请选择'
                    style={{ width: '100%' }}
                    onChange={(value) => {
                      activeTableRowRef.current={...record, 'map': value,index:index};
                      /*  if(value=='1'){
                            setFormData(defaultFormData);
                            setUserInputModalVisible(true);
                        }*/
                      if(value=='3'){
                        formRef.current?.resetFields();
                        setStaticInputModalVisible(true);
                      }else {
                        onChangeRow2(
                          {
                            ...record,
                            'map': value,
                          },
                          index,
                        );
                      }

                    }}
                    renderFormat={(option, value) => (
                      <Space size='mini' className='map-select-item'>
                        <img src={IconExDependencyMgrColor}/>{mapOptions.find(item=>item.value==value)?.label||value}
                      </Space>)}
            >
              <Option value='' key='-1' disabled className='select-desc action-select-desc'>
                选择映射类型
              </Option>
              {mapOptions.filter(item=>item.value!='6').map((item) => (
                <Option value={item.value} key={item.value}
                        onClick={e => {
                          const text = e.target.innerText.trim();
                          const type = text == '静态值' ? '3' : text == '用户输入' ? '1' : '';
                          if (type == record.map) {
                            if (type == '3') {
                              setStaticInputModalVisible(true);
                              formRef.current.setFieldsValue({...record});
                            }
                          }
                        }}>
                  {item.label} <Tooltip content={item.desc}> <IconHelpColor
                  style={{marginLeft: 3}}/></Tooltip>
                </Option>
              ))}
            </Select>
          </div>
          /*<Select
            value={record.map}
            placeholder="请选择"
            style={{ width: '100%' }}
            onChange={value => handleMapChange(record.id, value)}
          >
            {mapOptions.map(item => (
              <Option key={item.value} value={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>*/
        ),
      },
    ];

    // 根据动作类型添加操作列
    if (currentActionType === 'update') {
      return [
        ...baseColumns,
        {
          title: '操作',
          dataIndex: 'handle',
          width: 160,
          render: (_, record) => (
            <Button type="text" onClick={() => deleteTableData1(record)}>
              删除
            </Button>
          ),
        },
      ];
    }
    if (currentActionType === 'create') {
      return [
        ...baseColumns,
        {
          title: '操作',
          dataIndex: 'handle',
          width: 200,
          render: (_, record) => (
            <RadioGroup
              value={record.paramRequired}
              onChange={value => handleRequiredChange(record.id, value)}
              disabled={record.isPrimaryKey === 1 || record.isTitle === 1}
            >
              <Radio value={1}>必填</Radio>
              <Radio value={0}>不必填</Radio>
            </RadioGroup>
          ),
        },
      ];
    }

    return baseColumns;
  };

  const handleMapChange = (id: string, value: number) => {
    setTableData(prev => prev.map(item => (item.id === id ? { ...item, map: value } : item)));
  };

  const handleRequiredChange = (id: string, value: number) => {
    setTableData(prev =>
      prev.map(item => (item.id === id ? { ...item, paramRequired: value } : item)),
    );
  };

  const handleDeleteAttribute = (id: string) => {
    setTableData(prev => prev.filter(item => item.id !== id));
    const deletedAttribute = tableData.find(item => item.id === id);
    if (deletedAttribute) {
      setAvailableAttributes(prev => [...prev, deletedAttribute]);
    }
  };
  const deleteTableData1 = (row)=>{
    const newData = [...allAttrData];
    newData.forEach(item=>{
      if(item.attributeId == row.attributeId){
        item.disabled = false;
      }
    });
    setAllAttrData([...newData]);
  };

  const handleAddAttribute = () => {
    if (availableAttributes.length > 0) {
      const attributeToAdd = availableAttributes[0];
      setTableData(prev => [...prev, { ...attributeToAdd, map: 1, paramRequired: 1 }]);
      setAvailableAttributes(prev => prev.slice(1));
    } else {
      Message.info('没有更多可用属性');
    }
  };

  useEffect(() => {
    if (visible && action && allAttrGeted) {
      const actionType = action.actionType || 'create';
      form.setFieldsValue({
        actionName: action.actionName,
        objectTypeLabel: action.objectType?.objectTypeLabel,
        actionType: actionType,
      });
      setCurrentActionType(actionType);

      if (action.params) {
        const data = action.params.map((param: any) =>{
          const attr = allAttrData.find(item=>item.id == param.attributeId);
          return {
          ...param,
          //id: param.attributeId,
          fieldType:param.fieldType||attr?.fieldType,
          attributeName: param.attributeName,
          map: param.paramType || 1,
          paramRequired: param.paramRequired !== undefined ? param.paramRequired : 1,
          isPrimaryKey: attr?.isPrimaryKey,
          isTitle: attr?.isTitle
        }});
        setTableData(data);
        if(actionType == 'update'){
          const attrData = allAttrData.map(item=>{
            const checkedAttr = data.find(param=>param.attributeId == item.attributeId);
            if(checkedAttr){
              item = {...checkedAttr,...item,id:checkedAttr.id};
              item.disabled = true;

            }else if( item.isPrimaryKey == 1){
              item.disabled = true;
            }
            return item
          });
          setAllAttrData([...attrData]);
        }
      }

    }
  }, [visible, action, allAttrGeted]);

  useEffect(() => {
    if(action?.objectType?.id){
      getAttrlist(action.objectType.id)
    }
  }, [action]);
  const onChangeRow2 = (row, index) => {
    const newData = [...tableData];
    newData[index] = row;
    setTableData(newData);
  };
  const setRowStaticData = async ()=>{
    try {
      await formRef.current.validate();
      const data = formRef.current.getFieldsValue();
      onChangeRow2({...activeTableRowRef.current,...data},activeTableRowRef.current.index);
      setStaticInputModalVisible(false);
    }catch(e){

    }
  };
  const setRowUserInputData = async ()=>{
    try {
      await formRef.current.validate();
      const data = formRef.current.getFieldsValue();
      onChangeRow2({...activeTableRowRef.current,...data},activeTableRowRef.current.index);
      setStaticInputModalVisible(false);
    }catch(e){

    }
  };
  const getAttrlist = (id)=>{
    getObjectDetail({id}).then(res=>{
      if(res.data.success){
        const data = res.data.data?.attributes;
        data?.forEach(item=>{
          item.attributeId = item.id;
        });
        data && setAllAttrData(data)
      }else{
        Message.error('获取属性失败');

      }
    }).finally(()=>{
      setAllAttrGeted(true);
    })
  };
  const keySearch = (val)=>{
    setKeySearchValue(val);
  };
  const handleCheckboxChange = (key, checked) => {
    setFormData(prev => ({
      ...prev,
      [key]: checked
    }));
  };
  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const handleCheckFields =()=>{
    if(checkedFieldsRef.current?.length>0){
      const newData = [...allAttrDataRef.current];  // 使用 ref 获取最新值
      newData.forEach(item=>{
        if(checkedFieldsRef.current.includes(item.id)){
          item.disabled = true;
          item.map = 1;
        }
      });
      setAllAttrData([...newData]);
      setCheckedFields([]);
    }
  };
  useEffect(() => {
    checkedFieldsRef.current = checkedFields;
  }, [checkedFields]);

  useEffect(() => {
    allAttrDataRef.current = allAttrData;
    if(currentActionType=='update'){
      const table = allAttrData.filter(item=>item.disabled&&item.isPrimaryKey!==1);
      setTableData(table);
    }
  }, [allAttrData]);
  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleCheckFields();
        setPopVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleOk = async () => {
    try {
      setLoading(true);
      const values = await form.validate();
      const data = tableData.map(item=>{
        item.paramType= item.map;
        item.paramName = mapOptions.find(i=>i.value==item.map).label;
        if(item.map == 3){
          item.paramValue = item.static
        }
        return item;
      });
      updateAction(action.id, {
        ...action,
        objectTypeId: action.objectType.id,
        ontologyId: action.ontology.id,
        actionType: values.actionType,
        params: values.actionType=='delete'?[]:data,
      })
        .then((res: any) => {
          if (res.data.success) {
            Message.success('保存成功');
            onSuccess();
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      setLoading(false);
    }
  };

  const handleActionTypeChange = (value: string) => {
    form.setFieldsValue({ actionType: value });
    setCurrentActionType(value);


    if(value=='update'){
      const table = allAttrData.filter(item=>item.disabled&&item.isPrimaryKey!==1);
      setTableData(table);
    }
    if(value == 'create'){
      const data = JSON.parse(JSON.stringify(allAttrData));
      data.forEach(item => {
        item.map = 1;
        item.paramRequired = 1;
      });
      setTableData(data);
    }



  };
  const filterAttrData =allAttrData.filter(item=>item.attributeName.toLowerCase().includes(keySearchValue.trim().toLowerCase()));
  return (
    <Modal
      title="编辑动作"
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      className="action-edit-modal"
    >
      <Form form={form} layout="vertical">
        <FormItem label="对象类型" field="objectTypeLabel">
          <Input disabled prefix={<IconDataResDirColor />}></Input>
          {/* <Select placeholder="请选择对象类型" disabled>
            {action?.objectType && (
              <Option value={action.objectType.id} key={action.objectType.id}>
                <Space size="mini">{}</Space>
              </Option>
            )}
          </Select> */}
        </FormItem>
        <FormItem
          label="对象动作"
          field="actionType"
          rules={[
            {
              required: true,
              message: '请选择对象动作',
            },
          ]}
        >
          <RadioGroup
            name="card-radio-group"
            className="action-type-radio-group"
            value={form.getFieldValue('actionType')}
            onChange={handleActionTypeChange}
          >
            {(Object.keys(actionTypeMap) as Array<keyof typeof actionTypeMap>).map(item => {
              return (
                <Radio key={item} value={item}>
                  {({ checked }) => {
                    return (
                      <Space
                        align="start"
                        className={`custom-radio-card ${
                          checked ? 'custom-radio-card-checked' : ''
                        }`}
                      >
                        <div className="custom-radio-card-mask">
                          <div className="custom-radio-card-mask-dot"></div>
                        </div>
                        <div className="radio-content">
                          <div className="action-icon">{actionTypeMap[item].icon}</div>
                          <div>
                            <div className="custom-radio-card-title">
                              {actionTypeMap[item].name}
                            </div>
                            <Typography.Text type="secondary">
                              {actionTypeMap[item].label}
                            </Typography.Text>
                          </div>
                        </div>
                      </Space>
                    );
                  }}
                </Radio>
              );
            })}
          </RadioGroup>
        </FormItem>

        {currentActionType !== 'delete' ? (
          <div className="attributes-section">
            <div className="section-title">属性</div>
            {currentActionType === 'update' && (
              <div ref = {dropdownRef} className='map-add-pop'>
                <Button type="secondary" style={{width: '100%'}} onClick={()=>{
                  setPopVisible(!popVisible);
                  setKeySearchValue('');
                  //handleAddAttribute()
                  }}>
                  + 添加属性
                </Button>
                {popVisible ? <div className='object-map-pop demo-trigger-popup' key={popVisible}>

                  <div className="map-list-container">
                    <Input
                      key={popVisible}
                      prefix={<IconSearchColor/>}
                      allowClear
                      placeholder='请输入'
                      value={keySearchValue}
                      className='search-input' onChange={(v) => {
                      keySearch(v)
                    }}
                    />
                    <div className="map-list-content">
                      <div className="oper">
                        <Button type='text' onClick={() => {
                          setCheckedFields(filterAttrData.filter(item => !item.disabled)?.map(i => i.attributeId))
                        }}>全选</Button>
                        <Button type='text' status='danger' onClick={() => setCheckedFields([])}>清空</Button>
                      </div>
                      <Checkbox.Group value={checkedFields} onChange={val => setCheckedFields(val)}>
                        {filterAttrData.map((item) => {
                          return (
                            <Checkbox key={item.attributeId} value={item.attributeId} disabled={item.disabled}>
                              {({checked}) => {
                                return (
                                  <Space
                                    size='mini'
                                    align='start'
                                    className='custom-checkbox-card'
                                  >

                                    <Checkbox checked={checked}><Space size='mini'
                                                                       className='custom-checkbox-card-title'>
                                      {renderIcon(item.fieldType)}
                                      {item.attributeName}
                                      {item.isPrimaryKey ?
                                        <Tag size='small' bordered color='arcoblue'>Primary key</Tag> : ''}
                                      {item.isTitle ? <Tag size='small' bordered color='cyan'>Title</Tag> : ''}
                                    </Space></Checkbox>
                                  </Space>
                                );
                              }}
                            </Checkbox>
                          );
                        })}
                      </Checkbox.Group>
                    </div>
                  </div>
                </div> : ''}</div>
            )}
            <Table
              columns={getColumns()}
              data={tableData}
              scroll={{ x: false, y: 250 }}
              pagination={false}
              rowKey="id"
            />
          </div>
        ) : (
          <Alert
            type="info"
            icon={<IconInformationColor />}
            content="删除动作将允许用户删除当前对象类型的任意对象实例。"
          />
        )}
      </Form>
      <Modal
        title={
          <div style={{ textAlign: 'left',fontWeight:600 }}>
            用户输入配置
          </div>
        }
        visible={userInputModalVisible}
        onOk={setRowUserInputData}
        onCancel={() => setUserInputModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        className='action-map-modal'
      >
        <div className="multi-option-form">
          <Form
            key={userInputModalVisible}
            ref={formRef}
            autoComplete='off'
            layout='vertical'>
            {/* 设置默认值 */}
            <div className="option-item">
              <Space direction='vertical'>
                <div className="check-label">
                  <Checkbox
                    checked={formData.setDefault}
                    onChange={(checked) => handleCheckboxChange('setDefault', checked)}
                  >
                    <div className="option-label">设置默认值</div></Checkbox>
                </div>
                <FormItem field='defaultValue' rules={[{
                  required: formData.setDefault,
                  message: '请设置默认值'
                }]}>
                  <Input
                    placeholder="请输入"
                    value={formData.defaultValue}
                    onChange={(value) => handleInputChange('defaultValue', value)}
                    className="option-input"
                  />
                </FormItem>
              </Space>
            </div>

            {/* 限制最大长度 */}
            <div className="option-item">
              <Space direction='vertical'>
                <div className="check-label">
                  <Checkbox
                    checked={formData.limitMax}
                    onChange={(checked) => handleCheckboxChange('limitMax', checked)}
                  >
                    <div className="option-label">限制最大长度</div></Checkbox>
                </div>
                <FormItem field='maxLength' rules={[{
                  required: formData.limitMax,
                  message: '请输入限制最大长度'
                }]}>
                  <Input
                    placeholder="请输入"
                    value={formData.maxLength}
                    onChange={(value) => handleInputChange('maxLength', value)}
                    className="option-input"
                  />
                </FormItem>
              </Space>
            </div>

            {/* 限制最小长度 */}
            <div className="option-item">
              <Space direction='vertical'>
                <div className="check-label">
                  <Checkbox
                    checked={formData.limitMin}
                    onChange={(checked) => handleCheckboxChange('limitMin', checked)}
                  >
                    <div className="option-label">限制最小长度</div></Checkbox>
                </div>
                <FormItem field='minLength' rules={[{
                  required: formData.limitMin,
                  message: '请输入限制最小长度'
                }]}>
                  <Input
                    placeholder="请输入"
                    value={formData.minLength}
                    onChange={(value) => handleInputChange('minLength', value)}
                    className="option-input"
                  />
                </FormItem>
              </Space>
            </div>

            {/* 满足正则 */}
            <div className="option-item">
              <Space direction='vertical'>
                <div className="check-label">
                  <Checkbox
                    checked={formData.useRegex}
                    onChange={(checked) => handleCheckboxChange('useRegex', checked)}
                  >
                    <div className="option-label">满足正则</div></Checkbox>
                </div>
                <FormItem field='regexPattern' rules={[{
                  required: formData.useRegex,
                  message: '请输入满足正则'
                }]}>
                  <Input
                    placeholder="请输入"
                    value={formData.regexPattern}
                    onChange={(value) => handleInputChange('regexPattern', value)}
                    className="option-input"
                  />
                </FormItem>
              </Space>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        title={
          <div style={{textAlign: 'left', fontWeight: 600}}>
            静态值配置
          </div>
        }
        visible={staticInputModalVisible}
        onOk={setRowStaticData}
        onCancel={() => setStaticInputModalVisible(false)}
        autoFocus={false}
        focusLock={true}
        className='action-map-modal'>
        <div className="multi-option-form">
          <Form
            ref={formRef}
            autoComplete='off'
            layout='vertical'>
            <FormItem label='静态值' field='static' rules={[{
              required: false,
              message: '请输入静态值'
            }]}>
              <Input
                placeholder="请输入"
                className="option-input"
              />
            </FormItem>
          </Form>
        </div>
      </Modal>

      <Modal
        title={
          <div style={{ textAlign: 'left',fontWeight:600 }}>
            多选项配置
          </div>
        }
        visible={multiSelectModalVisible}
        onOk={() => setMultiSelectModalVisible(false)}
        onCancel={() => setMultiSelectModalVisible(false)}
        autoFocus={false}
        focusLock={true}
      >
        <p>
          You can customize modal body text by the current situation. This modal will be closed
          immediately once you press the OK button.
        </p>
      </Modal>
    </Modal>
  );
};

export default ActionEditModal;
