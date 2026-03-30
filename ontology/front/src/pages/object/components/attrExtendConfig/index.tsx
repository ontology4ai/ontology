import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
    Form,
    Select, Input,
    TableColumnProps,
    Space, Typography, Message, Alert, Modal, Button,Dropdown,Menu
} from '@arco-design/web-react';
import i18n from '../../locale';

import './index.less';
import {
    IconAddColor,
    IconServerNodeColor,
    IconBrowsingHistoryColor,
    IconBackupsShareColor,
    IconBrushColor,
    IconCalendarColor,
    IconCounterColor,
    IconDataIntegrationColor,
    IconTextareaColor,
    IconUnitMgrColor,
    IconInformationColor,
    IconSwapRight,
    IconAiColor
} from "modo-design/icon";
const FormItem = Form.Item;
const Option = Select.Option;
const InputSearch = Input.Search;

const typeOptions = [
    {value:'string',label:'字符型'},
    {value:'int',label:'整数型'},
    {value:'decimal',label:'浮点数型'},
    {value:'date',label:'日期型'},
    {value:'bool',label:'布尔型'},
];
const interfaceMapOptions = [
  {value:1,name:'新建一个对象属性',detail:'新建一个对象属性，与接口属性映射，不同步接口属性的修改'},
  {value:2,name:'使用接口属性',detail:'选择一个对象属性，用映射的接口属性将其替换，并同步接口属性的修改'},
  {value:3,name:'使用本地属性',detail:'选择一个对象属性，仅与接口属性建立映射关系，不同步接口属性的修改'},
];
function parseDbType(dbType) {
    if (dbType == null) {
        return "string"; // 默认类型
    }
    // 转成小写并去除空白
    const type = dbType.trim().toLowerCase();

    // String 类型
    if (type.includes("char") || type.includes("text") || type === "uuid" || type === "xml") {
        return "string";
    }

    // Int 类型
    if (
      type.includes("int") ||
      type === "smallint" ||
      type === "integer" ||
      type === "tinyint" ||
      type === "mediumint" ||
      type === "bigint"
    ) {
        return "int";
    }

    // Decimal/Float/Double 类型
    if (
      type.includes("dec") ||
      type.includes("numeric") ||
      type.includes("number") ||
      type.includes("float") ||
      type.includes("real") ||
      type.includes("double")
    ) {
        return "decimal";
    }

    // Date/Time 类型
    if (
      type.includes("date") ||
      type.includes("time") ||
      type === "datetime" ||
      type === "timestamp" ||
      type === "year"
    ) {
        return "date";
    }

    // Boolean 类型
    if (type.includes("bool") || type === "boolean") {
        return "bool";
    }

    // 默认
    return "string";
}

