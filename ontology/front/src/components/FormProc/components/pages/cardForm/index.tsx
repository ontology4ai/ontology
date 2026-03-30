import React, { useRef, useState, useContext,useImperativeHandle, useEffect,forwardRef } from 'react';
import {
    Form,
    Select,
    Button,
    Modal,
    Grid,
    Tooltip,
    Input,
    Typography,
} from '@arco-design/web-react';
import useRefs from '@arco-design/web-react/es/_util/hooks/useRefs';
import { IconHelp,IconAdd,IconMinus } from 'modo-design/icon';
import widgetMap from '../../../../Form/widget';
import { cloneDeep } from 'lodash';
// import Form from '@/components/Form';
import './style/index.less';
import { Item } from '@dtinsight/molecule/esm/components';
require('static/guid');
const CardForm: React.FC = forwardRef((props,ref) => { 
    // (props) => {
    const FormItem = Form.Item;
    const formCardRef0 = useRef(null);
    const Row = Grid.Row;
    const Col = Grid.Col;
    const Option = Select.Option;
    const { options,thisEvent,modelData,item,formRef,getApi,currentCell} = props;//option的参数
    const { source,target } = options;
    const { field,label,isRemark ,remark,config}=item;
    let value_= formRef?formRef.getFieldsValue():'';
    let value=props.modelData;
    
    const [currentData, setCurrentData] = useState([]);
    // const [formDatas, setFormDatas] = useState();
    const [formData, setFormData] = useState([]);
    const [configFilds, setConfigFilds] = useState(config.fields);
    const [initialValues, setInitialValues] = useState({});
    
    const [refWrapper, setRefWrapper] = useRefs<HTMLUListElement>();
    const layout=config?.layout?config.layout:'horizontal';
    const setFormDataFun=()=>{
        setFormData([]);
    }
    const setOptionFun=(value,options,field)=>{
        let options_=[]
        let configFilds_=configFilds.map(itm=>{
        if(itm.field==field.field){
            itm.options.options =options ? options[value].options : [];
            return itm
        };
        return itm
        });
        setConfigFilds(configFilds_);//避免页面第一次的时候不渲染option数据

    }
    useImperativeHandle(ref, () => ({
        setFormDataFun,
        setOptionFun
      }))
    const addData = () => {
        const id = guid();
        setFormData(prevData => [...prevData,{id:guid()}]);
    }
    const removeCardData = ($index,id) => {
          let newformData=cloneDeep(formData).filter(item => item.id !== id);
          setFormData(newformData);
    }
    const handelOnFocus = async (item,options) =>{
    //    if(item.options && typeof item.options.onFocus === 'function'){  
    //             let options_ = await item.options.onFocus(props,item,options);
    //             if(options_){
                //    let configFilds_=configFilds.map(itm=>{
                //         if(itm.field==item.field){
                //             itm.options.options =options_;
                //             return itm;
                //         };
                //         return itm;
                //     });
                //     setConfigFilds(configFilds_);
    //             }
    //    }

    }
    const onValuesChangeFun = (value,cardData,id)=>{
        let indexFormData=refWrapper[id].getFieldsValue();
        let obj=Object.assign({},indexFormData,{id:id});
        const index_ = formData.findIndex(item => item.id === id);
        if (index_ !== -1) {
            setFormData(prevData => prevData.map((item, i) => (i === index_ ? obj : item)));
          } else {
            setFormData(prevData => [...prevData, obj]);
          }
        
    }
    useEffect(()=>{
        if(value?.[field]){
            setFormData(value[field]);
            // setInitialValues()
        }else{
            setFormData([]);
        }
     },[])
    useEffect(()=>{
        let obj={};
        obj[field]=formData;
        formRef?formRef.setFieldsValue(obj):'';
     },[formData])
    return ( <div className='elx-card-form'>
        <FormItem  
         label={(
                <>
                    <div className='label-item'>
                        <span className='space'></span>
                        <span>{label}</span>
                        {
                            isRemark? (
                                <Tooltip position='bottom' trigger='hover' content={remark}>
                                    <IconHelp className='help'/>
                                </Tooltip>
                            ):''
                        }
                    </div>
                </>
            )} field={field}>
            <div className='header' >
            <Tooltip position='bottom' trigger='hover' content='添加'>
                <IconAdd onClick={addData} />
            </Tooltip>
            </div>
        {formData.length>0?formData.map((cardData, $index) => {
                return ( <div className='form' key={cardData.id}>
                <div className='elx-form' >
                    <Form  
                    initialValues={cardData}
                    ref={(node) =>{
                        setRefWrapper(node, cardData.id)
                    } }
                    layout={layout}
                    onValuesChange={(value)=>onValuesChangeFun(value,cardData,cardData.id)}
                    >
                    {configFilds.map((item, index) => {
                            const Widget = widgetMap[item.type];
                            let itemIsShow=typeof item.isShow == 'boolean' ? item.isShow : true;
                            if (!Widget) {
                                return;
                            }else if(itemIsShow){
                                return ( <FormItem  
                                    label={(
                                        <>
                                        <div className='label-item'>
                                            <span>{item.label}</span>
                                            {
                                                item?.isRemark? (
                                                    <Tooltip position='bottom' trigger='hover' content={item?.remark}>
                                                        <IconHelp className='help'/>
                                                    </Tooltip>
                                                ):''
                                            }
                                        </div>
                                    </>)} field={item.field}>
                                            <Widget
                                            {...item.options}
                                            // onFocus={(newValue)=>{handelOnFocus(item,options)}}
                                            // onSearch={(value, option)=>handleInputSearch(this,value, option,item)}
                                            // visibleChange={()=>{
                                            //     typeof options.visibleChange === 'function' && options.visibleChange(this,value,item,option);
                                            // }}
                                            // onChange={(value, option) => {
                                            //     typeof props.changeLabel === 'function' && props.changeLabel(item, value, option);
                                            //     typeof options.onChange === 'function' && options.onChange(this,value,item,option);
                                            // }}
                                            >
                                        </Widget>
                                    </FormItem>)
                            }
                    })}
                    </Form>
                </div>
                <div className='operate'>
                    <IconMinus onClick={()=>removeCardData($index, cardData.id)} />
                </div>
            </div>)
            }):''}
       
        </FormItem>
    </div>
    )
})
export default CardForm;
