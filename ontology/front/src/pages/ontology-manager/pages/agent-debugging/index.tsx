import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Tooltip,Popover ,Typography} from '@arco-design/web-react'
import { IconSwapLeft } from 'modo-design/icon';
import agentIcon from './imgs/agent.png';
import testIcon from './imgs/test.svg';
import simulateIcon from './imgs/simulate.svg';
import decorateIcon1 from './imgs/decorate1.svg';
import decorateIcon2 from './imgs/decorate2.svg';
import axios from 'modo-plugin-common/src/core/src/http';
import { getConfig, getAgent } from './api';
import './style/index.less';
import getAppName from "modo-plugin-common/src/core/src/utils/getAppName";

const global = require('global');

class AiContent extends React.Component{
    constructor(props: any) {
        super(props);
        this.state = {
             
        };
        
    }
    gotoTest=()=>{
        // const appName = getAppName();
        // let url = `${window.location.protocol}//${location.host}/${appName}/test_chats/${this.props.agentId}`;
        // window.open(url)
        this.props.onTestClick && this.props.onTestClick();
        // 关闭 Popover
        this.props.onClosePopover && this.props.onClosePopover();
    }
    gotoSimulate = ()=>{
        const appName = getAppName();
        let url = `${window.location.protocol}//${location.host}/${appName}/ontology_simulation`;
        let href = window.location.href;
        if(href.endsWith('ontology_manager')){
          href = href.slice(0,href.indexOf('ontology_manager'))+'ontology_simulation';
        }
        window.open(href);
        // 关闭 Popover
        this.props.onClosePopover && this.props.onClosePopover();
    }
    render(): React.ReactNode {
        return (
            <div className="agent-popover-container">
                <div className="agent-head">
                    <div className="agent-icon">
                        <img src={agentIcon} alt="" />
                    </div>
                    <div className="agent-head-info">
                        <span className="info-title">智能助手</span>
                        <Typography.Text type='secondary'>我可以帮您验证本体的可用性和准确性</Typography.Text>
                    </div>
                </div>
                <div className="agent-body">
                    <div className="agent-card" onClick={()=>this.gotoTest()}>
                        <div className="agent-card-head">
                            <div className="left-title">
                                <img src={testIcon} alt="" />
                                <span>测试验证</span>
                            </div>
                            <div className="right-icon">
                                <img src={decorateIcon1} alt="" />
                            </div>
                        </div>
                        <div className="agent-card-body">
                            <div className="card-content">
                                在本体知识体系下，结合具体场景进行问答验证大模型返回结果是否达到预期
                            </div>
                        </div>
                    </div>
                    <div className="agent-card" onClick={()=>this.gotoSimulate()}>
                        <div className="agent-card-head">
                            <div className="left-title">
                                <img src={simulateIcon} alt="" />
                                <span>仿真模拟</span>
                            </div>
                            <div className="right-icon">
                                <img src={decorateIcon2} alt="" />
                            </div>
                        </div>
                        <div className="agent-card-body">
                            <div className="card-content">
                                在沙箱环境中模拟业务执行，借助本体知识预测对数据可能产生哪些影响
                            </div>
                        </div>
                    </div>
                </div>
                <div className="agent-footer">
                    <Typography.Text type='secondary'>点击选项直接进入对应功能模块</Typography.Text>
                </div>
            </div>
        )
    }
}
 


