import React, { useRef, useState, useContext, useEffect } from 'react';
import {
    Form,
    Select,
    Button,Drawer,
    Modal,
    Table, TableColumnProps,
  Tooltip,Typography,Spin
} from '@arco-design/web-react';
import { IconAdd  } from 'modo-design/icon';
import _ from 'underscore';
import '../style/index.less';
import axios from 'modo-plugin-common/src/core/src/http';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import i18n from '../locale';
const ElxAddDataSourceBtn: React.FC = (props) => {
    const t = useLocale(); 
    const loginT = useLocale(i18n);  
  const { Text } = Typography;
  const FormItem = Form.Item;
    const Option = Select.Option;
    const { options,thisEvent, item,currentCell,formRef} = props;//option的参数
    const teamName = sessionStorage.getItem('teamName');
  
    return (
        <div className='preview-content'>
            <FormItem {...item}>
                <Button className="preview-btn" type='text'
                        onClick={()=>{
                          let url=`${window.location.protocol}//${window.location.host}/_common_/add-data-source-mini`
                          window.open(url);
                }}>
                <IconAdd />
                    {options.title||''}
                </Button>
            </FormItem>
        </div>
    )
}
export default ElxAddDataSourceBtn;
