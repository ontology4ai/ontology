import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button } from '@arco-design/web-react';
import Table from '@/components/Table';
import { } from 'modo-design';
import { } from 'modo-design/icon';
import { getData } from './api';
import './style/index.less';

class DsOverview extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            modalVisible: false,
            loading: true,
            columns: [],
            data: [],
        }
    }
    getData = () => {
        this.setState({
            loading: true
        });
        getData({
            objectTypeId: this.props.object.id
        }).then(res => {
            if (Array.isArray(res.data.data.titles)) {
                this.setState({
                    columns: this.props.object.attributes.map(attribute => {
                        return {
                            dataIndex: attribute.fieldName,
                            title: (
                                <div
                                    className="column-title">
                                    <div
                                        className="title">
                                        {attribute.attributeName}
                                    </div>
                                    <div
                                        className="descr">
                                        {attribute.fieldType}
                                    </div>
                                </div>
                            )
                        }
                    }),
                    data: res.data.data.datas
                })
            }
        }).finally(() => {
            this.setState({
                loading: false
            })
        })
    }
    componentDidMount() {
    }
    componentDidUpdate(prevProps) {
        if (prevProps.visible !== this.props.visible) {
            if (this.props.visible) {
                this.getData()
            }
            this.setState({
                modalVisible: this.props.visible
            })
        }
    }
    render() {
        const {
            modalVisible,
            loading,
            columns,
            data
        } = this.state;
        const {
            object,
            visible
        } = this.props;
        return (
            <>
            <Modal
                title={<div style={{ textAlign: 'left', fontWeight: 600 }}>选择数据集</div>}
                style={{ width: '1000px' }}
                visible={this.state.stepModalVisible}
                onOk={this.handleDatasetModelOk}
                onCancel={() => {
                  this.setState({
                    stepModalVisible: false,
                  });
                }}
                autoFocus={false}
                focusLock
                className="relation-step-modal"
              >
                <div className="relation-dataset-container">
                  <Form
                    ref={this.datasetFormRef}
                    autoComplete="off"
                    layout="vertical"
                    className="dataset-form"
                    onValuesChange={this.onValuesChange}
                  >
                    <FormItem
                      label="数据源"
                      field="middleDsId"
                      rules={[{ required: true, message: '请选择数据源' }]}
                    >
                      <Select placeholder={'请选择数据源'}>
                        {dsOptions.map((option, index) => (
                          <Option key={option.id} value={option.id}>
                            {option.name}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                    <FormItem
                      label="模式"
                      field="middleDsSchema"
                      rules={[{ required: true, message: '请选择模式' }]}
                    >
                      <Select placeholder={'请选择模式'}>
                        {modelOptions.map((option, index) => (
                          <Option key={option} value={option}>
                            {option}
                          </Option>
                        ))}
                      </Select>
                    </FormItem>
                  </Form>
                  <div className="dataset-container">
                    <div className="dataset-left">
                      <div className="dataset-head">
                        <span>数据集</span>
                      </div>
                      <Spin style={{ display: 'block', width: '100%' }} loading={listLoading}>
                        {datasetAll.length > 0 ? (
                          <InputSearch
                            allowClear
                            placeholder={'请输入'}
                            value={keySearchValue}
                            className="search-input"
                            onChange={this.keySearch}
                          />
                        ) : (
                          ''
                        )}
                        {datasetList.length > 0 ? (
                          <List
                            className="dataset-list"
                            onReachBottom={currentPage => this.setState({ current: current + 1 },()=>{ this.updateDataset();})}
                            dataSource={datasetList}
                            render={(item, index) => (
                              <List.Item
                                key={item.TABLE_NAME}
                                className={`list-item ${
                                  item.TABLE_NAME === dataset.middleTableName ? 'active' : ''
                                }`}
                                onClick={() =>
                                  this.setState({
                                    dataset: { ...dataset, middleTableName: item.TABLE_NAME },
                                  },()=>{
                                    this.getDatasetFields()
                                  })
                                }
                              >
                                <Tooltip content={item.TABLE_NAME}> {item.TABLE_NAME}</Tooltip>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Empty
                            icon={
                              <div
                                style={{
                                  display: 'inline-flex',
                                  width: 48,
                                  height: 48,
                                }}
                              >
                                <img src={emptyIcon} alt="暂无数据" />
                              </div>
                            }
                            description={'未选择数据集'}
                          />
                        )}
                      </Spin>
                    </div>
                    <div className="dataset-arrow">
                      <div className={`right-icon ${data.middleTableName ? '' : 'empty'}`}>
                        <img className="gt" src={rightIcon} alt="暂无数据" />
                      </div>
                    </div>
                    <div className="dataset-right">
                      <div className="dataset-head">
                        <span>字段</span>
                      </div>
                      <div className="dataset-content">
                        <Spin
                          style={{ display: 'block', width: '100%', height: '100%' }}
                          loading={tableLoading}
                        >
                          {tableData.length > 0 ? (
                            <Table
                              columns={columns}
                              data={tableData}
                              scroll={{
                                x: false,
                                y: 440,
                              }}
                              style={{
                                minHeight: '200px',
                              }}
                              rowKey="COLUMN_NAME"
                              pagination={false}
                            />
                          ) : (
                            <Empty
                              icon={
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    width: 48,
                                    height: 48,
                                  }}
                                >
                                  <img src={emptyIcon} alt="暂无数据" />
                                </div>
                              }
                              description={'未选择字段'}
                            />
                          )}
                        </Spin>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>
                
            </>
        )
    }
}

export default DsOverview;