class AgentDebugging extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            ws_token: null,
            // ws_token: 'x',
            visible: false,
            difyVisible: false,
            knowledge: '',
            userId: '',
            conversation_id: '',
            agent_type: null,
            agent_path: '',
            agent_token: '',
            agent_prompt: '',
            agent_url_search: '',
            agentId: '',
            agentAuth: '',
            context_path: '',
            popoverVisible: false
        };
        this.btnRef = React.createRef();
    }
    compressAndEncodeBase64 = async (input) => {
        const uint8Array = (new TextEncoder).encode(input);
        const compressedStream = new Response(new Blob([uint8Array]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
        const compressedUint8Array = new Uint8Array(await compressedStream);
        return btoa(String.fromCharCode(...compressedUint8Array))
    }
    getAgentConfig = (callback) => {
        getAgent({
            ontologyId: this.props.agentId
        }).then(res => {
            if (res.data?.success) {
                this.setState(() => {
                    return {
                        agentId: res.data?.data.agentId,
                        agentAuth: res.data?.data.auth,
                    }
                }, () => {
                    callback()
                })
                return;
            }
            throw res.data?.devMsg;
        }).catch(err => {
            console.log(err)
        })
    }
    async componentDidMount() {
        getConfig().then(res => {
            if (res.data.success) {
                const { data } = res.data;
                let {
                    agent_type,
                    context_path
                } = data;
                // agent_type = 'dify';
                this.setState({
                    agent_type,
                    context_path: context_path || '',
                    agent_token: data.agent_token,
                    // agent_prompt: data.agent_prompt
                })
                if (agent_type === 'dify') {
                    axios.get(`${window.location.origin}${context_path}/ontology/_api/ontology/prompt/agent?id=${this.props.agentId}`).then((res) => {
                        if (res.data.success) {
                            this.compressAndEncodeBase64(res.data.data.prompt).then(res => {
                                this.setState({
                                    // agent_prompt: res,
                                    agent_url_search: new URLSearchParams({prompt: res})
                                })

                            })
                        }
                    }).catch(err => {
                        console.log(err);
                    })
                }
                if (agent_type !== 'dify') {
                    this.getAgentConfig(() => {
                        axios.post(`${window.location.origin}${context_path}/console/api/v1/user/third/dologin`, {
                            auth: this.state.agentAuth
                            // "auth":"Ues28JYNhLHx4+BWHrEfJCEsOHCiqXMGeoJzgTalzIJ9qsZcojKyIhfPuU9RzdW9lM82RvAKNkUucDsXwQXpJQl1hBUeD4YavVXby6n76mOnGqLB8dRjj4JZRPEh0N7YChIrKmmq1CnGSA0cm68LNqH2GtbpHrpnxdK5ZkyKbDbk0npjs+1HhyzamQxq0zZVo5nmSUNpJhvm1wdmol3NSgF/ZR3Xtb9dedyT2WQjYNHS7tsnME0307xnn8plSYLgKqT4syOGuRcniyJAYX7uDpX7TkJsPPgxFa9PDCrQYoj4Rtd3S7SaLzkDImlBsRe6tuW6aLd319yFNa+wYub8EQ=="
                        }).then(res => {
                            if (res?.data?.data?.access_token) {
                                localStorage.setItem('ws_token', res.data.data.access_token)
                                this.setState({
                                    ws_token: res.data.data.access_token
                                })
                            }
                        })
                    })

                }
            }
        })
        this.setState({
            knowledge: await this.compressAndEncodeBase64(this.props.label),
            user_id: await this.compressAndEncodeBase64('c91477ec-a62b-48bd-b003-7d0f758d3fff'),
            conversation_id: await this.compressAndEncodeBase64('9bb4c1d8-96f4-4b2f-9755-a409407bda15'),
            // response_mode: await this.compressAndEncodeBase64('streaming')
        })
    }
    render() {
        const {
            visible,
            difyVisible,
            agent_token,
            agent_type,
            agent_path,
            agent_prompt,
            agent_url_search,
            knowledge,
            conversation_id,
            user_id,
            ws_token,
            context_path
        } = this.state;
        const {
            agentId
        } = this.props;
        return (
            <>
            <Popover
                    content={
                        <AiContent
                            agentId={agentId}
                            onTestClick={() => {
                                if (agent_type === 'dify') {
                                    global.localStorage.removeItem('conversationIdInfo');
                                    this.setState({
                                        difyVisible: true
                                    })
                                } else {
                                    this.setState({
                                        visible: true
                                    })
                                }
                            }}
                            onClosePopover={() => {
                                this.setState({
                                    popoverVisible: false
                                });
                            }}
                        />
                    }
                    position='lb'
                    trigger="hover"
                    popupVisible={this.state.popoverVisible}
                    onVisibleChange={(v) => {
                        this.setState({
                            popoverVisible: v
                        });
                    }}
                >
                <img
                    ref={this.btnRef}
                    className="agent-debugging-btn"
                    src={agentIcon}
                    />
            </Popover>
            {/* <Tooltip
                content={'智能体调试'}>
                <img
                    ref={this.btnRef}
                    className="agent-debugging-btn"
                    src={agentIcon}
                    onClick={() => {
                        if (agent_type === 'dify') {
                            global.localStorage.removeItem('conversationIdInfo');
                            this.setState({
                                difyVisible: true
                            })
                        } else {
                            this.setState({
                                visible: true
                            })
                        }
                    }}/>
            </Tooltip> */}
            <Drawer
                wrapClassName="agent-dify-debugging-drawer"
                width={'30%'}
                title={null}
                footer={null}
                mask={false}
                visible={difyVisible}
                unmountOnExit={true}
                focusLock={false}
                onCancel={() => {
                    this.setState({
                        difyVisible: false
                    })
                }}
                placement={'right'}
                getPopupContainer={() => this.props.popupRef.current}>
                <div
                    className="agent-dify-debugging">
                    <iframe
                        //src={`http://10.21.20.170:6060/chatbot/mUSfqKGSJV3DyG8S?knowledge=H4sIAAAAAAAACgEVAOr%2F6L%2BQ6JCl5ZWG6JCl6ZSA5pys5L2T%2BRhp5RUAAAA%3D`}/>
                        //src={`http://10.21.20.170:6060/chatbot/mUSfqKGSJV3DyG8S?knowledge=${knowledge}&sys.user_id=${user_id}&sys.conversation_id=${conversation_id}`}/>
                        // src={`${agent_path}/chatbot/mUSfqKGSJV3DyG8S?knowledge=${knowledge}&sys.user_id=${user_id}`}
                        // src={`http://10.21.20.170:1909/chatbot/${agent_token}?${agent_url_search}`}
                        src={`${context_path}/chatbot/${agent_token}`}/>
                </div>
            </Drawer>
            <Drawer
                wrapClassName="agent-debugging-drawer"
                width={'100%'}
                title={null}
                footer={null}
                mask={false}
                visible={visible}
                unmountOnExit={true}
                placement={'right'}
                getPopupContainer={() => this.props.popupRef.current}>
                <div
                    className="agent-debugging">
                    <div
                        className="agent-debugging-header">
                        <span
                            onClick={() => {
                                this.setState(() => {
                                    return {
                                        visible: false
                                    }
                                }, () => {
                                    // this.props.back()
                                })
                            }}>
                            <IconSwapLeft />
                            返回
                        </span>
                    </div>
                    {ws_token ? <iframe src={`${context_path}/agent-vue/edit/${this.state.agentId}?catalog=single`}/> : null}
                    {/*ws_token ? <iframe src={`/agent-vue/edit/${agentId}?catalog=five-steps`}/> : null*/}
                </div>
            </Drawer>
            </>
        )
    }
}



export default AgentDebugging;
