import React, { useRef, useState, useContext, useEffect } from 'react';
import {
    Form,
    Select,
    Button,
    Modal,
    Spin,
    Message,
    Checkbox,
    Table, TableColumnProps,
} from '@arco-design/web-react';
import { IconTable } from 'modo-design/icon';
import _ from 'underscore';
import '../style/index.less';
import axios from 'modo-plugin-common/src/core/src/http';
// import MonacoEditor from 'react-monaco-editor';
import * as sqlFormatter from "sql-formatter";
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import Editor from '@/components/Editor';
const ElxAutoButton: React.FC = (props) => {
    const FormItem = Form.Item;
    const Option = Select.Option;

    const { options,thisEvent, item,currentCell} = props;//option的参数
    const { field ,label}=item;
    const teamName = sessionStorage.getItem('teamName');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dsProfile, setDsProfile] = useState(options.dsProfile || false);
    const [height, setHeight] = useState(0);
    let value=sqlFormatter.format(options.value || '',{
        tabWidth: 4,
        language: options.language||'sql'
    })
    const [runSql, setRunSql] = useState(value);
    const resizeUpdate = e => {
        const ht = e.target.innerHeight - 158;
        setHeight(ht);
      };
      
    const autoTable=()=>{
        setPreviewVisible(true);

    }
    const setCodeFun = (val) => {
        if(val){
            let value= sqlFormatter.format(val || '',{
                tabWidth: 4,
                language: options.language||'sql'
            })
            setRunSql(value)
        }
    }
    const setMessage = ({type,msg}) => {
        if(msg && type =='error' ){
            Message.error(msg);
        }else if(msg && type == 'success'){
            Message.success('执行成功!');
        }
    }
    
    const onChange=(value)=>{
        setRunSql(value);
    }
    const onChecChange=(value)=>{
        setDsProfile(value);
    }
    
    useEffect(()=>{
        // let schemaDefalut= formRef?formRef.getFieldValue(schema_):'';
        //     formRef?formRef.setFieldsValue(compatibleSchema(_.extend(defaultValue, schemaDefalut))):'';
    },[])

    return (
        <div className='elx-button'>
            <FormItem  {...item} label={label} field={field}>
                <Button {...props.options} 
                  style={{
                    width: props.options.width ||  100+'px',
                }}
                className="elx-button-btn"  onClick={() => {
                    setPreviewVisible(true);
                    setRunSql(value);
                    typeof options.onClick === 'function' && options.onClick({
                        setCodeFun:(val)=>setCodeFun(val),
                    },props);   
                }}>
                <IconTable />
                    自动建表
                </Button>
            </FormItem>
            <Modal
                title='自动建表'
                style={{
                    width: '70%',
                    cursor: 'move'
                }}
                className="auto-modal"
                autoFocus={false}
                visible={previewVisible}
                onCancel={() =>{setPreviewVisible(false);setRunSql('');} }
                autoFocus={false}
                focusLock={true}
                footer={
                    <>
                      <Button
                        onClick={() => {
                          setPreviewVisible(false);
                          setRunSql('');
                        }}
                      >
                       取消
                      </Button>
                      <Button
                        onClick={() => {
                            typeof options.onSubmit === 'function' && options.onSubmit({
                                setMessage:(val)=>setMessage(val),
                                dsProfile,
                                runSql,
                            },props);   
                        }}
                        type='primary' >
                        执行
                      </Button>
                    </>
                }
                >
                <div>
                {/* <Spin  loading={loading}> */}
                    <Editor
                            language={ options.language|| "sql" }
                            value={runSql}
                            height={height}
                            onChange={(value)=>onChange(value)}/>
                    <Checkbox checked={dsProfile} onChange={(value)=>onChecChange(value)}>{options.checkboxLabel||'生产环境建表'}</Checkbox>
                    {/* </Spin> */}
                </div>
        </Modal>
        </div>
    )
}
export default ElxAutoButton;
