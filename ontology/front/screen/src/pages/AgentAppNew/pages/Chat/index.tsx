import React, { useState, useEffect, useMemo } from 'react'
import { withTranslation } from 'react-i18next';
import { Table, Button, Switch, Input, Message as ArcoMessage } from '@arco-design/web-react';
import RoundRect from '../../../../components/RoundRect'
import Message from './components/Message';
import Bar from './components/Bar'
import Line from './components/Line'
import Pie from './components/Pie' 
import './style/index.less'
import aiIcon from '../../imgs/ai.png';
import welcomeBg from '../../imgs/welcome-bg.svg';
import sendIcon from '../../imgs/send-btn.png';
import sendIconLong from '../../imgs/send-btn-long.png';
import welcomeTipSvg from '../../imgs/welcome-tip.svg';
import { last } from 'lodash';

 
class Chat extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputVal: '',
            switchVal: true, 
            lastAnimateAiIndex:-1,
            isAnswering: false,
        };
        this.chatContainerRef = React.createRef();
        this.scrollRef = React.createRef()
        this.messageRef = React.createRef();
        
        
    }
    send = (key: string) => {
        const suffix = this.state.switchVal ? '' : '-false';
        this.props.onSendKey?.(key + suffix);
    };
    scrollToBottom = () => {
        const el = this.scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    };
    /** 延迟滚到底部（用于挂载或切换会话后 DOM 尚未布局完成时） */
    scheduleScrollToBottom = () => {
        const run = () => this.scrollToBottom();
        requestAnimationFrame(() => requestAnimationFrame(run));
        [0, 80, 200, 400].forEach((ms) => setTimeout(run, ms));
    };
    sendInputVal = () => {
        return;
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
    componentDidMount() {
        // 切换会话时父组件用 key=activeSessionId 会 remount，此时新消息 DOM 可能未布局完，需延迟滚动
        this.scheduleScrollToBottom();
    }
    // componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    //     if (
    //         prevProps.sessionId !== this.props.sessionId ||
    //         prevProps.messages !== this.props.messages ||
    //         prevProps.messages?.length !== this.props.messages?.length
    //     ) {
    //         this.scrollToBottom();
    //     }
    // }
    componentDidUpdate(prevProps) {
        // 父组件用 key=sessionId，切换会话会 remount，不会走这里；此处仅处理同会话内消息追加
        if (prevProps.sessionId !== this.props.sessionId) {
            this.scheduleScrollToBottom();
            return;
        }
        const prevLen = Array.isArray(prevProps.messages) ? prevProps.messages.length : 0;
        const nextLen = Array.isArray(this.props.messages) ? this.props.messages.length : 0;
        if (prevLen !== nextLen && nextLen > prevLen) {
            // 当前会话内新消息：仅最后一条 AI 消息播放打字动画
            const messages = this.props.messages ?? [];
            let lastAiIndex = -1;
            for (let i = 0; i < messages.length; i++) {
                if (messages[i].type === 'ai') lastAiIndex = i;
            }
            this.setState({ lastAnimateAiIndex: lastAiIndex, isAnswering: lastAiIndex >= 0 });
            requestAnimationFrame(() => {
                this.scrollToBottom();
                setTimeout(this.scrollToBottom, 50);
            });
        }
    }
    render() {
        const {
            inputVal,
            switchVal
        } = this.state;
      //  const data = mockData[this.props.language].data;
        const messages = this.props.messages??[{type:'system'}];
        const welcome = this.props.welcome;
        const { t } = (this.props as any);
        return (
            <div
                className="chat"
                ref={this.chatContainerRef}>
                <div
                    className="message-list-container"
                    ref={this.scrollRef}>
                    {messages.map((message,index) => {
                        if (message.type === 'system') {
                            return (
                                <div
                                    className="message-item-container welcome">
                                    <div
                                        className="message-icon">
                                        <img src={aiIcon} alt="" style={{height:'31px',verticalAlign:'middle'}} />
                                    </div>
                                    <div
                                        className="message-container">
                                            <img className="welcome-bg" src={welcomeBg} alt="" />
                                        <div
                                            className="message welcome ai">
                                                
                                            <div>
                                                {welcome.text}
                                            </div>
                                            <div
                                                className={`welcome-tip-list ${this.state.isAnswering ? 'disabled' : ''}`}>
                                                {welcome.questions.map(item => {
                                                    return (
                                                        <div
                                                            className="welcome-tip"
                                                            onClick={() => {
                                                                if (this.state.isAnswering) return;
                                                                this.send(item.key)
                                                            }}>
                                                            <img src={welcomeTipSvg} alt="" />
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
                                       <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                                            <path d="M15 15.3125C14.0729 15.3125 13.1666 15.0376 12.3958 14.5225C11.6249 14.0074 11.0241 13.2754 10.6693 12.4188C10.3145 11.5623 10.2217 10.6198 10.4026 9.71052C10.5834 8.80123 11.0299 7.966 11.6854 7.31044C12.341 6.65488 13.1762 6.20844 14.0855 6.02757C14.9948 5.8467 15.9373 5.93953 16.7938 6.29432C17.6504 6.6491 18.3824 7.24991 18.8975 8.02077C19.4126 8.79162 19.6875 9.6979 19.6875 10.625C19.6875 11.8682 19.1936 13.0605 18.3146 13.9396C17.4355 14.8186 16.2432 15.3125 15 15.3125ZM15 7.8125C14.4437 7.8125 13.9 7.97745 13.4375 8.28649C12.9749 8.59554 12.6145 9.03479 12.4016 9.5487C12.1887 10.0626 12.133 10.6281 12.2415 11.1737C12.3501 11.7193 12.6179 12.2204 13.0113 12.6137C13.4046 13.0071 13.9057 13.2749 14.4513 13.3835C14.9969 13.492 15.5624 13.4363 16.0763 13.2234C16.5902 13.0105 17.0295 12.6501 17.3385 12.1875C17.6476 11.725 17.8125 11.1813 17.8125 10.625C17.8125 9.87908 17.5162 9.16371 16.9887 8.63626C16.4613 8.10882 15.7459 7.8125 15 7.8125Z" fill="white"/>
                                            <path d="M23.75 24.0625C23.5024 24.0593 23.2658 23.9595 23.0907 23.7843C22.9155 23.6092 22.8157 23.3726 22.8125 23.125C22.8125 20.6875 21.4875 19.0625 15 19.0625C8.5125 19.0625 7.1875 20.6875 7.1875 23.125C7.1875 23.3736 7.08873 23.6121 6.91291 23.7879C6.7371 23.9637 6.49864 24.0625 6.25 24.0625C6.00136 24.0625 5.7629 23.9637 5.58709 23.7879C5.41127 23.6121 5.3125 23.3736 5.3125 23.125C5.3125 17.1875 12.1 17.1875 15 17.1875C17.9 17.1875 24.6875 17.1875 24.6875 23.125C24.6843 23.3726 24.5845 23.6092 24.4093 23.7843C24.2342 23.9595 23.9976 24.0593 23.75 24.0625Z" fill="white"/>
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
                            return <>
                            <Message
                                disableTypingAnimation={index !== this.state.lastAnimateAiIndex}
                                ref={this.messageRef}
                                data={message.data}
                                thinkDurationSec={message.thinkDurationSec}
                                onThinkComplete={(sec) => {
                                    this.setState({ isAnswering: false });
                                    this.props.onThinkComplete?.(index, sec);
                                }}
                                send={(key) => {
                                    this.send(key)
                                }}
                                select={this.props.select}
                                scrollToBottom={this.scrollToBottom}/></>
                        }
                    })}
                </div>
                <div
                    className="send-message-container">
                    {/* <div
                        className="switch">
                        <div
                            className="switch-label">
                            {t('agent.enableOntology')}
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
                    </div> */}
                    <div
                        className="input">
                        <Input
                            value={inputVal}
                            placeholder={t('agent.placeHolderQuestion')}
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
                            this.setState({inputVal:''})
                            // this.messageRef.current?.stopAni();
                            // this.props.stopCodeScroll()
                        }}>
                        {/* <div
                            style={{
                                width: '14px',
                                height: '14px',
                                background: '#9142FF',
                                display: 'inline-block',
                                // opacity: '0.4'
                            }}>
                        </div> */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M14.4916 11.8489L14.0926 5.19922H2.64113L2.24215 11.8489L2.16165 13.2803C2.15502 13.3752 2.13006 13.4679 2.08815 13.5533L1.36719 14.9988H4.30705L6.26696 11.8489L5.91698 14.9988H13.9281C14.0233 14.9989 14.1176 14.9795 14.2051 14.942C14.2926 14.9044 14.3716 14.8494 14.4371 14.7803C14.5026 14.7111 14.5533 14.6294 14.5862 14.54C14.619 14.4506 14.6333 14.3554 14.6281 14.2603L14.4916 11.8489Z" fill="white"/>
                            <path opacity="0.5" d="M8.37025 1C7.99896 1 7.64289 1.14749 7.38035 1.41003C7.11781 1.67257 6.97032 2.02865 6.97032 2.39993V3.0999H3.42975C3.25137 3.0999 3.07971 3.168 2.94985 3.29031C2.81999 3.41261 2.74172 3.57988 2.73103 3.75794L2.64453 5.1998H14.096L14.0095 3.75794C13.9988 3.57987 13.9206 3.4126 13.7907 3.2903C13.6608 3.16799 13.4892 3.09989 13.3108 3.0999H9.77019V2.39993C9.77019 2.02865 9.62269 1.67257 9.36016 1.41003C9.09762 1.14749 8.74154 1 8.37025 1Z" fill="white"/>
                        </svg>
                    </div>
                    <div
                        className={`send ${inputVal ? '' : 'disabled'}`}
                        onClick={this.sendInputVal}>
                            {inputVal?<img className='bg-send-icon' src={sendIconLong}/>:<img className='bg-send-icon' src={sendIcon}/>}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14.8344 1.16443C14.5155 0.84547 14.0509 0.735134 13.6244 0.872359L1.64229 4.72392C1.18704 4.87042 0.871792 5.25613 0.819869 5.73178C0.767946 6.20651 0.993254 6.65156 1.40586 6.8917L5.6487 9.36638L9.31389 5.70026C9.58556 5.42859 10.026 5.42859 10.2976 5.70026C10.5693 5.97193 10.5693 6.41234 10.2976 6.68401L6.63152 10.3501L9.1062 14.593C9.32409 14.9657 9.70888 15.1854 10.1326 15.1854C10.1771 15.1854 10.2225 15.1827 10.268 15.178C10.7427 15.1261 11.1293 14.8109 11.2749 14.3565L15.1274 2.37534C15.2646 1.94605 15.1524 1.48245 14.8344 1.16443Z" fill="white"/>
                        </svg>
                        {inputVal ? <span className='send-text'>{t('agent.send')}</span>:''}
                    </div>
                </div>
            </div>
        )
    }
}

export default withTranslation()(Chat);
