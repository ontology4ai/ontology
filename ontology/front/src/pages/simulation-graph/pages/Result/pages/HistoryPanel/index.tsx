import React, { useState, useEffect, useMemo } from 'react';
import { Checkbox, Table, Input, Button, Modal } from '@arco-design/web-react';
import { Tag } from 'modo-design';
import { IconTimeColor, IconCaretTop, IconCaretBottom, IconSearchColor } from 'modo-design/icon';
import mockData from './mock/data';
import "./style/index.less";

class HistoryPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            currentIndex: 0,
            data: [],
            columns: [
                {
                    dataIndex: 'changeContent',
                    title: '变更内容',
                    width: 200,
                },
                {
                    dataIndex: 'changeBefore',
                    title: '变更前',
                    width: 200,
                },
                {
                    dataIndex: 'changeAfter',
                    title: '变更后',
                    width: 200,
                },
                {
                    dataIndex: 'changeValue',
                    width: 100,
                    fixed: 'right',
                    title: '变化量',
                    render: (col) => {
                        if (col) {
                            if (col.indexOf('-') > -1) {
                                return (
                                    <div
                                        style={{
                                            display: 'flex',
                                            columnGap: '4px',
                                            alignItems: 'center'
                                        }}>
                                        <IconCaretBottom
                                            style={{
                                                color: 'var(--color-red-6)'
                                            }}/>
                                        {col.substring(1)}
                                    </div>
                                );
                            }
                            return (
                                <div
                                    style={{
                                        display: 'flex',
                                        columnGap: '4px',
                                        alignItems: 'center'
                                    }}>
                                    <IconCaretTop
                                        style={{
                                            color: 'var(--color-green-6)'
                                        }}/>
                                    {col}
                                </div>
                            );
                        }
                        return '--'
                    }
                }
            ],
            diffVisible: false
        };
    }
    initData = () => {
        if (this.props.demoExecIndex === 1) {
            this.setState({
                data: [mockData[0]]
            })
        }
        if (this.props.demoExecIndex === 2) {
            this.setState({
                data: mockData
            })
        }
    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.demoExecIndex !== prevProps.demoExecIndex) {
            this.initData();
        }
    }
    componentDidMount() {
        this.initData();
    }
    render() {
        const {
            currentIndex,
            diffVisible,
            data,
            columns
        } = this.state;
        return (
            <div
                className="simulation-history-panel">
                <div
                    className="simulation-history-list-panel">
                    <div
                        className="simulation-history-list-header">
                        <Input
                            suffix={<IconSearchColor />}/>
                    </div>
                    <div
                        className="simulation-history-list">
                        {data.map((item, index) => {
                            return (
                                <div
                                    className={`simulation-history-item${index === currentIndex ? ' checked' : ''}`}
                                    onClick={() => {
                                        this.setState({
                                            currentIndex: index
                                        })
                                    }}>
                                    <div
                                        className="simulation-history-item-header">
                                        <div
                                            className="simulation-history-item-title">
                                            {item.label}
                                        </div>
                                        <div
                                            className="simulation-history-item-check">
                                            <Checkbox
                                                onChange={val => {
                                                    const currentData = [...data];
                                                    currentData.splice(index, 1, {
                                                        ...item,
                                                        checked: val
                                                    })
                                                    this.setState({
                                                        data: [...currentData]
                                                    })
                                                }}>
                                            </Checkbox>
                                        </div>
                                    </div>
                                    <div
                                        className="simulation-history-item-footer">
                                        <IconTimeColor/>
                                        {item.time}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div
                        className="simulation-history-list-footer">
                        <div
                            class="select-container">
                            <div
                                className="pos-left">
                                已选择：{data.filter(item => item.checked).length} / {data.length}
                            </div>
                            <div
                                className="pos-right">
                                <Button type="text">清空</Button>
                            </div>
                        </div>
                        <Button
                            type="primary"
                            onClick={() => {
                                if (data.filter(item => item.checked).length === 2) {
                                    this.setState({
                                        diffVisible: true
                                    })
                                }
                            }}>
                            对比分析
                        </Button>
                    </div>
                </div>
                <div
                    className="simulation-history-detail">
                    {data[currentIndex] && data[currentIndex].data.map(item => {
                        if (item.type === 'title') {
                            return (
                                <div className="report-title">
                                    {item.data}
                                </div>
                            )
                        }
                        if (item.type === 'text') {
                            return (
                                <div className="margin-bottom-14">
                                    {item.data}
                                </div>
                            )
                        }
                        if (item.type === 'pre-text') {
                            return (
                                <pre>
                                    {item.data}
                                </pre>
                            )
                        }
                        if (item.type === 'source') {
                            return (
                                <div
                                    className="source">
                                    {/*<div
                                        className="source-title">
                                        变更源
                                    </div>*/}
                                    <div>
                                        {item.data.map(table => {
                                            return (
                                                <div className="table">
                                                    <div
                                                        className="table-title">
                                                        {table.title}
                                                    </div>
                                                    <Table
                                                        columns={columns}
                                                        data={table.data}
                                                        pagination={false}
                                                        border={false}/>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        }
                        if (item.type === 'rel-result') {
                            return (
                                <div
                                    className="rel-result">
                                    <div
                                        className="rel-result-title">
                                        影响结果
                                    </div>
                                    <div>

                                        {item.data.map(table => {
                                            return (
                                                <div className="table">
                                                    <div
                                                        className="table-title">
                                                        {table.title}
                                                    </div>
                                                    <Table
                                                        className="margin-bottom-14"
                                                        columns={columns}
                                                        data={table.data}
                                                        pagination={false}
                                                        border={false}/>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        }
                    })}
                </div>
                <Modal
                    title='仿真方案对比分析'
                    className="simulation-plan-diff-analysis-modal"
                    style={{
                        width: '90%'
                    }}
                    visible={diffVisible}
                    onOk={() => {}}
                    onCancel={() => {
                        this.setState({
                            diffVisible: false
                        })
                    }}
                    autoFocus={false}
                    focusLock={true}
                    footer={null}>
                    {data.length == 2 && (
                    <>
                    <div
                        className="simulation-plan-diff-analysis">
                        <div>
                            <div
                                className="diff-table-title">
                                {data[0].label}
                            </div>
                            <div
                                className="diff-table-descr">
                                {data[0].descr}
                            </div>
                            <div
                                className="diff-table">
                                <Table
                                    columns={[
                                        {
                                            dataIndex: 'a',
                                            render: (col, row, index) => {
                                                return (
                                                    <div
                                                        className="status-text">
                                                        <div
                                                            className="status">
                                                            {row.status === 'red' ? (
                                                                <IconCaretBottom
                                                                    style={{
                                                                        color: 'var(--color-red-6)'
                                                                    }}/>
                                                            ) : (
                                                                <IconCaretTop
                                                                    style={{
                                                                        color: 'var(--color-green-6)'
                                                                    }}/>
                                                            )}
                                                        </div>
                                                    <div
                                                        className={`text ${row.status}`}
                                                        style={{
                                                            color: `var(--color-${row.status}-6)`
                                                        }}>
                                                        {col}
                                                    </div>
                                                    </div>
                                                )
                                            }
                                        },
                                        {
                                            dataIndex: 'b',
                                            width: 100,
                                            render: (col, row, index) => {
                                                return (
                                                    <Tag
                                                        effect='plain'
                                                        color={row.status}
                                                        size="small">
                                                        {col}
                                                    </Tag>
                                                )
                                            }
                                        }
                                    ]}
                                    data={[
                                        {
                                            status: 'red',
                                            a: '成本增加90元/月',
                                            b: '中等成本'
                                        },
                                        {
                                            status: 'green',
                                            a: '网络性能提升60%',
                                            b: '较高性能'
                                        },
                                        {
                                            status: 'green',
                                            a: '客户满意度提升20.5%',
                                            b: '中高满意度'
                                        }
                                    ]}
                                    showHeader={false}
                                    pagination={false}
                                    border={false}/>
                            </div>
                        </div>
                        <div>
                            <div
                                className="diff-table-title">
                                {data[1].label}
                            </div>
                            <div
                                className="diff-table-descr">
                                {data[1].descr}
                            </div>
                            <div
                                className="diff-table">
                                <Table
                                    columns={[
                                        {
                                            dataIndex: 'a',
                                            render: (col, row, index) => {
                                                return (
                                                    <div
                                                        className="status-text">
                                                        <div
                                                            className="status">
                                                            {row.status === 'red' ? (
                                                                <IconCaretBottom
                                                                    style={{
                                                                        color: 'var(--color-red-6)'
                                                                    }}/>
                                                            ) : (
                                                                <IconCaretTop
                                                                    style={{
                                                                        color: 'var(--color-green-6)'
                                                                    }}/>
                                                            )}
                                                        </div>
                                                    <div
                                                        className={`text ${row.status}`}
                                                        style={{
                                                            color: `var(--color-${row.status}-6)`
                                                        }}>
                                                        {col}
                                                    </div>
                                                    </div>
                                                )
                                            }
                                        },
                                        {
                                            dataIndex: 'b',
                                            width: 100,
                                            render: (col, row, index) => {
                                                return (
                                                    <Tag
                                                        effect='plain'
                                                        color={row.status}
                                                        size="small">
                                                        {col}
                                                    </Tag>
                                                )
                                            }
                                        }
                                    ]}
                                    data={[
                                        {
                                            status: 'red',
                                            a: '成本增加90元/月、440元',
                                            b: '中高成本'
                                        },
                                        {
                                            status: 'green',
                                            a: '网络性能提升90%',
                                            b: '高性能'
                                        },
                                        {
                                            status: 'green',
                                            a: '客户满意度提升24.7%',
                                            b: '高满意度'
                                        }
                                    ]}
                                    showHeader={false}
                                    pagination={false}
                                    border={false}/>
                            </div>
                        </div>
                    </div>
                    <div
                        className="simulation-plan-diff-recommend">
                        <Tag effect='plain' color="blue" size="small">建议</Tag>
                        <span className="text">在不考虑其他因素影响的情况下，更新客户套餐并增加网络设备方案优于仅更新客户套餐的方案。</span>
                    </div>
                    </>
                    )}
                  </Modal>
            </div>
        )
    }
}

export default HistoryPanel;