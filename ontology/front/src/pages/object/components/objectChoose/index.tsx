import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
    Form,
    Select, Input,
    TableColumnProps,
    Space, Typography, Message, Alert, Modal,
} from '@arco-design/web-react';
import i18n from '../../locale';

import './index.less';
import {
    IconInformationColor,
} from "modo-design/icon";
import {getAllObject} from "@/pages/object/api";
const FormItem = Form.Item;
const Option = Select.Option;


const objectConfig = forwardRef((props,ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [objList, setObjList] = useState([]);
    const [objId, setObjId] = useState();
    useImperativeHandle(ref, () => ({
        objId
    }));
    useEffect(()=>{
        getAllObjects()
    },[]);
    const getAllObjects = ()=>{
        getAllObject({ontologyId:props.ontologyId}).then(res=>{
            if(res.data.success){
                const data = res.data.data;
                setObjList(data);
            }
        })
    };
    return (
      <div className='obj-extend-container' style={{display: props.isShow? 'flex' : 'none'}}>
          <div className="obj-extend-setting-container">
              <Alert icon={<IconInformationColor/>} content='选择已创建的对象继承接口，需将对象的本体属性和关系与接口的属性和关系建立映射'/>
              <div className="obj-setting-head">
                  <div><div className="dot"></div>选择一个对象</div>
              </div>
              <Select placeholder='请选择一个对象' value={objId} onChange={setObjId}>
                  {objList.map((option, index) => (
                    <Option key={option.id} value={option.id}>{option.objectTypeLabel}</Option>
                  ))}
              </Select>
          </div>


      </div>
    )
});


export default objectConfig;
