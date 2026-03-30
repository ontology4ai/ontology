import React, { useState, useEffect, useMemo } from 'react'
import ChatFlow from './pages/Flow';
import Chat from './pages/Chat';
import './style/index.less'

class AgentApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            active: 1,
            flowData: {
                nodes: [],
                edges: []
            },
            flowNodeActive: '',
            code: ''
        };
        this.chatFlowRef = React.createRef();
        this.codeScrollRef = React.createRef();
        this.aniRef = React.createRef();
    }
    stopCodeScroll = () => {
        cancelAnimationFrame(this.aniRef.current)
    }
    handleCodeScroll = () => {
        const ani = () => {
            this.aniRef.current = requestAnimationFrame(() => {
                this.codeScrollRef.current.scrollTop += 2;
                if (this.codeScrollRef.current.scrollTop + 180 < this.codeScrollRef.current.scrollHeight) {
                    ani()
                }
            })
        }
        ani()
    }
    componentWillUnmount() {
        cancelAnimationFrame(this.aniRef.current)
        /// clearTimeout(this.aniRef.current);
    }
    render() {
        const {
            active,
            flowData,
            flowNodeActive,
            code
        } = this.state;
        return (
            <>
            <div
                className="agent-app-chat">
                <div
                    className="menu-container">
                    <img
                        className="menu-arrow"
                        src={new URL('./imgs/menu-arrow.png', import.meta.url).href}/>
                    <img
                        className="menu-robot"
                        src={new URL('./imgs/menu-robot.png', import.meta.url).href}/>
                    <div
                        className="menu-content">
                        {[
                            {
                                key: 1,
                                title: '模拟仿真'
                            },
                            {
                                key: 2,
                                title: '数据分析'
                            }
                        ].map(item => {
                            return (
                                <div
                                    className={`menu-item ${active === item.key ? 'active' : ''}`}
                                    onClick={() => {
                                        this.setState({
                                            active: item.key,
                                            flowData: {
                                                nodes: [],
                                                edges: []
                                            },
                                            flowNodeActive: '',
                                            code: ''
                                        })
                                    }}>
                                    <div
                                        className="icon">
                                        {active === item.key ? (
                                            
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path d="M16.5 19H11V15H18V11H22V19H19.5L18 20.5L16.5 19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M2 3H18V15H8.5L6.5 17L4.5 15H2V3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M6 11H9" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                                    <path d="M6 7H12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                                </svg>
                                            
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M2 21H22" stroke="white" stroke-width="2"/>
                                                <path d="M2 21H22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M7 14H4V21H7V14Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                                                <path d="M13.5 9H10.5V21H13.5V9Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                                                <path d="M20 3H17V21H20V3Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                                            </svg>
                                        )}
                                    </div>
                                    <div
                                        className="text">
                                        {item.title}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div
                    className="chat-container">
                    <Chat
                        key={active}
                        active={active}
                        send={(flow, code, codeLoading) => {
                            this.setState(() => {
                                return {
                                    flowData: flow || {
                                        nodes: [],
                                        edges: []
                                    },
                                    code
                                }
                            }, () => {
                                if (codeLoading) {
                                    this.handleCodeScroll();
                                }
                            })
                        }}
                        select={text => {
                            this.chatFlowRef.current?.select([text.substring(1, text.length - 1)])
                        }}
                        stopCodeScroll={this.stopCodeScroll}/>
                </div>
                <div
                    className="chat-flow-container">
                    <div
                        className="chat-flow-graph">
                        {flowData.nodes.length > 0 ? (
                            <ChatFlow
                                ref={this.chatFlowRef}
                                data={flowData}/>
                        ) : (
                            <div
                                className="empty">
                                <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58" fill="none">
                                    <path opacity="0.55" d="M36.5187 32.4016C36.5187 34.3957 35.7265 36.3082 34.3164 37.7182C32.9064 39.1283 30.9939 39.9205 28.9998 39.9205C27.0057 39.9205 25.0932 39.1283 23.6831 37.7182C22.2731 36.3082 21.4809 34.3957 21.4809 32.4016H4.93945L13.5109 20.9729C13.651 20.7862 13.8326 20.6346 14.0414 20.5302C14.2502 20.4258 14.4805 20.3714 14.7139 20.3714H43.2857C43.5191 20.3714 43.7493 20.4258 43.9581 20.5302C44.167 20.6346 44.3486 20.7861 44.4887 20.9729L53.0601 32.4016H36.5187ZM32.3749 13.0995H27.3222V5.12109H32.3749V13.0995Z" fill="#6F83A7"/>
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M45.5298 10.9908L41.958 7.23047L36.9023 12.5471L40.479 16.3075L45.5298 10.9908Z" fill="#606C94"/>
                                    <path opacity="0.25" d="M36.5187 32.4014C36.5187 34.3955 35.7265 36.308 34.3164 37.718C32.9064 39.1281 30.9939 39.9203 28.9998 39.9203C27.0057 39.9203 25.0932 39.1281 23.6831 37.718C22.2731 36.308 21.4809 34.3955 21.4809 32.4014H4.93945V50.4467C4.93944 50.8417 5.01723 51.2328 5.16837 51.5977C5.31951 51.9626 5.54105 52.2941 5.82033 52.5734C6.09961 52.8527 6.43117 53.0742 6.79608 53.2253C7.16098 53.3765 7.55208 53.4543 7.94704 53.4542H50.0527C50.4477 53.4543 50.8388 53.3765 51.2037 53.2253C51.5686 53.0742 51.9002 52.8527 52.1794 52.5734C52.4587 52.2941 52.6803 51.9626 52.8314 51.5977C52.9825 51.2328 53.0603 50.8417 53.0603 50.4467V32.4014H36.5187ZM22.7935 12.5482L17.741 7.22949L14.1682 10.9903L19.2206 16.309L22.7935 12.5482Z" fill="#7B94C2"/>
                                </svg>
                                <div
                                    className="text">
                                    暂无数据
                                </div>
                            </div>
                        )}
                    </div>
                    <div
                        className="chat-flow-sh">
                        <svg xmlns="http://www.w3.org/2000/svg" width="280" height="2" viewBox="0 0 280 2" fill="none">
                            <path d="M0 1L280 1.00002" stroke="url(#paint0_linear_5141_796927)"/>
                            <defs>
                                <linearGradient id="paint0_linear_5141_796927" x1="280" y1="1.51205" x2="6.73328" y2="1.51202" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="#50576E" stop-opacity="0.5"/>
                                    <stop offset="0.538528" stop-color="#50576E"/>
                                    <stop offset="1" stop-color="#50576E" stop-opacity="0.5"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <div
                            ref={this.codeScrollRef}>
                            <pre>
                                {code}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
            </>
        )
    }
}

export default AgentApp;
