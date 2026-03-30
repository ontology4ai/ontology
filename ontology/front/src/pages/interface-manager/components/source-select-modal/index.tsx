import React, {
    useEffect, useState,
    forwardRef,
    useImperativeHandle, useRef
} from 'react';
import {connect} from 'react-redux';
import {
    Form,
    Select,
    Input,
    Message,
    Empty,
    Pagination,
    Table, Tag,
    TableColumnProps,
    Tooltip, Spin, Radio, Typography, List, Space, Modal
} from '@arco-design/web-react';

import emptyIcon from "@/pages/object/images/empty.svg";
import rightIcon from "@/pages/object/images/rightIcon.svg";

import './index.less';
import {
    getDataSourceList,
    getInterfaceList,
    getDataTables,
    getDataTableInfo,
} from "@/pages/object/api";

const FormItem = Form.Item;
const Option = Select.Option;
const InputSearch = Input.Search;
const source = forwardRef((props, ref) => {
    const [scrollLoading, setScrollLoading] = useState(<Spin loading={true}/>);
    const [dsOptions, setDsOptions] = useState([]);
    const [modelOptions, setModelOptions] = useState([]);
    const [keySearchValue, setKeySearchValue] = useState('');
    const [datasetList, setDatasetList] = useState([]);
    const [datasetAll, setDatasetAll] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [tableName, setTableName] = useState('');
    const [loading, setLoading] = useState(false);
    const [sourceModalVisible, setSourceModalVisible] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [current, setCurrent] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const formRef = useRef();

    useEffect(() => {
        if (props.visible) {
            formRef.current && formRef.current.clearFields();
            getDataSources();
        }
        setSourceModalVisible(props.visible);
    }, [props.visible]);

    const getDataSources = () => {
        setTableData([]);
        setSelectedRows([]);
        setSelectedRowKeys([]);
        setDatasetAll([]);
        setKeySearchValue('');
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
    //获取字段信息
    const getDatasetFields = () => {
        const dsData = formRef.current?.getFieldsValue();
        const dataSet = datasetList.find(item => item.TABLE_NAME == tableName);
        const param = {
            id: dsData.dsId,
            schema: dsData.dsSchema,
            tableName: tableName,
            type: dataSet?.type
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
                    setSelectedRowKeys(data.columns.datas.map(item => item.COLUMN_NAME))
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
        }).finally(() => {
            setListLoading(false);
        })
    };
    const getDataSrcData = () => {
        const formData = formRef.current.getFieldsValue();
        return {
            ...formData,
            tableName
        }
    };
    const validate = async () => {
        let flag = true;
        try {
            await formRef.current.validate();
            if (!tableName) {
                flag = false;
                Message.error('未选择数据集')
            }
        } catch (e) {
            flag = false;
        }
        return flag;
    };
    const handleDatasetModelOk = async () => {
        const valid = await validate();
        if (valid) {
            if (selectedRows.length == 0) {
                Message.error('未选择字段');
            } else {
                props.dataChoosed && props.dataChoosed(selectedRows);
                props.afterClose && props.afterClose();
                setSourceModalVisible(false);
            }
        }
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
        setScrollLoading(<Spin key={current} loading={pageSize * current < filterDataset.length}/>)
    }, [keySearchValue, datasetAll, current, pageSize]);
    useEffect(() => {
        tableName && getDatasetFields();
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
      <div className='datasource-container'>
          <Modal
            title={<div style={{textAlign: 'left', fontWeight: 600}}>选择数据源</div>}
            style={{width: '1000px'}}
            visible={sourceModalVisible}
            onOk={handleDatasetModelOk}
            onCancel={() => {
                props.afterClose && props.afterClose();
                setSourceModalVisible(false);
            }}
            autoFocus={false}
            focusLock
            className="dataset-modal"
          >
              <div className="dataset-content">
                  <div className="datasource-head">
                      <div>
                          <div className="dot"></div>
                          选择一个数据源映射此对象类型
                      </div>
                  </div>
                  <Form ref={formRef} autoComplete='off' layout='vertical' className='dataset-form'
                        onValuesChange={onValuesChange}>
                      <FormItem label='数据源' field='dsId' rules={[{required: true, message: '请选择数据源'}]}>
                          <Select placeholder='请选择数据源' showSearch
                                  filterOption={(inputValue, option) => option.props.extra.name.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0}>
                              {dsOptions.map((option, index) => (
                                <Option key={option.id} value={option.id} extra={option}>{option.name}</Option>
                              ))}
                          </Select>
                      </FormItem>
                      <FormItem label='模式' field='dsSchema' rules={[{required: true, message: '请选择模式'}]}>
                          <Select placeholder='请选择模式' showSearch>
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
                              {datasetAll.length > 0 ? <InputSearch allowClear placeholder='请输入' value={keySearchValue}
                                                                    className='search-input'
                                                                    onChange={keySearch}/> : ''}
                              {datasetList.length > 0 ?
                                <List className="dataset-list"
                                      onReachBottom={(currentPage) => setCurrent(current + 1)}
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
                                  description='未选择数据集'
                                />}
                          </Spin>

                      </div>
                      <div className="dataset-arrow">
                          <div className={`right-icon ${tableName ? '' : 'empty'}`}><img className="gt"
                                                                                         src={rightIcon}/></div>
                      </div>
                      <div className="dataset-right">
                          <div className="dataset-head"><span>字段</span></div>
                          <div className="dataset-content">
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
                                      description='未选择字段'
                                    />}
                              </Spin>
                          </div>

                      </div>
                  </div>
              </div>
          </Modal>
      </div>
    )
});

export default source;
