import React, { useRef, useState, useContext, useEffect } from 'react';
import {
    Form,
    Select,
    Button,
    Modal,
    Tooltip,
    Typography,
} from '@arco-design/web-react';
import { IconHelp } from 'modo-design/icon';
import TableForm from './pages/TableForm';
import '../style/index.less';
import { Item } from '@dtinsight/molecule/esm/components';
const ElxFieldTable: React.FC = (props) => {
    const FormItem = Form.Item;
    const Option = Select.Option;
    const tabelRef = useRef();
    const { options,thisEvent,item,formRef,getApi,currentCell,config,elxFieldTableRef} = props;//option的参数
    const { model } = options;
    let options_=Object.assign({},options,{config,formRef});
    const { field,label,remark,isRemark,initialValue}=item;
    let indexArr=[];
    const [fields, setFields] = useState(initialValue||[]);
    let total=fields.length;
    const teamName = sessionStorage.getItem('teamName');
    const [previewVisible, setPreviewVisible] = useState(false)
    const preview=()=>{
        setPreviewVisible(true);
    }
    const modalPreview=()=>{
        let field=item.field;
        let obj={};
            obj[item.field]=previewArr;
            formRef?formRef.setFieldsValue(obj):'';
        // setPreviewVisible(true);
    }
    const changeTable=(value)=>{
        setFields(value)
    }
    
     useEffect(() => {
        elxFieldTableRef.current = fields;
    }, [fields])

    return (
         <div className='field-list-content'>
            <FormItem  {...item} label={(
                <>
                    <div className='label-item'>
                        <span className='space' style={ {
                                display: item.required ? 'none' : 'inline-block',

                            } }></span>
                        <span>{label}</span>
                        {
                            isRemark? (
                                <Tooltip position='bottom' trigger='hover' content={<div dangerouslySetInnerHTML={{ __html: remark }}></div>}>
                                    <IconHelp className='help'/>
                                </Tooltip>
                            ):''
                        }
                        {/* <span className='total'>{total?total:0}条</span> */}
                    </div>
                </>
            )} field={field}>
                <TableForm  
                    {...options_}
                    {...props}
                    ref={tabelRef}
                    onChange={(value => {
                        // typeof options_.onChange === 'function' && options_.onChange(this,options_,value);
                        let value_=value.map((item,index)=>{
                            return { ...item,index:index+1};
                        });
                        let obj={};
                        obj[field]=value_;
                        formRef?formRef.setFieldsValue(obj):'';
                        console.log('TableForm改变的数据----',obj,value_)
                        setFields(value);
                        if(props.options && typeof props.options.onChange === 'function'){
                            props.options.onChange(value_, obj, formRef);
                        }
                    })}
                >
                </TableForm>

            </FormItem>
        </div>
     
    )
}
export default ElxFieldTable;
