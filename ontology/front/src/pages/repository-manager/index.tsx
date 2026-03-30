import React, { useState, useEffect, useMemo } from 'react';
import { Spin, Tabs, Input, Button, Modal, Form, Radio, Space, Select, Alert, Drawer, Message } from '@arco-design/web-react';
import Table from '@/components/Table';
import { IconHomeColor, IconAdd, IconDataDevColor, IconSearchColor, IconBack } from 'modo-design/icon';
import { getOntologyList, getCodeList, saveCodeRepo } from './api';
import './style/index.less';

const TabPane = Tabs.TabPane;
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
class RepositoryManager extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            data: [],
            pagination: {
                total: 0,
                current: 1,
                pageSize: 20
            },
            ontologyList: [],
            modalVisible: false,
            codeServerVisible: false,
            saveLoading: false,
            keyword: '',
        };
        this.formRef = React.createRef();
        this.containerRef = React.createRef();
        this.debouncedSearch = debounce(this.getData, 300);

    }
    getData = (keyword='') => {
        getCodeList({
            keyword,
            page: this.state.pagination.current,
            limit: this.state.pagination.pageSize,
        }).then(res => {
            console.log('getCodeList', res, res.data.data);
            if (res?.data?.data?.content) {
                this.setState({
                    data: res.data.data.content,
                    pagination: {
                        ...this.state.pagination,
                        total: res.data.data.totalElements || res.data.data.content.length
                    }
                });
            }
        })
    }

    handleSaveCodeRepo = () => {
        saveCodeRepo(this.formRef.current.getFieldsValue()).then(res => { 
            if (res?.data?.data) {
                this.setState({
                    modalVisible: false,
                });
                Message.success('创建成功')
                this.getData(this.state.keyword);
            }
        })
    }
    getOntologyList = () => {
        getOntologyList({
            limit: 10000
        }).then(res => {
            if (Array.isArray(res?.data?.data?.content)) {
                this.setState({
                    ontologyList: res?.data?.data?.content.map(item => {
                        return {
                            value: item.id,
                            label: item.ontologyLabel
                        }
                    })
                })
            }
        })
    }
    componentDidMount() {
        this.getOntologyList()
        this.getData()
    }
    render() {
        const {
            ontologyList,
            modalVisible,
            codeServerVisible,
            saveLoading,
            keyword,
            data,
            pagination,
        } = this.state;
        return (
            <Spin
                className="repository-manager-spin">
                <div
                    ref={this.containerRef}
                    className="repository-manager">
                    <div
                        className="repository-manager-header">
                        <div
                            className="title">
                            <IconHomeColor/>
                            <span className="text">代码仓库</span>
                        </div>
                        <div
                            className="oper">
                            <Button
                                type="primary"
                                shape='round'
                                onClick={() => {
                                    this.setState({
                                        modalVisible: true
                                    })
                                }}>
                                <IconAdd/>
                                新建代码仓库
                            </Button>
                        </div>
                    </div>
                    <div
                        className="repository-manager-filter">
                        <Input
                            placeholder="请输入"
                            suffix={(<IconSearchColor/>)}
                            value={keyword}
                            onChange={(value) => {
                                this.setState({
                                    keyword: value
                                });
                                this.debouncedSearch(value);
                            }}
                            />
                    </div>
                    <div
                        className="repository-manager-tab-container">
                        <Tabs defaultActiveTab='1'>
                            <TabPane key='1' title='选中'>
                                <Table
                                    columns={[
                                        {
                                            dataIndex: 'repoName',
                                            title: '仓库名',
                                            render: (col, row, index) => {
                                                return (
                                                    <div
                                                        className="repository-name-td"
                                                        onClick={() => {
                                                            this.setState({
                                                                codeServerVisible: true
                                                            })
                                                        }}>
                                                        <IconDataDevColor/>
                                                        <span className="text">{row.repoName}</span>
                                                    </div>
                                                );
                                            }
                                        },
                                        {
                                            dataIndex: 'ontologyLabel',
                                            title: '绑定本体'
                                        },
                                        {
                                            dataIndex: 'owner',
                                            title: '拥有者'
                                        },
                                        {
                                            dataIndex: 'lastUpdate',
                                            title: '更新时间'
                                        }
                                    ]}
                                    data={data}
                                    scroll={{
                                        y: true
                                    }}
                                    pagination={false}/>
                            </TabPane>
                            <TabPane key='2' title='我的'>
                                
                            </TabPane>
                        </Tabs>
                    </div>
                    <Modal
                        wrapClassName="repository-create-modal"
                        title={
                            <div
                                style={{
                                    textAlign: 'left'
                                }}>
                                新建仓库
                            </div>
                        }
                        footer={
                            <>
                                <Button
                                    onClick={() => {
                                        this.setState({
                                            modalVisible: false
                                        })
                                    }}>
                                    取消
                                </Button>
                                <Button
                                    type='primary'
                                    loading={saveLoading}
                                    onClick={() => {
                                        this.handleSaveCodeRepo()
                                    }}>
                                    保存
                                </Button>
                            </>
                        }
                        visible={modalVisible}
                        onCancel={() => {
                            this.setState({
                                modalVisible: false
                            })
                        }}
                        onOk={() => {
                            this.setState({
                                modalVisible: false
                            })
                        }}>
                        <Form
                            ref={this.formRef}
                            autoComplete='off'
                            layout='vertical'
                            initialValues={{
                                repoType: 1
                            }}>
                            <Form.Item
                                label='选择语言'
                                field='repoType'>
                                <Radio.Group name='card-radio-group'>
                                    {[
                                        {
                                            value: 'python',
                                            label: 'Python'
                                        },
                                        {
                                            value: 'rest',
                                            label: 'Rest API'
                                        }
                                    ].map((item) => {
                                        return (
                                            <Radio
                                                key={item.value}
                                                value={item.value}>
                                                {({ checked }) => {
                                                    return (
                                                        <Space
                                                            align='start'
                                                            className={`custom-radio-card ${checked ? 'custom-radio-card-checked' : ''}`}>
                                                            <div className='custom-radio-card-mask'>
                                                            </div>
                                                            <div>
                                                                <div className='custom-radio-card-title'>{item.label}</div>
                                                                {/*<Typography.Text type='secondary'>this is a text</Typography.Text>*/}
                                                            </div>
                                                        </Space>
                                                    );
                                                }}
                                            </Radio>
                                        );
                                    })}
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item
                                label='名称'
                                field='repoName'
                                rules={[{
                                    required: true,
                                    message: '必须填写名称'
                                }]}>
                                <Input
                                    placeholder='请输入名称' />
                            </Form.Item>
                            <Alert style={{marginBottom: '6px'}} content='如果您需要在函数中引用或编辑本体的对象类型，请先绑定一个本体。' />
                            <Form.Item
                                label='绑定本体'
                                field='ontologyId'>
                                <Select
                                    placeholder='请选择本体'
                                    options={ontologyList} />
                            </Form.Item>
                        </Form>
                    </Modal>
                    <Drawer
                        className="repository-code-server"
                        width={'100%'}
                        mask={false}
                        title={null}
                        footer={null}
                        closable={false}
                        visible={codeServerVisible}
                        getPopupContainer={() => {
                            return this.containerRef.current
                        }}>
                        <div
                            className="back-btn"
                            onClick={() => {
                                this.setState({
                                    codeServerVisible: false
                                })
                            }}>
                            <IconBack/>
                            <span
                                className="text">
                                退出
                            </span>
                        </div>
                        <iframe src="https://10.21.20.170/?folder=/home/coder"/>
                    </Drawer>
                </div>
            </Spin>
        )
    }
}

export default RepositoryManager;