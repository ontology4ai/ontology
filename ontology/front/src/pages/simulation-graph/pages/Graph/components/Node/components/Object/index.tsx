import React, { useState, useEffect, useMemo } from 'react';
import {
    Spin,
    Progress
} from '@arco-design/web-react';
import {
    IconCheckCircle
} from '@arco-design/web-react/icon';
import {
    IconMpcShiticaozuo,
    IconForbidden,
    IconInformationFill,
    IconDataResDirColor,
    IconErrorFill,
    IconInformation
} from 'modo-design/icon';
import {
    Tag
} from 'modo-design';
import './style/index.less';

class ObjectNode extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            dataLoadPercent: props.data.dataLoadPercent
        };
    }
    startLoadingAni = () => {
        const ani = () => {
            requestAnimationFrame(() => {
                const {
                    dataLoadPercent
                } = this.state;
                this.setState(() => {
                    return {
                        dataLoadPercent: dataLoadPercent + ((100 - dataLoadPercent) / 200)
                    }
                }, () => {
                    if (this.state.dataLoadPercent < 80) {
                        ani();
                    }
                })
            })
        }
        ani()
    }
    componentDidMount() {

    }
    componentDidUpdate(prevProps, prevState) {
        if (this.props.data.dataLoadStatus === 0 && prevProps.data.dataLoadStatus !== 0) {
            this.setState({
                dataLoadPercent: this.props.data.dataLoadPercent || 0
            })
            this.startLoadingAni()
        }
    }
    render() {
        const {
            data,
            selected
        } = this.props;
        const {
            dataLoadPercent
        } = this.state;
        return (
            <div
                className={`object-node data-status-${data.dataStatus} ${(data.simulationStart && !data.animated) ? 'execution-status-3' : ''} ${!data.simulationStart && !data.animated && data?.executionRelActions?.length > 0 && data.executionStatus !== 'failed' ? 'execution-status-4' : ''} data-load-status-${data.dataLoadStatus} status-${data.status}${data.executionStatus ? ' execution-status-' + data.executionStatus : ''}${data.animated ? ' animated' : ''}${selected ? ' selected' : ''}${data.highlighted ? ' highlighted' : ''}`}>
                <div
                    className="node-header">
                    <div
                        className="node-title">
                        对象
                    </div>
                    <div
                        className="node-status">
                        {data.dataStatus === 0 && (
                            <div>
                                <IconInformation />
                                无数据配置
                            </div>
                        )}
                        {data.status === '2' && (
                            <div>
                                <Spin size="12"/>
                                数据加载中
                            </div>
                        )}
                        {data.dataStatus === 1 && (
                            <div>
                                <IconCheckCircle />
                                已完成数据配置
                            </div>
                        )}
                    </div>
                    {/*<div
                        className="node-oper-group">
                    </div>*/}
                </div>
                <div
                    className="node-content">
                    <div
                        className="node-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.5937 0.833252L3.55154 0.833252C2.50413 0.833252 1.65503 1.68235 1.65503 2.72977L1.65504 18.2132C1.65505 18.4654 1.75522 18.7072 1.93352 18.8855C2.11183 19.0639 2.35366 19.164 2.60582 19.164L11.5937 19.164C11.8459 19.1639 12.0877 19.0638 12.266 18.8855C12.4443 18.7072 12.5445 18.4653 12.5445 18.2132L12.5445 1.78403C12.5445 1.53187 12.4443 1.29004 12.266 1.11173C12.0877 0.93343 11.8459 0.833257 11.5937 0.833252ZM4.15492 8.08629C4.15492 7.53185 4.60439 7.08238 5.15884 7.08238H7.16666C7.72111 7.08238 8.17057 7.53185 8.17057 8.08629C8.17057 8.64074 7.72111 9.09021 7.16666 9.09021H5.15884C4.60439 9.09021 4.15492 8.64074 4.15492 8.08629ZM10.1784 12.1019C10.1784 12.6563 9.72896 13.1057 9.17454 13.1057H5.15878C4.60437 13.1057 4.15492 12.6563 4.15492 12.1019C4.15492 11.5475 4.60437 11.098 5.15878 11.098H9.17454C9.72895 11.098 10.1784 11.5475 10.1784 12.1019Z" fill="#6687EE"/>
                            <path d="M7.22213 7.08325C7.74577 7.08325 8.17026 7.50774 8.17026 8.03138V8.14293C8.17026 8.66657 7.74577 9.09106 7.22213 9.09106H5.10279C4.57915 9.09106 4.15466 8.66657 4.15466 8.14293V8.03138C4.15466 7.50774 4.57915 7.08325 5.10279 7.08325H7.22213Z" fill="#CCE2FF"/>
                            <path d="M5.10279 13.1066H9.23001C9.75365 13.1066 10.1781 12.6821 10.1781 12.1585V12.047C10.1781 11.5234 9.75365 11.0989 9.23001 11.0989H5.10279C4.57915 11.0989 4.15466 11.5234 4.15466 12.047V12.1585C4.15466 12.6821 4.57915 13.1066 5.10279 13.1066Z" fill="#CCE2FF"/>
                            <path d="M14.0348 8.03598C15.3162 8.05552 16.5928 7.87615 17.8191 7.50427C18.1773 7.38883 18.5222 7.23581 18.8482 7.04775V8.43711C18.8482 9.32325 16.6932 10.0416 14.0347 10.0416C13.8996 10.0416 13.7659 10.0398 13.6337 10.0361V8.03088C13.7666 8.03428 13.9003 8.03598 14.0348 8.03598Z" fill="#8AAFFD"/>
                            <path d="M14.0348 6.83258C16.6933 6.83258 18.8484 6.1142 18.8484 5.22807C18.8484 4.34191 16.6932 3.62354 14.0347 3.62354L13.8834 3.62431C13.7996 3.62518 13.7164 3.62676 13.6337 3.62903V6.82708C13.766 6.83075 13.8997 6.83258 14.0348 6.83258Z" fill="#8AAFFD"/>
                            <path d="M14.0348 16.4597C13.8997 16.4597 13.766 16.4579 13.6337 16.4542L13.6335 14.449C13.7664 14.4524 13.9001 14.454 14.0347 14.454C15.3161 14.4736 16.5927 14.2942 17.8191 13.9224C18.1773 13.8069 18.5224 13.6539 18.8484 13.4658V14.8552C18.8484 15.7413 16.6934 16.4597 14.0348 16.4597Z" fill="#8AAFFD"/>
                            <path d="M18.8484 10.2568V11.6461C18.8484 12.5323 16.6932 13.2507 14.0348 13.2507C13.8997 13.2506 13.766 13.2488 13.6337 13.2452V11.2399C13.7666 11.2433 13.9003 11.245 14.0348 11.245C15.3162 11.2646 16.5928 11.0852 17.8191 10.7133C18.1773 10.5979 18.5224 10.4449 18.8484 10.2568Z" fill="#8AAFFD"/>
                        </svg>
                    </div>
                    <div
                        className="node-info">
                        <div
                            className="label">
                            <span className="text">{data.label || '--'}</span>
                            <div
                                className="node-execution-status">
                                {/*data.executionStatus === 'success' && (
                                    <Tag
                                        size="small"
                                        color='green'
                                        effect='plain'>
                                        正常
                                    </Tag>
                                )*/}
                                {data.executionStatus === 'failed' && (
                                    <Tag
                                        size="small"
                                        color='red'
                                        effect='plain'>
                                        未生效
                                    </Tag>
                                )}
                                {data.simulationStart && !data.animated && (
                                    <Tag size="small" effect='plain' color="arcoblue">变更源</Tag>
                                )}
                                {!data.simulationStart && !data.animated && data?.executionRelActions?.length > 0 && data.executionStatus !== 'failed' && (
                                    <Tag size="small" effect='plain' color="orange">有影响</Tag>
                                )}
                                {!data.simulationStart && !data.animated && data?.executionRelActions?.length == 0 && data.executionStatus === 'success' && (
                                    <Tag size="small" effect='plain' color="green">无影响</Tag>
                                )}
                                {data.executionStatus === 5 && (
                                    <Tag size="small" effect='plain' color="red">告警</Tag>
                                )}
                            </div>
                        </div>
                        <div
                            className="name">
                            {data.name || '--'}
                        </div>
                    </div>
                </div>
                <div
                    className="node-execution-result">
                    {[0, 1].indexOf(data.dataLoadStatus) > -1 && (
                        <div
                            className="node-data-loading">
                            <div
                                className="text">
                                数据加载中
                            </div>
                            <div
                                className="progress">
                                <Progress
                                    percent={dataLoadPercent}
                                    color='var(--color-geekblue-5)'
                                    showText={false}
                                />
                            </div>
                        </div>
                    )}
                    <div
                        className="node-execution-result-content">
                        {data.dataLoadStatus === 3 && (
                            <div
                                className="node-data-load-result">
                                <div
                                    className="icon">
                                    <IconErrorFill />
                                </div>
                                <div
                                    className="text">
                                    数据加载失败
                                </div>
                            </div>
                        )}
                        {data.dataLoadStatus === 4 && (
                            <div
                                className="node-data-load-result">
                                <div
                                    className="icon">
                                    <IconErrorFill />
                                </div>
                                <div
                                    className="text">
                                    对象未绑定数据源
                                </div>
                            </div>
                        )}
                        {data.simulationStart && !data.animated && (
                            <>
                                <div>
                                    <span className="label">执行动作</span>
                                    <span className="value">{data.simulationStartData?.originalAction?.label}</span>
                                </div>
                                <div>
                                    <span className="label">分析数据</span>
                                    <span className="value">{data.simulationStartData?.selectedInstances?.length}</span>
                                </div>
                            </>
                        )}
                        {!data.simulationStart && !data.animated && data?.executionRelActions?.length > 0 && data.executionStatus !== 'failed' && (
                            <>
                                <div>
                                    <span className="label">触发事件: </span>
                                    <span className="value">
                                        {data?.executionRelActions.map(action => {
                                            return action
                                        }).join('、')}
                                    </span>
                                </div>
                            </>
                        )}
                        {data.executionStatus === 5 && (
                            <>
                                <div>
                                    <span className="label">触发事件: </span>
                                    <span className="value">动作名称1、动作名称2</span>
                                </div>
                                <div>
                                    <span className="label">触发告警: </span>
                                    <span className="value">告警名称1、告警名称2</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>                        
        )
    }
}

export default ObjectNode;