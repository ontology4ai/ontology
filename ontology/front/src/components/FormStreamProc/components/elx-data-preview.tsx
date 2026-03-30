import React, { useRef, useState, useContext, useEffect } from 'react';
import {
    Form,
    Select,
    Button,
    Modal,
    Table, TableColumnProps,
  Tooltip,Typography,Spin
} from '@arco-design/web-react';
import { IconFileSearch } from 'modo-design/icon';
import _ from 'underscore';
import '../style/index.less';
import axios from 'modo-plugin-common/src/core/src/http';
const ElxDataPreview: React.FC = (props) => {
  const { Text } = Typography;
  const FormItem = Form.Item;
    const Option = Select.Option;
    const { options,thisEvent, item,currentCell,formRef} = props;//option的参数
    const { field ,label}=item;
    const { value,fields} = options;
    // const { options,thisEvent, item,formRef,getApi,currentCell,config} = props;//option的参数
    // const { value,fields} = options;
    // const { field }=item;
    const teamName = sessionStorage.getItem('teamName');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [data, setData] = useState(value||[]);
  const [columns, setColumns] = useState(fields||[]);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);


    const [modalOptions, setModalOptions] = useState(options.modalOptions || {});

    // let columns=[];
    // columns = columns.concat([...fields])

    const setPreviewFun=(val)=>{
        console.log('setPreview',val)
      setPreviewVisible(val);
    }
  const setLoadingFun=(loading)=>{
    console.log('setLoadingBtn',loading)
        setLoadingBtn(loading);
  }

    const setTableDataFun=(data,columnsData)=>{
      console.log(data,columnsData)
        if(data){
            // setPreviewVisible(val);
            setData(data);
            if(columnsData && columnsData.length>0){
              setColumns(columnsData)
            }
        }
        // setPreviewVisible(val);
    }
    const modalPreview=()=>{
        let obj={};
        obj[field]=data;
        formRef?formRef.setFieldsValue(obj):'';
        setPreviewVisible(false);
    }
  //   const filters=(value)=>{
  //     if (!value) return '';
  //     console.log('value.length ',value.length )
  //     if (value.length > 25) {
  //       return value.slice(0, 25) + '...'
  //     }
  //     return value;
  // }

    // useEffect(()=>{
    //   console.log('data,columns',data,columns)
    //   // setData(data);
    //   // setColumns(columns);
    // },[data,columns])

    return (
        <div className='preview-content'>
            <FormItem {...item}>
                <Button className="preview-btn" type='text'
                        // loading={loadingBtn}
                        onClick={()=>{
                          setLoadingBtn(true);
                          setPreviewVisible(true);
                    typeof options.onClick === 'function' && options.onClick({
                      setPreviewFun:(val)=>setPreviewFun(val),
                      setLoadingFun:(val)=>setLoadingFun(val),
                        setTableDataFun:(val,columns_)=>setTableDataFun(val,columns_),
                    },props);
                }}>
                <IconFileSearch />
                    {options.title||''}
                </Button>
            </FormItem>
            <Modal
                title= {options.title||''}
                maskClosable={false}
                style={{
                    width: '70%',
                    cursor: 'move'
                }}
                className="preview-modal"
                {...modalOptions}
                autoFocus={false}
                visible={previewVisible}

                // onOk={() => modalPreview()}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                focusLock={true}>
              <Spin loading={loadingBtn}>
                  {columns.length>0?(  <Table
                    pagination={false}
                    loading={loadingBtn}
                    data={data}
                    rowKey='ID_'
                    columns={columns.map((column, index) => {
                      return {
                        title: column.label,
                        dataIndex: column.name,
                        ellipsis:true,
                        width: index == 0 ? 180 :'',
                        align:"left",
                        render: (col, record, index) => {
                          return (
                            <Tooltip content={record[column.label]}>
                              <Text >{ record[column.label]}</Text>
                            </Tooltip>
                          )},
                        ...column,
                      };
                    })}
                  />):(
                    <div className="noData">暂无数据</div>
                  )}
              </Spin>
        </Modal>
        </div>
    )
}
export default ElxDataPreview;
