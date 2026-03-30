import React, { useRef, useState, useContext, useEffect } from 'react';
import {
    Form,
    Select,
    Button,
    Modal,
    Grid,
    Tooltip,
    Typography,
} from '@arco-design/web-react';
import { IconHelp } from 'modo-design/icon';
import TableForm from '../TableForm';
import './style/index.less';
import { Item } from '@dtinsight/molecule/esm/components';
const ElxMapping: React.FC = (props) => {
    const FormItem = Form.Item;
    const Row = Grid.Row;
    const Col = Grid.Col;
    const Option = Select.Option;
    const { options,thisEvent, item,formRef,getApi,currentCell,config} = props;//option的参数
    const { source,target } = options;
    // const sourceTableData = source.value || [];
    const { field,label,isRemark ,remark}=item;
   
    const teamName = sessionStorage.getItem('teamName');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [sourceTableData, setSourceTableData] = useState(source.value.filter((item,index) => {
        let obj={
            ...item,
            key: index+1,
            id: item.id?item.id:index,
            isLine: false,
        }
        return obj;
    }));
    const [targetTableData, setTargetTableData] = useState(target.value.filter((item,index) => {
        let obj={
            ...item,
            key: item.index+1,
            id: item.id?item.id:index,
        }
        return obj;
        }) );
    console.log('source.value',source.value,'target.value ',target.value )
    
    const preview=()=>{
        setPreviewVisible(true);
    }
    const modalPreview=()=>{
        console.log('config',item)
        let field=item.field;
        let obj={};
            obj[item.field]=previewArr;
            formRef?formRef.setFieldsValue(obj):'';
        // setPreviewVisible(true);
    }
    
    useEffect(()=>{
     },[])

    return (
        <div className='mapping-content'>
            <FormItem  {...item} label={(
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
            <Row
                className='grid-demo' >
                <Col span={12}>
                <div className="source-table">
                    <div className="table">
                        <div className="source-table-title">
                            <h3> 
                                <span className='space'></span>
                                <span >输入字段</span>
                            </h3>
                        </div>
                        <TableForm  
                        {...source}
                        hasIndexString={true}
                        onChange={(value => {
                            let obj={};
                            obj[field]=value;
                            formRef?formRef.setFieldsValue(obj):'';
                            console.log(value);
                            setSourceTableData(value);

                        })} >
                    </TableForm>
                    </div>
                </div>
                </Col>
                <Col span={4} >
                <div className="line-box" >
                    {/* {JSON.stringify(sourceTableData)} */}
                            {
                            sourceTableData.map((item : string,index) => {
                                return<div   key={index}  className={[index >= targetTableData.length ? 'line-add-none mapping-line-div':'mapping-line-div']}>
                                        <div  className={[ item.isLine?'color-line mapping-line':'mapping-line']}>
                                            <div className="circle"></div>
                                            <div className="line"></div>
                                            <div className="triangle"></div>
                                        </div>
                                    </div>
                                })
                            }
                </div>
                </Col>
                <Col span={8}>
                <div className="target-table">
                    <div className="table">
                        <div className="source-table-title">
                            <h3> 
                                <span className='space'></span>
                                <span >输出字段</span>
                            </h3>
                        </div>
                        <TableForm  
                        {...target}
                        hasIndexString={true}
                        onChange={(value => {
                            let obj={};
                            obj[field]=value;
                            formRef?formRef.setFieldsValue(obj):'';
                            console.log(value);
                        })} >
                    </TableForm>
                    </div>
                </div>
                </Col>
            </Row>
               

            </FormItem>
      
        </div>
    )
}
export default ElxMapping;
