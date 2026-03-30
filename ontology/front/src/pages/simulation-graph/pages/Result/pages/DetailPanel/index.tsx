import React, { useState, useEffect, useMemo } from 'react';
import {
  Table
} from '@arco-design/web-react';
import {
    IconCaretTop,
    IconCaretBottom
} from 'modo-design/icon'
import mockData1 from './mock/data1';
import mockData2 from './mock/data2';
import "./style/index.less";

class ReportPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            data: []
        };
    }
    initData = () => {
        if (this.props.demoExecIndex === 1) {
            this.setState({
                data: mockData1
            })
        }
        if (this.props.demoExecIndex === 2) {
            this.setState({
                data: mockData2
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
            data
        } = this.state;
        return (
            <div
                className="simulation-exec-detail-panel">
                {data.map(item => {
                    if (item.type === 'title') {
                        return (
                            <div className="report-title">
                                {item.data}
                            </div>
                        )
                    }
                    if (item.type === 'think-text') {
                        return (
                            <div
                                className="margin-bottom-14 color-text-4">
                                {item.data}
                            </div>
                        )
                    }
                    if (item.type === 'think-steps') {
                        return (
                            <div className="border-left-2 padding-left-14 color-text-4">
                                {item.data.map(text => {
                                    return (
                                        <div
                                            className="margin-bottom-14">
                                            {text}
                                        </div>
                                    )
                                })}
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
                    if (item.type === 'table') {
                        return (
                            <Table
                            className="margin-bottom-14"
                            columns={[
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
                            ]}
                            data={item.data}
                            pagination={false}
                            border={false}/>
                    
                        )
                    }
                })}
            </div>
        )
    }
}

export default ReportPanel;