import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
    Form, Tooltip,
    Select, Input,
    Button, Grid,
    TableColumnProps,
    Space, Tag, Message, Switch, Modal,
    Typography
} from '@arco-design/web-react';
import i18n from '../../locale';

import{
    getAllTags,
    addRelationTag,
} from '@/pages/relationModal/api'

import './index.less';
import {
    IconDataResDirColor,
  IconSwapRight,
    IconHelpColor
} from "modo-design/icon";
import DropdownMultiSelect from "@/components/dropdownMultiSelect";
const FormItem = Form.Item;

const relationName = forwardRef((props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const obj = props.relationObjs;
    const [alltags,setAllTags] = useState([]);
    const [leftTags,setLeftTags] = useState([]);
    const [rightTags,setRightTags] = useState([]);
    const [tagModalVisible,setTagModalVisible] = useState(false);
    const [activeTagModel,setActiveTagModel] = useState('');
    const [sourceObject,setSourceObject] = useState('');
    const [targetObject,setTargetObject] = useState('');
    const formRef = useRef();
    useImperativeHandle(ref, () => ({
        getRelationTags
    }));
    useEffect(()=>{
        getAllTag();
    },[]);
    useEffect(()=>{
        if(sourceObject!==obj?.sourceObject || targetObject!==obj?.targetObject){
            setLeftTags([]);
            setRightTags([]);
        }
        setSourceObject(obj?.sourceObject);
        setTargetObject(obj?.targetObject);
    },[obj]);
    const getAllTag = ()=>{
        getAllTags().then(res=>{
            if(res.data.success){
                const data = res.data.data;
                data.forEach(item=>{
                    item.id=item.id||item.tagName;
                    item.label=item.tagLabel;
                    item.value=item.tagName;
                    item.desc=item.tagDesc;
                });
                setAllTags(data);
            }
        })
    };
    const addTag =async ()=>{
        try {
            await formRef.current?.validate();
            const param = formRef.current.getFieldsValue();
            addRelationTag(param).then(res=>{
                if(res.data.success){
                    Message.success('新建标签成功');
                    getAllTag();
                }
            }).finally(()=>{
                setTagModalVisible(false);
            })
        }catch(e){

        }
    };
    const getRelationTags=()=>{
        return {
            sourceTag:leftTags,
            targetTag:rightTags
        }
    };
   return (
     <div className='relation-name-container' style={{display: props.isShow? 'block' : 'none'}}>
         {obj?<div className="relation-list">
             <div className="relation-list-li">
                 <div className="relation-obj-map">
                     <div className="obj-content">
                         {sourceObject?<><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                             {sourceObject}
                         </Typography.Text></>:''}
                     </div>
                     <div className="map-icon">
                         <IconSwapRight/>
                     </div>
                     <div className="obj-content">
                         {targetObject?<><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                             {targetObject}
                         </Typography.Text></>:''}
                     </div>
                 </div>
                 <div className="relation-name">
                    {/* <Form id='searchForm' layout='vertical'>
                         <Grid.Row gutter={24}>
                             <Grid.Col span={12}>
                                 <Form.Item label='中文名' field='label' rules={[{required: true, message: '请输入关系中文名称'}]}>
                                     <Input placeholder='请输入关系中文名称' />
                                 </Form.Item>
                             </Grid.Col>
                             <Grid.Col span={12}>
                                 <Form.Item label='英文名' field='name'>
                                     <Input placeholder='请输入关系英文名称' />
                                 </Form.Item>
                             </Grid.Col>
                         </Grid.Row>
                     </Form>*/}
                     <div className="tag-head">关系标签<Tooltip content='为关系类型的每一侧输入一个名称，即指向当前
对象类型的关系展示的语义描述'> <IconHelpColor style={{marginLeft: 3}}/></Tooltip></div>
                     <DropdownMultiSelect  className='source-tags'
                       addNode={<Button  type='text'  size='mini' onClick={()=>{
                           setActiveTagModel('source-tags');
                           setTagModalVisible(true)}}>+ 新建关系标签</Button>}
                       options={alltags}
                       limit={100}
                       selectedValues={leftTags}
                       onChange={setLeftTags}
                       placeholder="请选择"
                       searchPlaceholder="请输入"
                     />

                 </div>
             </div>
             <div className="relation-list-li">
                 <div className="relation-obj-map">
                     <div className="obj-content">
                         {targetObject?<><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                             {targetObject}
                         </Typography.Text></>:''}
                     </div>
                     <div className="map-icon">
                         <IconSwapRight/>
                     </div>
                     <div className="obj-content">
                         {sourceObject?<><IconDataResDirColor/><Typography.Text ellipsis={{ showTooltip: true }}>
                             {sourceObject}
                         </Typography.Text></>:''}
                     </div>
                 </div>
                 <div className="relation-name">
                     {/*<Form id='searchForm' layout='vertical'>
                         <Grid.Row gutter={24}>
                             <Grid.Col span={12}>
                                 <Form.Item label='中文名' field='label' rules={[{required: true, message: '请输入关系中文名称'}]}>
                                     <Input placeholder='请输入关系中文名称' />
                                 </Form.Item>
                             </Grid.Col>
                             <Grid.Col span={12}>
                                 <Form.Item label='英文名' field='name'>
                                     <Input placeholder='请输入关系英文名称' />
                                 </Form.Item>
                             </Grid.Col>
                         </Grid.Row>
                     </Form>*/}
                     <div className="tag-head">关系标签<Tooltip content='为关系类型的每一侧输入一个名称，即指向当前
对象类型的关系展示的语义描述'> <IconHelpColor style={{marginLeft: 3}}/></Tooltip></div>
                     <DropdownMultiSelect className='target-tags'
                       addNode={<Button  type='text'  size='mini' onClick={()=>{
                           setActiveTagModel('target-tags');
                           setTagModalVisible(true)}}>+ 新建关系标签</Button>}
                       options={alltags}
                       limit={100}
                       selectedValues={rightTags}
                       onChange={setRightTags}
                       placeholder="请选择"
                       searchPlaceholder="请输入"
                     />
                 </div>
             </div>
         </div>:''}

         <Modal
           title={
               <div style={{ textAlign: 'left',fontWeight:600 }}>
                   新建关系标签
               </div>
           }
           getPopupContainer={()=>{
               if(activeTagModel){
                   return document.getElementsByClassName(activeTagModel)?.[0]
               }
               return document.body;
           }}
           key={activeTagModel}
           okText='保存'
           style={{width: '280px'}}
           visible={tagModalVisible}
           onOk={addTag}
           onCancel={()=>{setTagModalVisible(false)}}
           autoFocus={false}
           focusLock={true}
           className='tag-modal'
         >
             <div className="tag-container">
                 <Form ref={formRef}  key={tagModalVisible} autoComplete='off' layout='vertical' className='metaData-form' validateMessages={{
                     required: (_, {label}) => `${'请输入'}${label} `,
                 }}>
                     <FormItem label='标签中文' field='tagLabel' rules={[{required: true},{
                         validator: (value, callback) => {
                             if (!value) return callback();
                             const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
                             // 必须包含中文或字母的校验
                             const chineseOrLetterRegex = /[\u4e00-\u9fa5a-zA-Z]/;

                             if (!formatRegex.test(value)) {
                                 callback('仅支持中文、字母、数字和下划线');
                                 return;
                             } else if (!chineseOrLetterRegex.test(value)) {
                                 callback('必须包含中文或字母');
                                 return;
                             }
                             // 检查是否已存在相同的中文标签
                             const isDuplicate = alltags.some(tag =>
                               tag.tagLabel === value
                             );

                             if (isDuplicate) {
                                 return callback('该标签中文名已存在');
                             }

                             return callback();
                         }
                     }]}>
                         <Input placeholder='请输入关系标签的中文' maxLength={50} showWordLimit/>
                     </FormItem>
                     <FormItem label='标签英文' field='tagName' rules={[{required: true},{
                         validator: (value, callback) => {
                             if (!value) return callback();
                             if (!/^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/.test(value)) {
                                 callback('必须包含英文字母，且仅支持英文字母、数字和下划线');
                                 return;
                             }
                             // 检查是否已存在相同的中文标签
                             const isDuplicate = alltags.some(tag =>
                               tag.tagName === value
                             );

                             if (isDuplicate) {
                                 return callback('该标签英文名已存在');
                             }

                             return callback();
                         }
                     }]}>
                         <Input placeholder='请输入关系标签的英文' maxLength={50} showWordLimit/>
                     </FormItem>
                     <FormItem label='描述' field='tagDesc'>
                         <Input.TextArea placeholder='请输入关系标签的解释说明' maxLength={50} showWordLimit  style={{ minHeight: 62 }}/>
                     </FormItem>
                 </Form>

             </div>
         </Modal>

     </div>
    )
});


export default relationName;