function hasDuplicateProperty(arr, keyToCheck) {
    const seen = {};

    for (const element of arr) {
        const currentValue = element[keyToCheck];
        if(currentValue !== undefined){
            if (currentValue in seen) {
                return true; // 发现重复立刻退出
            } else {
                seen[currentValue] = true;
            }
        }

    }
    return false;
}
const attrExtendConfig = forwardRef((props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [activeListIndex,setActiveListIndex]=useState();
    const [attrModalVisible,setAttrModalVisible]=useState(false);
    const [attrSelectModalVisible,setAttrSelectModalVisible]=useState(false);
    const {attributes,interfaceAttr,interfaceId}=props;  //attrType=1有字段，attrType=2无字段，需要手动添加
    const [interfaceAttrList,setInterfaceList]=useState([]);
    const [attributeList,setAttributeList] = useState([]);
    const [interfaceType,setInterfaceType] = useState(1);
    const formRef = useRef();
    useImperativeHandle(ref, () => ({
        validate,
        getExtendAttr
    }));
    /*useEffect(()=>{
        setInterfaceList(interfaceAttr);
    },[interfaceAttr]);*/
    useEffect(()=>{
        setAttributeList(attributes||[]);
        setInterfaceList(JSON.parse(JSON.stringify(interfaceAttr)));
    },[attributes,interfaceAttr]);
    const getExtendAttr=()=>{
        attributeList.forEach(item=>{
            item.interfaceType = null;
            item.interfaceAttrId = null;
            const interfaceAttr = interfaceAttrList.find(i=>i.attributeName==item.attributeName);
            if(interfaceAttr){
                item.interfaceType = interfaceAttr.interfaceType;
                item.interfaceAttrId = interfaceAttr.id;
            }
        });
        return attributeList
    };
    const validate = async () => {
        let valid = true;
        if (interfaceAttrList.length > 0) {
            /*
              //校验必填项
             interfaceAttrList.forEach(item=>{
                 if(item.isRequired && (!item.attributeName||!item.interfaceType)){
                     valid = false;
                 }
             });
             if(!valid){
                 return false
             }*/
            //校验对象属性是否重复
            let flag = hasDuplicateProperty(interfaceAttrList, 'attributeName');
            if(flag){
                Message.error('对象属性重复');
                return false;
            }
        }
        return valid;
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
    const saveAttr = async () => {
        try {
            await formRef.current.validate();
            const data = formRef.current.getFieldsValue();
            data.fieldType = interfaceAttrList[activeListIndex].type;
            data.isPrimaryKey = 0;
            data.isTitle = 0;
            setAttributeList([...attributeList, data]);
            interfaceAttrList[activeListIndex].interfaceType = interfaceType;
            interfaceAttrList[activeListIndex].attributeName = data.attributeName;
            setInterfaceList([...interfaceAttrList]);
            setAttrModalVisible(false);
        } catch (e) {
        }

    };
    const removeAttrMap = (index)=>{
        delete interfaceAttrList[index].interfaceType;
        delete interfaceAttrList[index].attributeName;
        setInterfaceList([...interfaceAttrList]);
    };
    const selectAttr = async () => {
        try {
            await formRef.current.validate();
            const data = formRef.current.getFieldsValue();
            interfaceAttrList[activeListIndex].interfaceType = interfaceType;
            interfaceAttrList[activeListIndex].attributeName = data.attributeName;
            setInterfaceList([...interfaceAttrList]);
            setAttrSelectModalVisible(false);
        } catch (e) {
        }
    };
    const mapInterfaceAttrToObject = (type)=>{
        const interfaceAttrs = [...interfaceAttrList];
        interfaceAttrs.forEach(item=>{
            const attr = attributeList.find(a=>a.fieldName == item.name);
            if(attr){
                item.interfaceType = type;
                item.attributeName = attr.attributeName;
            }
        });
        setInterfaceList(interfaceAttrs);
    };
    return (
      <div className='attrConfig-extend-container' style={{display: props.isShow? 'flex' : 'none'}}>
          <Dropdown droplist={
              <Menu
                className="attr-map-menu"
                onClickMenuItem={(key, e) => {
                    e.stopPropagation();
                    mapInterfaceAttrToObject(key);
                }}
              >
                  <Menu.Item key="2">
                      <div className="menu-label">
                          <div className='select-name'>{interfaceMapOptions[1].name}</div>
                          <div>
                              <Typography.Text type='secondary'>{interfaceMapOptions[1].detail}</Typography.Text>
                          </div>
                      </div>
                  </Menu.Item>
                  <Menu.Item key="3">
                      <div className="menu-label">
                          <div className='select-name'>{interfaceMapOptions[2]?.name}</div>
                          <div>
                              <Typography.Text type='secondary'>{interfaceMapOptions[2]?.detail}</Typography.Text>
                          </div>
                      </div>
                  </Menu.Item>
              </Menu>
          } position='bl'>
              <Button type="dashed" className='map-btn'>
                  <IconAiColor/>
                  智能映射
              </Button>
          </Dropdown>
           <div className="attr-extend-setting-container">
               {!props.hiddenAlert && <Alert className='action-alert' icon={<IconInformationColor/>} content='要实现对象继承接口，可以将一个接口属性映射到对象的本地属性上，映射后可以选择保留原有数据名称，或使用接口属性名称替换（接口属性修改时同步更新对象属性）。可选属性则根据您的需要自行进行映射。'/>}
               <div className="attr-list">
                   {interfaceAttrList.map((item,index)=>{
                       return (
                         <div className='attr-list-li'>
                             <div className="interface-attr">
                                 <div className="attr-content">
                                     <span style={{marginRight:'3px'}}>{renderIcon(item.type)}</span>
                                     <span className='attr-name'>{item.label||item.name}</span>
                                     {/*<div className="tag-list">
                                         {item.isRequired ? (
                                           <Tag size="mini" effect="plain" color="arcoblue">
                                               必选
                                           </Tag>
                                         ) : <Tag size="mini" effect="plain" color="cyan">
                                             可选
                                         </Tag>}
                                     </div>*/}
                                 </div>
                             </div>
                             <div className="map-arrow"><IconSwapRight/></div>
                             <div className="attr-select">
                                 <Select key={index}
                                         value={item.interfaceType}
                                         dropdownMenuClassName='map-select'
                                       //  error={!item.interfaceType && item.isRequired}
                                         placeholder='请设置映射关系'
                                         allowClear
                                         onClear={(bool)=>{
                                             removeAttrMap(index);
                                         }}
                                         style={{width: '100%'}}
                                         renderFormat={(option, value) => {
                                             return (<Space size='mini'>
                                                 {value == 1 ? <IconAddColor/> : value == 2 ?
                                                   <IconServerNodeColor/> : <IconBrowsingHistoryColor/>}
                                                 {item.attributeName}
                                             </Space>);
                                         }}
                                 >
                                     <Select.OptGroup label='选择映射类型'>
                                         {interfaceMapOptions.slice(props.viewType=='sql'?1:0,3).map((item) => (
                                           <Option value={item.value} key={item.value} onClick={()=>{
                                               const value = item.value;
                                               setActiveListIndex(index);
                                               setInterfaceType(value);
                                               if (value == 1) {
                                                   setAttrModalVisible(true);
                                               } else if (value == 2 || value == 3) {
                                                   setAttrSelectModalVisible(true);
                                               }
                                           }}>
                                               <div className='select-name'>{item.name}</div>
                                               <div>
                                                   <Typography.Text type='secondary'>{item.detail}</Typography.Text>
                                               </div>
                                           </Option>
                                         ))}
                                     </Select.OptGroup>
                                 </Select>
                             </div>
                         </div>
                       )
                   })}
               </div>
           </div>
          <Modal
            title={
                <div style={{ textAlign: 'left',fontWeight:600 }}>
                    新建一个对象属性
                </div>
            }
            okText='确定'
            style={{width: '500px'}}
            visible={attrModalVisible}
            onOk={saveAttr}
            onCancel={()=>{setAttrModalVisible(false)}}
            autoFocus={false}
            focusLock={true}
            className='attr-modal'
          >
              <div className="attr-container">
                  <Form ref={formRef}  key={attrModalVisible} autoComplete='off' layout='vertical' className='metaData-form' validateMessages={{
                      required: (_, {label}) => `${'请输入'}${label} `,
                  }}>
                      <FormItem
                        label='中文名称'
                        field='attributeName'
                        rules={
                            [
                                {required: true,message: '请输入中文名称'},
                                {
                                    validator: async (val, callback) => {
                                        const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                                        // 必须包含中文或字母的校验
                                        const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                                        if (!formatRegex.test(val)) {
                                            callback('仅支持中文、字母、数字和下划线');
                                            return;
                                        } else if (!chineseOrLetterRegex.test(val)) {
                                            callback('必须包含中文或字母');
                                            return;
                                        }
                                        const value = val.trim();
                                        if(attributeList.find(item=>item.attributeName==value)){
                                            callback(`${value}已存在`)
                                        }else{
                                            callback()
                                        }
                                    }
                                }
                            ]}
                      >
                          <Input placeholder='请输入属性中文名称' maxLength={100} showWordLimit/>
                      </FormItem>
                      <FormItem label='英文名' field='attributeLabel'
                                rules={[
                                    {
                                        validator:
                                          async (val, callback) => {
                                              if (val && !/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                                                  callback('必须包含英文字母，且仅支持英文字母、数字和下划线');
                                                  return;
                                              }
                                              callback();
                                          }
                                    }]}>
                          <Input placeholder='请输入属性英文名称' maxLength={100} showWordLimit/>
                      </FormItem>
                      <FormItem label='描述' field='attributeDesc'>
                          <Input.TextArea placeholder='请输入属性描述' maxLength={200} showWordLimit  style={{ minHeight: 62 }}/>
                      </FormItem>
                  </Form>
              </div>
          </Modal>
          <Modal
            title={
                <div style={{ textAlign: 'left',fontWeight:600 }}>
                    选择一个对象属性
                </div>
            }
            okText='确定'
            style={{width: '500px'}}
            visible={attrSelectModalVisible}
            onOk={selectAttr}
            onCancel={()=>{setAttrSelectModalVisible(false)}}
            autoFocus={false}
            focusLock={true}
            className='attr-modal'
          >
              <div className="attr-container">
                  <Form ref={formRef}  key={attrSelectModalVisible} autoComplete='off' layout='vertical' className='metaData-form'>
                      <FormItem label='对象属性' field='attributeName' rules={[{required: true, message: '请选择对象属性'}]}>
                          <Select placeholder='请选择' showSearch>
                              {attributeList.map((item) => (
                                <Option value={item.attributeName} key={item.attributeName} disabled={interfaceAttrList.findIndex(i=>i.attributeName == item.attributeName)!==-1}>
                                    <Typography.Text ellipsis={{ showTooltip: true }} className='attr-li' >
                                        {item.attributeName}
                                    </Typography.Text>
                                </Option>
                              ))}
                          </Select>
                      </FormItem>
                  </Form>
              </div>
          </Modal>

      </div>
    )
});


export default attrExtendConfig;
