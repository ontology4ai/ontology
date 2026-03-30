import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
    Form, Tooltip,
    Select, Input,
    Button, Table,
    TableColumnProps,
    Modal, Checkbox,Radio,
    Space, Tag, Message,Alert,Grid,
    Typography
} from '@arco-design/web-react';
import i18n from '../../locale';


import './index.less';
import {
    IconSearchColor,
    IconInformationColor,
    IconCalendarColor,
    IconCounterColor,
    IconDataIntegrationColor,
    IconTextareaColor,
    IconUnitMgrColor,
    IconHelpColor, IconDataResDirColor
} from "modo-design/icon";

import IconExDependencyMgrColor from '@/pages/action-modal/images/exdependency-mgr-color.svg'


import {getObjectDetail} from "@/pages/action-modal/api";
const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;
const { Row, Col } = Grid;

const typeOptions = [
    {value:'string',label:'字符型'},
    {value:'int',label:'整数型'},
    {value:'decimal',label:'浮点数型'},
    {value:'date',label:'日期型'},
    {value:'bool',label:'布尔型'},
];
const mapOptions = [
    {value: 1, label: '用户输入',desc:'允许用户自由输入'},
    {value: 2, label: '多项选择',desc:'允许用户从固定的选项中选择'},
    {value: 3, label: '静态值',desc:'动作执行时更新当前属性为静态值'},
  /*  {value: 4, label: '默认当前用户',desc:'动作执行时自动将当前属性填充为用户账号，用户不可修改'},
    {value: 5, label: '默认执行时间',desc:'动作执行时自动将当前属性填充为执行时间，用户不可修改'},
    {value: 6, label: '系统生成',desc:'无需用户选填，由系统默认生成，如唯一标识符或版本'},*/
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
const attrConfig = forwardRef((props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const columns1: TableColumnProps[] = [
        {
            title: '属性',
            dataIndex: 'attributeName',
            render: (col, record, index) => (
              <Space size='mini'>
                  {renderIcon(record.fieldType)}
                  <Typography.Text ellipsis={{ showTooltip: true }}>
                      {record.attributeName}
                  </Typography.Text>
                  {record.isPrimaryKey? <Tag size='small' bordered color='arcoblue'>Primary key</Tag>:''}
                  {record.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
              </Space>
            )
        },
        {
            title: '映射参数',
            dataIndex: 'map',
            width:270,
            render: (col, record, index) => (
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
                        <Option value='' key='-1' disabled className='select-desc'>
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
            )
        },
        {
            title: loginT('操作'),
            dataIndex: 'handle',
            width:160,
            render: (col, record, index) => {
                return    <Button type='text' onClick={()=>deleteTableData1(record)}>删除</Button>

            }
        },
    ];
    const columns2: TableColumnProps[] = [
        {
            title: '属性',
            dataIndex: 'attributeName',
            render: (col, record, index) => (
              <Space  size='mini'>
                  {renderIcon(record.fieldType)}
                  <Typography.Text ellipsis={{ showTooltip: true }}>
                      {record.attributeName}
                  </Typography.Text>
                  {record.isPrimaryKey? <Tag size='small' bordered color='arcoblue'>Primary key</Tag>:''}
                  {record.isTitle? <Tag size='small' bordered color='cyan'>Title</Tag>:''}
              </Space>
            )
        },
        {
            title: '映射参数',
            dataIndex: 'map',
            width:270,
            render: (col, record, index) => (
              <div className='map-tr'>
                  <Select key={index}
                          defaultValue='1'
                          value={record.map}
                          error={!col}
                          placeholder='请选择'
                          style={{ width: '100%' }}
                          onChange={(value) => {
                              activeTableRowRef.current={...record, 'map': value,index:index};
                             /* if(value=='1'){
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
                      <Option value='' key='-1' disabled className='select-desc'>
                          选择映射类型
                      </Option>
                      {mapOptions.map((item) => (
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
            )
        },
        {
            title: loginT('操作'),
            dataIndex: 'handle',
            width: 200,
            render: (col, record, index) => {
                return <RadioGroup defaultValue='1'
                                   disabled = {record.isPrimaryKey==1||record.isTitle==1}
                                   value={record.paramRequired}
                                   onChange={(value) => {
                                       onChangeRow2(
                                         {
                                             ...record,
                                             'paramRequired': value,
                                         },
                                         index,
                                       );
                                   }}>
                    <Radio value={1}>必填</Radio>
                    <Radio value={0}>不必填</Radio>
                </RadioGroup>
            }
        },
    ];
    const {actionType}=props;
    const [tableData,setTableData]=useState([]);
    const [allAttrData,setAllAttrData]=useState([]);
    const [keySearchValue, setKeySearchValue] = useState('');
    const [popVisible, setPopVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkedFields, setCheckedFields] = useState([]);
    const formRef = useRef();
    const dropdownRef = useRef(null);
    const checkedFieldsRef = useRef([]);
    const allAttrDataRef = useRef(allAttrData);
    const [userInputModalVisible, setUserInputModalVisible] = useState(false);
    const [multiSelectModalVisible, setMultiSelectModalVisible] = useState(false);
    const [staticInputModalVisible, setStaticInputModalVisible] = useState(false);
    const activeTableRowRef = useRef();
    const [formData, setFormData] = useState(defaultFormData);
    const objActionType = actionType?.actionType;
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
    const validate = async ()=>{
        let valid = true;
        const noAttributeNameIndex = tableData.findIndex(item=>!item.map);
        if(noAttributeNameIndex!=-1){
            Message.error('属性不能为空');
            return false;
        }
        return valid;
    };
    const getParamMapingData = ()=>{
        const data = tableData.map(item=>{
            item.attributeId = item.id;
            item.paramType= item.map;
            item.paramName = mapOptions.find(i=>i.value==item.map).label;
            if(item.map == 3){
                item.paramValue = item.static
            }
            return item;
            /*return {
                attributeId:item.id,
                paramType:item.map,
                paramName: mapOptions.find(i=>i.value==item.map).label,
                paramValue:item.map==3?item.static:'',
                paramRequired:item.paramRequired
            }*/
        });
        return data;
    };
    useImperativeHandle(ref, () => ({
        validate,
        getParamMapingData
    }));

    useEffect(() => {
        checkedFieldsRef.current = checkedFields;
    }, [checkedFields]);

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

    useEffect(() => {
        if(actionType?.objectTypeId){
            getAttrlist(actionType?.objectTypeId)
        }
    }, [actionType?.objectTypeId]);

    useEffect(()=>{

        allAttrDataRef.current = allAttrData;

        if(objActionType=='update'){
            const table = allAttrData.filter(item=>item.disabled&&item.isPrimaryKey!==1);
            setTableData(table);
        }
        if(objActionType == 'create'){
            const data = JSON.parse(JSON.stringify(allAttrData));
            data.forEach(item => {
                item.map = 1;
                item.paramRequired = 1;
            });
            setTableData(data);
        }

    },[allAttrData,objActionType]);

    const getAttrlist = (id)=>{
        setLoading(true);
        getObjectDetail({id}).then(res=>{
            if(res.data.success){
                const data = res.data.data.attributes;
                if(objActionType == 'update'){
                    //主键属性禁止编辑
                    data.forEach(item=>{
                        if( item.isPrimaryKey==1){
                            item.disabled = true;
                        }
                    })
                }
                setAllAttrData(data)
            }else{
                Message.error('获取属性失败');

            }
        }).finally(()=>{
            setLoading(false);
        })
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
   /* const onChangeRow1 = (row, index) => {
        const allTableIndex = allAttrData.findIndex(item=>item.COLUMN_NAME == row.COLUMN_NAME);
        const newAllTable = [...allAttrData];
        newAllTable[allTableIndex] = row;
        setAllAttrData(newAllTable);
    }*/
    const onChangeRow2 = (row, index) => {
        const newData = [...tableData];
        newData[index] = row;
        setTableData(newData);
    };
    const deleteTableData1 = (row)=>{
        const newData = [...allAttrData];
        newData.forEach(item=>{
            if(item.id == row.id){
                item.disabled = false;
            }
        });
        setAllAttrData([...newData])
    };
    /*const deleteTableData2 = (row,index)=>{
        const newData = [...tableData];
        newData.splice(index,1);
        setTableData(newData);
    };*/
    const keySearch = (val)=>{
        setKeySearchValue(val);
    };

    const renderIcon = (option) => {
        let labelIcon = '';
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

    const filterAttrData =allAttrData.filter(item=>item.attributeName.toLowerCase().includes(keySearchValue.trim().toLowerCase()));
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
    return (
      <div className='mapConfig-container' style={{display: props.isShow? 'flex' : 'none'}}>
            <div className="map-obj-container">
                <div className="map-setting-head">
                    对象类型
                </div>
                <div className="obj-content">
                    <Space size='mini'><IconDataResDirColor/>
                    <Typography.Text ellipsis={{ showTooltip: true }}>
                        {actionType?.objData?.objectTypeLabel}
                    </Typography.Text>
                    </Space>
                </div>
            </div>
           <div className="map-setting-container">
               <div className="map-setting-head">
                   属性
               </div>
               {objActionType == 'update'
                 ?
                 <div ref = {dropdownRef} className='map-add-pop' >
                     <Button className='map-add-btn' onClick={() => {
                         setPopVisible(!popVisible);
                         setKeySearchValue('')
                     }}>+ 添加属性</Button>
                     {popVisible?<div className='object-map-pop demo-trigger-popup' key={popVisible}>

                         <div className="map-list-container">
                             <Input
                               key={popVisible}
                               prefix={<IconSearchColor />}
                               allowClear
                               placeholder={loginT('请输入')}
                               value={keySearchValue}
                               className='search-input' onChange={(v)=>{keySearch(v)}}
                             />
                             <div className="map-list-content">
                                 <div className="oper">
                                     <Button type='text' onClick={()=>{setCheckedFields(filterAttrData.filter(item=>!item.disabled)?.map(i=>i.id))}}>全选</Button>
                                     <Button type='text' status='danger' onClick={()=>setCheckedFields([])}>清空</Button>
                                 </div>
                                 <Checkbox.Group value={checkedFields} onChange={val=>setCheckedFields(val)}>
                                     {filterAttrData.map((item) => {
                                         return (
                                           <Checkbox key={item.id} value={item.id} disabled={item.disabled}>
                                               {({ checked }) => {
                                                   return (
                                                     <Space
                                                       size='mini'
                                                       align='start'
                                                       className='custom-checkbox-card'
                                                     >

                                                         <Checkbox checked={checked}><Space size='mini' className='custom-checkbox-card-title'>
                                                             {renderIcon(item.fieldType)}
                                                             <span className='attr-name'>{item.attributeName}</span>

                                                             {item.isPrimaryKey ?<Tag size='small' bordered color='arcoblue'>Primary key</Tag> : ''}
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
                     </div>:''}


                 </div> : ''}

               {objActionType!=='delete'?<div className="map-table">
                   <Table
                     loading={loading}
                     columns={objActionType == 'update' ? columns1 : columns2}
                     data={tableData}
                     scroll={{
                         x: false,
                         y: objActionType == 'update' ? 406 : 446
                     }}
                     pagination={false}/>
               </div>:''}
               {objActionType=='delete'?<Alert className='action-alert' icon={<IconInformationColor/>} content='删除动作将允许用户删除当前对象类型的任意对象实例。' />:''}
           </div>

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
            className='map-modal'
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
            className='map-modal'>
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
      </div>
    )
});


export default attrConfig;
