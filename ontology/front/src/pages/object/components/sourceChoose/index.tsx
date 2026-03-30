import React, {
    useEffect, useState,
    forwardRef,
    useImperativeHandle, useRef
} from 'react';
import {connect} from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import {
    Form,
    Select,
    Input,
    Message,
    Empty,
    Pagination,
    Table,Tag,
    TableColumnProps,
    Tooltip, Spin, Radio, Typography, List, Space, Alert
} from '@arco-design/web-react';
import i18n from '../../locale';

import emptyIcon from '../../images/empty.svg';
import rightIcon from '../../images/rightIcon.svg';

import './index.less';
import {
    getDataSourceList,
    getInterfaceList,
    getDataTables,
    getDataTableInfo,
    parseSql
} from '../../api';
import srcIcon from "@/pages/object/images/srcIcon.svg";
import noSrcIcon from "@/pages/object/images/noSrcIcon.svg";
import { IconInformationColor } from 'modo-design/icon';

const FormItem = Form.Item;
const Option = Select.Option;
const InputSearch = Input.Search;
const RadioGroup = Radio.Group;
const source = forwardRef((props, ref) => {
    const t = useLocale();
    const loginT = useLocale(i18n);
    const [scrollLoading, setScrollLoading] = useState(<Spin loading={true} />);
    const [dsOptions, setDsOptions] = useState([{dsLabel: 'tst', dsId: 'fsf'}, {dsLabel: 'tsdt', dsId: 'fewf'},]);
    const [modelOptions, setModelOptions] = useState([]);
    const [keySearchValue, setKeySearchValue] = useState('');
    const [datasetList, setDatasetList] = useState([]);
    const [datasetAll, setDatasetAll] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [tableName, setTableName] = useState('');
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [current, setCurrent] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [objectType, setObjectType] = useState('1');
    const [interfaceId, setInterfaceId] = useState();
    const [interfaceList, setInterfaceList] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [viewType, setViewType] = useState('common');
    const [sqlViewData, setSqlViewData] = useState('');
    const [customSql, setCustomSql] = useState('');
    const formRef = useRef();

    useEffect(() => {
        if(props.interfaceId){
            setInterfaceId(props.interfaceId);
        }
        getDataSources();
        getInterfaces();
    }, []);
    useEffect(()=>{
        const data = tableData.map(item=>{
            item.disabled = !!selectedRowKeys.includes(item.COLUMN_NAME);
            return item
        });
        if(viewType=='common'){
            props.dataChoosed && props.dataChoosed(data,objectType!=='1'?'noDatasource':'',tableName,viewType);
        }
    },[selectedRowKeys,objectType,viewType]);


    useEffect(()=>{
        props?.interfaceChoosed(interfaceId);
    },[interfaceId]);
    useEffect(()=>{
        if(objectType!=='1'){
            setTableData([]);
            setSelectedRows([]);
            setSelectedRowKeys([]);
            setDatasetAll([]);
            setKeySearchValue('');
            setSqlViewData('');
            setCustomSql('');
            setViewType('common');
        }
    },[objectType]);
    const getDataSources = () => {
        setDsOptions([]);
        setModelOptions([]);
        getDataSourceList().then(res => {
            if (res.data.success) {
                setDsOptions(res.data.data)
            } else {
                Message.error(`查询数据源失败`)
            }
        })
    };
    const getInterfaces = () => {
        setInterfaceList([]);
        getInterfaceList({ontologyId:props.ontologyId}).then(res => {
            if (res.data.success) {
                setInterfaceList(res.data.data)
            } else {
                Message.error(`查询本体接口失败`)
            }
        })
    };
    //获取字段信息
    const getDatasetFields = () => {
        const dsData = formRef.current?.getFieldsValue();
        const dataSet = datasetList.find(item=>item.TABLE_NAME == tableName);
        const param = {
            id: dsData.dsId,
            schema: dsData.dsSchema,
            tableName: tableName,
            type:dataSet?.type
        };
        if (tableName) {
            setLoading(true);
            setTableData([]);
            setSelectedRows([]);
            setSelectedRowKeys([]);
            getDataTableInfo(param).then(res => {
                if (res.data.success) {
                    const data = res.data.data;
                    setTableData(data.columns.datas);
                    setSelectedRows(data.columns.datas);
                    setSelectedRowKeys(data.columns.datas.map(item=>item.COLUMN_NAME))
                } else {
                    setTableData([]);
                    setSelectedRows([]);
                    setSelectedRowKeys([]);
                    Message.error(`查询字段信息失败`)
                }
            }).finally(() => {
                setLoading(false)
            })
        }

    };
    const getDataSet = (param) => {
        setDatasetList([]);
        setListLoading(true);
        getDataTables(param).then(res => {
            if (res.data.success) {
                const data = res.data.data;
                setDatasetAll(data);
                setCurrent(1);

            } else {
                Message.error(`查询数据集失败`)
            }
        }).finally(()=>{
            setListLoading(false);
        })
    };
    const getDataSrcData =() =>{
        const formData = formRef.current.getFieldsValue();
        const sqlData = viewType == 'sql' ? {
            customSql: customSql,
            dsType: 1,
        } : {
            dsType: 0,
            customSql: null
        };
        return {
          ...formData,
          ...sqlData,
          tableName,
          interfaceId,
        }
    };
    const parseSqlData = async (sql:string,formData:any)=>{
        return new Promise((resolve,reject)=>{
            const closeLoading = Message.loading({
                content: '正在解析SQL...',
                duration: 0
            });
            
        parseSql({
            dsId:formData.dsId,
            dsSchema:formData.dsSchema,
            customSql:sql,
            check:true
        }).then(res=>{
            debugger;
            if(res.data.status){
                if(tableName!==res.data.tableName){
                    Message.error('仅支持对当前所选数据表进行数据查询筛选');
                    resolve(false);
                }else{
                    setCustomSql(res.data.customSql);
                    const data = res.data.attributeList;
                    data.forEach(item=>{
                        item.COLUMN_NAME = item.attributeName;
                        item.DATA_TYPE = item.attributeType;
                        item.COMMENTS = item.attributeLabel;
                        item.isNew = item.attributeType? false : false;
                        item.disabled = true;
                    });
                    props.dataChoosed && props.dataChoosed(data,objectType!=='1'?'noDatasource':'',tableName,viewType);
                    resolve(true);
                }
            }else{
                Message.error(res.data.message);
                resolve(false);
            }}).catch(err=>{
                Message.error(err.message);
                resolve(false);
            }).finally(()=>{
                closeLoading();
            })
        })
    };
    const validate = async ()=>{
        let flag = true;
        if (objectType == '1') {
            try {
                await formRef.current.validate();
                if (!tableName) {
                    flag = false;
                    Message.error('未选择数据集')
                }
                if (viewType == 'sql' && !sqlViewData) {
                    flag = false;
                    Message.error('请输入SQL语句');
                }else if(viewType == 'sql' && sqlViewData){
                    const formData = formRef.current.getFieldsValue();
                    flag = await parseSqlData(sqlViewData,formData);
                }
            } catch (e) {
                flag = false;
            }
        }
        return flag;
    };
    useImperativeHandle(ref, () => ({
        getDataSrcData,
        validate
    }));
    const onValuesChange = (changeValue: any, values: any) => {
        setTableData([]);
        setSelectedRowKeys([]);
        setSelectedRows([]);
        setDatasetAll([]);
        setTableName('');
        if (changeValue.dsId) {
            formRef.current.setFieldValue('dsSchema', undefined);
            setModelOptions(dsOptions.find(item => item.id == changeValue.dsId)?.schemas || [])
        }
        if (changeValue.dsSchema) {
            getDataSet({id: values.dsId, schema: values.dsSchema})
        }
    };
    const handeChange = (pageNum: number, pageSize: number) => {
        setCurrent(pageNum);
        setPageSize(pageSize);
    };

    const keySearch = (val) => {
        setKeySearchValue(val);
        setCurrent(1);
    };
    useEffect(() => {
        let filterDataset = [...datasetAll];
        if (keySearchValue.length > 0) {
            filterDataset = filterDataset.filter(item => item.TABLE_NAME.toLowerCase().includes(keySearchValue.toLowerCase()));
        }
        setTotal(filterDataset.length);
        setDatasetList(filterDataset.slice(0, pageSize * current));
        setScrollLoading(<Spin key={current} loading={pageSize*current<filterDataset.length} />)
    }, [keySearchValue,datasetAll, current, pageSize]);
    useEffect(() => {
        getDatasetFields();
      //  setSqlViewData('');
        setCustomSql('');
    }, [tableName]);
    const columns: TableColumnProps[] = [
        {
            title: '字段英文名',
            dataIndex: 'COLUMN_NAME',
        },
        {
            title: '字段说明',
            dataIndex: 'COMMENTS',
        },
        {
            title: '数据类型',
            dataIndex: 'DATA_TYPE',
            render: (col, record, index) => (
              <Tag>{col}</Tag>
            )
        },
        {
            title: '长度',
            dataIndex: 'DATA_LENGTH',
        },
        /* {
             title: '精度',
             dataIndex: '',
         },*/
    ];

    return (
      <div className='datasource-container' style={{display: props.isShow ? 'flex' : 'none'}}>
          <div className="datasource-content">
              <div className="datasource-head">
                  <div>
                      <div className="dot"></div>数据源
                  </div>
              </div>
              <Radio.Group name='card-radio-group'
                           value={objectType} onChange={setObjectType}>
                  {['1', '2'].map((item) => {
                      return (
                        <Radio key={item} value={item}>
                            {({ checked }) => {
                                return (
                                  <div
                                    className={`custom-radio-card ${checked ? 'custom-radio-card-checked' : ''}`}
                                  >
                                      {item == 1 ?
                                        <div className='custom-radio-card-content'>
                                            <div className='custom-radio-card-icon'><img src={srcIcon}/></div>
                                            <div className='custom-radio-card-title'>使用已有数据源</div>
                                            <Typography.Text type='secondary'>选择一个已有的数据源</Typography.Text>
                                        </div>
                                        :
                                        <div className='custom-radio-card-content'>
                                            <div className='custom-radio-card-icon'><img src={noSrcIcon}/></div>
                                            <div className='custom-radio-card-title'>不使用数据源</div>
                                            <Typography.Text type='secondary'>您可以先选择不关联数据源，仅配置对象类型的基础信息，待对象类型创建完成后再进行数据源配置</Typography.Text>
                                        </div>
                                      }
                                      <div className='custom-radio-card-mask'>
                                      </div>
                                  </div>
                                );
                            }}
                        </Radio>
                      );
                  })}
              </Radio.Group>
          </div>
          <div className="datasource-content">
              <div className="datasource-head">
                  <div>
                      <div className="dot"></div>继承接口
                  </div>
              </div>
              <Select
                placeholder={loginT('请选择接口')}
                value={interfaceId}
                onChange={setInterfaceId} disabled={props.interfaceId} allowClear={!props.interfaceId}
                showSearch
                filterOption={(inputValue, option) => option.props.extra.name.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                  option.props.extra.label.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                }>
                  {interfaceList.map((option, index) => (
                    <Option key={option.id} value={option.id} extra={option}>{option.label}</Option>
                  ))}
              </Select>
          </div>

          {objectType=='1'? <div className="dataset-content">
              <div className="datasource-head">
                  <div>
                      <div className="dot"></div>选择一个数据源映射此对象类型
                  </div>
              </div>
              <Form ref={formRef} autoComplete='off' layout='vertical' className='dataset-form'
                    onValuesChange={onValuesChange}>
                  <FormItem label='数据源' field='dsId' rules={[{required: true, message: '请选择数据源'}]}>
                      <Select placeholder={loginT('请选择数据源')}
                              showSearch
                              filterOption={(inputValue, option) => option.props.extra.name.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0}>
                          {dsOptions.map((option, index) => (
                            <Option key={option.id} value={option.id} extra={option}>{option.name}</Option>
                          ))}
                      </Select>
                  </FormItem>
                  <FormItem label='模式' field='dsSchema' rules={[{required: true, message: '请选择模式'}]}>
                      <Select placeholder={loginT('请选择模式')} showSearch>
                          {modelOptions.map((option, index) => (
                            <Option key={option} value={option}>{option}</Option>
                          ))}
                      </Select>
                  </FormItem>
              </Form>
              <div className="dataset-container">
                  <div className="dataset-left">
                      <div className="dataset-head"><span>数据集</span></div>
                      <Spin style={{display: 'block', width: '100%'}} loading={listLoading}>
                          {datasetAll.length>0? <InputSearch allowClear placeholder={loginT('请输入')} value={keySearchValue}
                                                             className='search-input' onChange={keySearch}/>:''}
                          {datasetList.length > 0 ?
                            <List  className="dataset-list"
                                   onReachBottom={(currentPage) => setCurrent(current+1)}
                                   dataSource={datasetList}
                              //   scrollLoading={scrollLoading}
                                   render={(item, index) => (
                                     <List.Item
                                       key={item.TABLE_NAME}
                                       className={`list-item ${item.TABLE_NAME == tableName ? 'active' : ''}`}
                                       onClick={() => setTableName(item.TABLE_NAME)}>
                                         <Tooltip content={item.TABLE_NAME}> {item.TABLE_NAME}</Tooltip>
                                     </List.Item>
                                   )}
                            />
                            :
                            <Empty
                              icon={
                                  <div
                                    style={{
                                        display: 'inline-flex',
                                        width: 48,
                                        height: 48,
                                    }}
                                  ><img src={emptyIcon}/>
                                  </div>}
                              description={loginT('未选择数据集')}
                            />}
                      </Spin>

                  </div>
                  <div className="dataset-arrow">
                      <div className={`right-icon ${tableName ? '' : 'empty'}`}><img className="gt" src={rightIcon}/></div>
                  </div>
                  <div className="dataset-right">
                      <div className="dataset-head">
                        <span>字段</span>
                            {tableName &&
                                <RadioGroup
                                    type='button'
                                    value={viewType}
                                    onChange={setViewType}>
                                    <Radio value='common'>通用视图</Radio>
                                    <Radio value='sql'>SQL视图</Radio>
                                </RadioGroup>
                            }
                        </div>
                      <div className="dataset-content">
                        {viewType=='common'?
                          <Spin style={{display: 'block', width: '100%', height: '100%'}} loading={loading}>
                              {tableData.length > 0 ?
                                <Table
                                  columns={columns}
                                  data={tableData}
                                  scroll={{
                                      x: false,
                                      y: 244
                                  }}
                                  style={{
                                      minHeight: '200px'
                                  }}
                                  rowKey='COLUMN_NAME'
                                  pagination={false}
                                  rowSelection={{
                                      type: 'checkbox',
                                      selectedRowKeys,
                                      onChange: (selectedRowKeys, selectedRows) => {
                                          setSelectedRowKeys(selectedRowKeys);
                                          setSelectedRows(selectedRows);
                                      },
                                      onSelect: (selected, record, selectedRows) => {
                                      },
                                  }}
                                />
                                :
                                <Empty
                                  icon={
                                      <div
                                        style={{
                                            display: 'inline-flex',
                                            width: 48,
                                            height: 48,
                                        }}
                                      ><img src={emptyIcon}/>
                                      </div>
                                  }
                                  description={loginT('未选择字段')}
                                />}
                          </Spin>
                        :<div className='sql-view-content'>
                            <Alert content='仅支持对当前所选数据表进行数据查询筛选' type='info' icon={<IconInformationColor/>} />
                          <Input.TextArea value={sqlViewData} onChange={setSqlViewData} placeholder='请输入SQL语句'/>
                        </div>}
                      </div>

                  </div>
              </div>
          </div>:''}

      </div>
    )
});

export default source;
