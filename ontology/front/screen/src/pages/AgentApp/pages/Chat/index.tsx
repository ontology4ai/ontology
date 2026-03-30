import React, { useState, useEffect, useMemo } from 'react'
import { Table, Button, Switch, Input, Message as ArcoMessage } from '@arco-design/web-react';
import RoundRect from '../../../../components/RoundRect'
import Message from './components/Message';
import Bar from './components/Bar'
import Line from './components/Line'
import Pie from './components/Pie'
import * as chat1 from '../../mock/chat1';
import * as chat2 from '../../mock/chat2';
import './style/index.less'

const mockData = {
    1: chat1,
    2: chat2
}
class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputVal: '',
            switchVal: true,
            welcome: mockData[props.active].welcome,
            messages: [
                {
                    type: 'system'
                }
            ]
        };
        this.chatContainerRef = React.createRef();
        this.scrollRef = React.createRef()
        this.messageRef = React.createRef();
    }
    send = (key) => {
        const {
            messages
        } = this.state;
        
        const data = mockData[this.props.active].data

        this.setState({
            messages: [
                ...messages,
                {
                    type: 'user',
                    data: data[key].question
                },
                {
                    type: 'ai',
                    data: data[key].answer
                }
            ]
        })
        this.props.send(
            mockData[this.props.active].data[key].flow, 
            mockData[this.props.active].data[key].code,
            mockData[this.props.active].data[key].codeLoading)
    }
    sendInputVal = () => {
        const {
            inputVal,
            messages
        } = this.state;

        if (!inputVal) {
            return;
        }
        this.setState(() => {
            return {
                inputVal: '',
                messages: [
                    ...messages,
                    {
                        type: 'user',
                        data: inputVal
                    },
                    {
                        type: 'system'
                    }
                ]
            }
        }, () => {
            const el = this.scrollRef.current;
            el.scrollTop = el.scrollHeight;
        })
    }
    render() {
        const {
            inputVal,
            welcome,
            messages,
            switchVal
        } = this.state;
        const data = mockData[this.props.active].data
        return (
            <div
                className="chat"
                ref={this.chatContainerRef}>
                <div
                    className="message-list-container"
                    ref={this.scrollRef}>
                    {messages.map(message => {
                        if (message.type === 'system') {
                            return (
                                <div
                                    className="message-item-container ai">
                                    <div
                                        className="message-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                          <path d="M15.75 2.33301C15.75 2.8513 15.5247 3.31696 15.1667 3.6374V5.83301H21C22.9331 5.83301 24.5 7.40002 24.5 9.33301V20.9997C24.5 22.9327 22.9331 24.4997 21 24.4997H7C5.06701 24.4997 3.5 22.9327 3.5 20.9997V9.33301C3.5 7.40002 5.06701 5.83301 7 5.83301H12.8333V3.6374C12.4753 3.31696 12.25 2.8513 12.25 2.33301C12.25 1.36651 13.0335 0.583008 14 0.583008C14.9665 0.583008 15.75 1.36651 15.75 2.33301ZM0 11.6663H2.33333V18.6663H0V11.6663ZM28 11.6663H25.6667V18.6663H28V11.6663ZM10.5 16.9163C11.4665 16.9163 12.25 16.1328 12.25 15.1663C12.25 14.1999 11.4665 13.4163 10.5 13.4163C9.5335 13.4163 8.75 14.1999 8.75 15.1663C8.75 16.1328 9.5335 16.9163 10.5 16.9163ZM19.25 15.1663C19.25 14.1999 18.4665 13.4163 17.5 13.4163C16.5335 13.4163 15.75 14.1999 15.75 15.1663C15.75 16.1328 16.5335 16.9163 17.5 16.9163C18.4665 16.9163 19.25 16.1328 19.25 15.1663Z" fill="url(#paint0_linear_5141_794268)"/>
                                          <defs>
                                            <linearGradient id="paint0_linear_5141_794268" x1="16" y1="27.5" x2="16" y2="2" gradientUnits="userSpaceOnUse">
                                              <stop offset="0.124199" stop-color="#E5E3FF"/>
                                              <stop offset="0.697864" stop-color="white"/>
                                            </linearGradient>
                                          </defs>
                                        </svg>
                                    </div>
                                    <div
                                        className="message-container">
                                        <div
                                            className="message welcome ai">
                                            <div>
                                                {welcome.text}
                                            </div>
                                            <div
                                                className="welcome-tip-list">
                                                {welcome.questions.map(item => {
                                                    return (
                                                        <div
                                                            className="welcome-tip"
                                                            onClick={() => {
                                                                this.send(item.key + (switchVal ? '' : '-false'))
                                                            }}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                                <path opacity="0.25" fill-rule="evenodd" clip-rule="evenodd" d="M16.5 8.99998C16.5 10.9891 15.7098 12.8968 14.3033 14.3033C12.8968 15.7098 10.9891 16.5 9 16.5H2.4053C2.33113 16.5 2.25863 16.478 2.19696 16.4368C2.13529 16.3956 2.08723 16.337 2.05885 16.2685C2.03046 16.2 2.02304 16.1246 2.0375 16.0518C2.05197 15.9791 2.08768 15.9123 2.14013 15.8598L3.69668 14.3033C2.82455 13.4311 2.18097 12.3574 1.82294 11.1771C1.46491 9.99684 1.40349 8.74648 1.64412 7.5368C1.88474 6.32712 2.41998 5.19546 3.20243 4.24204C3.98488 3.28863 4.99039 2.5429 6.12988 2.0709C7.26938 1.59891 8.50769 1.41522 9.73513 1.53612C10.9626 1.65701 12.1413 2.07875 13.1668 2.76398C14.1923 3.44921 15.033 4.37677 15.6144 5.46452C16.1958 6.55226 16.5 7.7666 16.5 8.99998ZM5.25 7.87498H6.75V10.125H5.25V7.87498ZM11.25 7.87498H12.75V10.125H11.25V7.87498ZM8.25 7.87498H9.75V10.125H8.25V7.87498Z" fill="white"/>
                                                                <path d="M5.25 7.875H6.75V10.125H5.25V7.875ZM8.25 7.875H9.75V10.125H8.25V7.875ZM12.75 7.875H11.25V10.125H12.75V7.875Z" fill="white"/>
                                                                <path d="M5.25 7.875H6.75V10.125H5.25V7.875ZM8.25 7.875H9.75V10.125H8.25V7.875ZM12.75 7.875H11.25V10.125H12.75V7.875Z" fill="white"/>
                                                            </svg>
                                                            <span
                                                                className="text">
                                                                {item.text}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            {/*<Bar/>
                                            <Line/>
                                            <Pie/>*/}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        if (message.type === 'user') {
                            return (
                                <div
                                    className="message-item-container user">
                                    <div
                                        className="message-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                          <path d="M10 10.3125C9.0729 10.3125 8.16662 10.0376 7.39577 9.52252C6.62491 9.00745 6.0241 8.27536 5.66932 7.41883C5.31453 6.5623 5.2217 5.6198 5.40257 4.71052C5.58344 3.80123 6.02988 2.966 6.68544 2.31044C7.341 1.65488 8.17623 1.20844 9.08552 1.02757C9.9948 0.846703 10.9373 0.939531 11.7938 1.29432C12.6504 1.6491 13.3824 2.24991 13.8975 3.02077C14.4126 3.79162 14.6875 4.6979 14.6875 5.625C14.6875 6.8682 14.1936 8.06049 13.3146 8.93956C12.4355 9.81864 11.2432 10.3125 10 10.3125ZM10 2.8125C9.44374 2.8125 8.89997 2.97745 8.43746 3.28649C7.97495 3.59554 7.61446 4.03479 7.40159 4.5487C7.18872 5.06262 7.13302 5.62812 7.24154 6.17369C7.35006 6.71926 7.61793 7.2204 8.01126 7.61374C8.4046 8.00707 8.90574 8.27494 9.45131 8.38346C9.99688 8.49198 10.5624 8.43628 11.0763 8.22341C11.5902 8.01054 12.0295 7.65006 12.3385 7.18754C12.6476 6.72503 12.8125 6.18126 12.8125 5.625C12.8125 4.87908 12.5162 4.16371 11.9887 3.63626C11.4613 3.10882 10.7459 2.8125 10 2.8125Z" fill="white"/>
                                          <path d="M18.75 19.0625C18.5024 19.0593 18.2658 18.9595 18.0907 18.7843C17.9155 18.6092 17.8157 18.3726 17.8125 18.125C17.8125 15.6875 16.4875 14.0625 10 14.0625C3.5125 14.0625 2.1875 15.6875 2.1875 18.125C2.1875 18.3736 2.08873 18.6121 1.91291 18.7879C1.7371 18.9637 1.49864 19.0625 1.25 19.0625C1.00136 19.0625 0.762903 18.9637 0.587087 18.7879C0.411272 18.6121 0.3125 18.3736 0.3125 18.125C0.3125 12.1875 7.1 12.1875 10 12.1875C12.9 12.1875 19.6875 12.1875 19.6875 18.125C19.6843 18.3726 19.5845 18.6092 19.4093 18.7843C19.2342 18.9595 18.9976 19.0593 18.75 19.0625Z" fill="white"/>
                                        </svg>
                                    </div>
                                    <div
                                        className="message-container">
                                        <div
                                            className="message user">
                                            {message.data}
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        if (message.type === 'ai') {
                            return <Message
                                ref={this.messageRef}
                                data={message.data}
                                send={(key) => {
                                    this.send(key + (switchVal ? '' : '-false'))
                                }}
                                select={this.props.select}
                                scrollToBottom={() => {
                                    const el = this.scrollRef.current;
                                    el.scrollTop = el.scrollHeight;
                                }}/>
                        }
                    })}
                </div>
                <div
                    className="send-message-container">
                    <div
                        className="switch">
                        <div
                            className="switch-label">
                            是否启用本体
                        </div>
                        <div
                            className="switch-btn">
                            <Switch
                                checked={switchVal}
                                onChange={val => {
                                    this.setState({
                                        switchVal: val
                                    })
                                }}/>
                        </div>
                    </div>
                    <div
                        className="input">
                        <Input
                            value={inputVal}
                            placeholder="请输入您的问题"
                            onChange={(val) => {
                                this.setState({
                                    inputVal: val
                                })
                            }}
                            onPressEnter={this.sendInputVal}/>
                    </div>
                    <div
                        className="clear"
                        onClick={() => {
                            this.messageRef.current?.stopAni();
                            this.props.stopCodeScroll()
                        }}>
                        <div
                            style={{
                                width: '14px',
                                height: '14px',
                                background: '#9142FF',
                                display: 'inline-block',
                                // opacity: '0.4'
                            }}>
                        </div>
                        {/*<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14.4916 11.8489L14.0926 5.19922H2.64113L2.24215 11.8489L2.16165 13.2803C2.15502 13.3752 2.13006 13.4679 2.08815 13.5533L1.36719 14.9988H4.30705L6.26696 11.8489L5.91698 14.9988H13.9281C14.0233 14.9989 14.1176 14.9795 14.2051 14.942C14.2926 14.9044 14.3716 14.8494 14.4371 14.7803C14.5026 14.7111 14.5533 14.6294 14.5862 14.54C14.619 14.4506 14.6333 14.3554 14.6281 14.2603L14.4916 11.8489Z" fill="white"/>
                          <path opacity="0.5" d="M8.37025 1C7.99896 1 7.64289 1.14749 7.38035 1.41003C7.11781 1.67257 6.97032 2.02865 6.97032 2.39993V3.0999H3.42975C3.25137 3.0999 3.07971 3.168 2.94985 3.29031C2.81999 3.41261 2.74172 3.57988 2.73103 3.75794L2.64453 5.1998H14.096L14.0095 3.75794C13.9988 3.57987 13.9206 3.4126 13.7907 3.2903C13.6608 3.16799 13.4892 3.09989 13.3108 3.0999H9.77019V2.39993C9.77019 2.02865 9.62269 1.67257 9.36016 1.41003C9.09762 1.14749 8.74154 1 8.37025 1Z" fill="white"/>
                        </svg>*/}
                    </div>
                    <div
                        className={`send ${inputVal ? '' : 'disabled'}`}
                        onClick={this.sendInputVal}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14.8344 1.16443C14.5155 0.84547 14.0509 0.735134 13.6244 0.872359L1.64229 4.72392C1.18704 4.87042 0.871792 5.25613 0.819869 5.73178C0.767946 6.20651 0.993254 6.65156 1.40586 6.8917L5.6487 9.36638L9.31389 5.70026C9.58556 5.42859 10.026 5.42859 10.2976 5.70026C10.5693 5.97193 10.5693 6.41234 10.2976 6.68401L6.63152 10.3501L9.1062 14.593C9.32409 14.9657 9.70888 15.1854 10.1326 15.1854C10.1771 15.1854 10.2225 15.1827 10.268 15.178C10.7427 15.1261 11.1293 14.8109 11.2749 14.3565L15.1274 2.37534C15.2646 1.94605 15.1524 1.48245 14.8344 1.16443Z" fill="white"/>
                        </svg>
                    </div>
                </div>
            </div>
        )
    }
}

export default Chat;
