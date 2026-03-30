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
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import i18n from '../locale';
const ElxDataPreview: React.FC = (props) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
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
      setPreviewVisible(val);
    }
  const setLoadingFun=(loading)=>{
        setLoadingBtn(loading);
  }
    const setTableDataFun=(data,columnsData)=>{
        if(data){
            setData(data);
            if(columnsData && columnsData.length>0){
                      setColumns(columnsData)
                    }
                }
            }
    const modalPreview=()=>{
        let obj={};
        obj[field]=data;
        formRef?formRef.setFieldsValue(obj):'';
        setPreviewVisible(false);
    }
    const setwidth=(column)=>{
        let num=180;
        if(data.length==0){
            num = 180;
        }else if(columns.length<=6){
            num = 80;
        }
        return num;

    }
  //   const filters=(value)=>{
  //     if (!value) return '';
  //     if (value.length > 25) {
  //       return value.slice(0, 25) + '...'
  //     }
  //     return value;
  // }

    // useEffect(()=>{
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
                        width: setwidth(column),
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
                    scroll={{
                        x: true,
                        y: 400,
                    }}
                  />):(
                    <div className="noData">{loginT('暂无数据')}</div>
                  )}
              </Spin>
        </Modal>
        </div>
    )
}
export default ElxDataPreview;
