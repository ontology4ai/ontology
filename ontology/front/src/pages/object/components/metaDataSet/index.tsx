import {Form, Grid, Input, Select, Switch, Tag} from '@arco-design/web-react';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { checkObjectTypeExist, getObjectGroup } from '../../api';
import i18n from '../../locale';



import ObjectIcon from "@/components/ObjectIcon";
import './index.less';
const FormItem = Form.Item;
const Option = Select.Option;

const icons = [
  'IconUserColor-primary','IconUserColor-orangered','IconUserColor-cyan','IconUserColor-purple',
  'IconFunctionColor-primary','IconFunctionColor-orangered','IconFunctionColor-cyan','IconFunctionColor-purple',
  'IconStorageColor-primary','IconStorageColor-orangered','IconStorageColor-cyan','IconStorageColor-purple',
  'IconDockerHubColor-primary','IconDockerHubColor-orangered','IconDockerHubColor-cyan','IconDockerHubColor-purple',
  'IconDocumentDetailColor-primary','IconDocumentDetailColor-orangered','IconDocumentDetailColor-cyan','IconDocumentDetailColor-purple',
];


const source = (props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [iconOptions, setIconOptions] = useState(icons);
    const [tagOptions, setTagOptions] = useState(['OSDK Tutorial','Decisions']);
    const formRef = useRef();
    const [popupVisible, setPopupVisible] = useState(false);
    const refMenuItemClicked = useRef(null);
    useImperativeHandle(ref, () => ({
        getMetaData,
        validate
    }));
    useEffect(() => {
       // getGroupData();
        formRef.current?.setFieldsValue({
            icon: 'IconUserColor-primary',
            status: true
        });
    }, []);
    // useEffect(() => {
    //     formRef.current?.setFieldValue('objectTypeName', props.tableName);
    // }, [props.tableName]);
    const getMetaData = ()=>{
        const formData = formRef.current.getFieldsValue();
        return {
          ...formData,
            status: formData.status?1:0
        }
    };
    const validate = async ()=>{
        let valid = true;
        try {
            await formRef.current.validate()
        } catch (e) {
            valid = false;
        }
        return valid;
    };
    const tagRender =(props)=> {
        const { label, value, closable, onClose } = props;
        return (
          <Tag
            className='group-tag'
            closable={closable}
            onClose={onClose}
          >
              {label}
          </Tag>
        );
    };
    const getGroupData = () => {
        getObjectGroup(
          {
              keyword: '',
              ontologyId: props.ontologyId,
              page: '0',
              limit: '999'
          }).then(res => {
              if(res.data.success){
                  let data = res.data.data.content;
                  /*if(data.length==0){
                      data =  [
                          {
                              "id": "dee8e17df10b4a11b76b0320759ec1d5",
                              "ontologyId": "8ce92e9335644ce4abba558e01cb2087",
                              "objectGroupLabel": "数据源基本信息",
                              "ownerId": "hulin",
                              "createTime": "2025-08-20T11:49:10",
                              "lastUpdate": "2025-08-20T11:49:10",
                              "objectTypeCount": 0
                          }
                      ]
                  }*/
                  data.forEach(item=>{
                      item.value=item.id;
                      item.label=item.objectGroupLabel;
                  });
                  setTagOptions(data)
              }
        })
    };

    return (
      <div className='metaData-container' style={{display: props.isShow? 'block' : 'none'}}>
          <Form ref = {formRef} autoComplete='off' layout='vertical' className='metaData-form'>
              <FormItem label={loginT('中文名称和图标选择')}  required className='icon-name-form' >
                  <Grid.Row gutter={8}>
                      <Grid.Col span={5}>
                          <FormItem  field='icon'  rules={[{required: true, message: '请选择图标'}]}>
                              <Select dropdownMenuClassName='icon-select-container'>
                                  {iconOptions.map((option, index) => (
                                    <Option key={index}  value={option}>
                                        <ObjectIcon icon={option}/>
                                    </Option>
                                  ))}
                              </Select>
                          </FormItem>
                      </Grid.Col>
                      <Grid.Col span={19}>
                          <FormItem field='objectTypeLabel' rules={[
                              {required: true, message: '请输入中文名称'},
                              {
                                  validator:
                                    async (val, callback) => {
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
                                        const res = await checkObjectTypeExist({
                                            objectTypeLabel: value,
                                            ontologyId: props.ontologyId,
                                        });
                                        if (res.data && res.data.success) {
                                            const data = res.data.data;
                                            if (data && data.exists) {
                                                callback(`${value}已存在`);
                                            }
                                        }
                                        callback();
                                    }
                              }]}>
                              <Input placeholder={loginT('请输入中文名称')} maxLength={100} showWordLimit/>
                          </FormItem>
                      </Grid.Col>
                  </Grid.Row>

              </FormItem>
              <FormItem label={loginT('英文名称')} field='objectTypeName'
                        rules={[
                            {required: true, message: '请输入英文名称'},
                            {
                                validator:
                                  async (val, callback) => {
                                      if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(val)) {
                                          callback('名称必须包含英文字母，且只能输入英文字母、数字和下划线');
                                          return;
                                      }
                                      const value = val.trim();
                                      const res = await checkObjectTypeExist({
                                          objectTypeName: value,
                                          ontologyId: props.ontologyId,
                                      });
                                      if (res.data && res.data.success) {
                                          const data = res.data.data;
                                          if (data && data.exists) {
                                              callback(`${value}已存在`);
                                          }
                                      }
                                      callback();
                                  }
                            }]}>
                  <Input placeholder={loginT('请输入英文名称')} maxLength={100} showWordLimit/>
              </FormItem>
              <FormItem label='描述' field='objectTypeDesc'>
                  <Input.TextArea placeholder={loginT('请输入')}  maxLength={200} showWordLimit  style={{ minHeight: 62 }}/>
              </FormItem>
              <FormItem label='状态' field='status'>
                  <Switch
                    checkedText='启用'
                    uncheckedText='禁用' defaultChecked/>
              </FormItem>
              {/* <FormItem label='分组' field='groupIds'>
                  <Select
                    allowClear
                    placeholder={loginT('请选择分组')}
                    mode={'multiple'}
                   // options={tagOptions}
                     renderTag={tagRender}
                  >
                      {tagOptions.map((item,index)=>(<Option value={item.id} key={item.id}>
                          <div className="meta-group-item">{item.objectGroupLabel} <span>{item.objectTypeCount}</span></div>
                      </Option>))}
                  </Select>
              </FormItem> */}
          </Form>
      </div>
    )
};

export default forwardRef(source);
