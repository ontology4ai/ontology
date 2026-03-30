import React, { useState, useEffect, useMemo } from 'react'
import { withTranslation } from 'react-i18next';
import ChatFlow from './pages/Flow';
import Chat from './pages/Chat';
import { getAgentPrompt, getAgentLabels } from './locale';
import * as chat1 from './mock/chat1';
import * as chat2 from './mock/chat2';
import './style/index.less'

const APP_LANGUAGE_KEY = 'app_language';

const mockData = {
    zh: chat1,
    en: chat2,
};

class AgentApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeSessionId: 1,
            flowData: {
                nodes: [],
                edges: []
            },
            flowNodeActive: '',
            code: '',
            chatHistory: [
                // {
                //     id: 1,
                //     time: '2026-01-27 10:00:00',
                //     title: '模拟仿sssssssssssssssssssssssssssssss真',
                // },
                // {
                //     id: 2,
                //     time: '2026-01-27 10:00:00',
                //     title: '模拟仿ddsdsssssssssssssdsdweeeeeeeeeesssssssssssssssssssssssssssssssssssssss真',
                // },
                // {
                //     id: 3,
                //     time: '2026-01-27 10:00:00',
                //     title: '模拟仿ddsdsssssssssssssdsdweeeeeeeeeesssssssssssssssssssssssssssssssssssssss真',
                // },
                
            ],
            chatSessions: [],
            animateFlow: false,
            flowVersion: 0
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

    getLanguage = () => {
        const locale = typeof localStorage !== 'undefined' ? localStorage.getItem(APP_LANGUAGE_KEY) : null;
        return (locale && mockData[locale]) ? locale : 'zh';
    }

    getActiveSession = () => {
        const { activeSessionId, chatSessions } = this.state;
        return chatSessions.find(s => s.id === activeSessionId);
    }

    initSessionsIfNeeded = () => {
        if (this.state.chatSessions && this.state.chatSessions.length > 0) {
            return;
        }
        const history = this.state.chatHistory || [];
        const chatSessions = history.length > 0
            ? history.map(item => ({
                id: item.id,
                title: item.title,
                time: item.time,
                messages: [{ type: 'system' }],
                flowData: { nodes: [], edges: [] },
                code: '',
            }))
            : [{
                id: 1,
                title: '新对话',
                time: this.formatTime(new Date()),
                messages: [{ type: 'system' }],
                flowData: { nodes: [], edges: [] },
                code: '',
            }];
        const activeSession = chatSessions.find(s => s.id === this.state.activeSessionId) || chatSessions[0];
        this.setState({
            chatSessions,
            activeSessionId: activeSession?.id ?? 1,
            flowData: activeSession?.flowData ?? { nodes: [], edges: [] },
            code: activeSession?.code ?? '',
        });
    }

    componentDidMount() {
        this.initSessionsIfNeeded();
    }

    handleSelectSession = (sessionId) => {
        const next = (this.state.chatSessions || []).find(s => s.id === sessionId);
        this.setState({
            activeSessionId: sessionId,
            flowData: next?.flowData ?? { nodes: [], edges: [] },
            code: next?.code ?? '',
            animateFlow: false,
        })
    }

    handleThinkComplete = (messageIndex, durationSec) => {
        this.setState(prev => {
            const sessions = prev.chatSessions || [];
            const sessionIndex = sessions.findIndex(s => s.id === prev.activeSessionId);
            if (sessionIndex === -1) return null;
            const session = sessions[sessionIndex];
            const messages = [...(session.messages || [])];
            if (messageIndex < 0 || messageIndex >= messages.length) return null;
            const msg = messages[messageIndex];
            if (msg.type !== 'ai') return null;
            messages[messageIndex] = { ...msg, thinkDurationSec: durationSec };
            const nextSessions = sessions.map((s, i) => i === sessionIndex ? { ...s, messages } : s);
            return { chatSessions: nextSessions };
        });
    }

    formatTime = (date: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    handleAddChat = () => {
        const { chatSessions } = this.state;
        const newId = chatSessions.length > 0
            ? Math.max(...chatSessions.map(s => s.id)) + 1
            : 1;
        const now = this.formatTime(new Date());
        const newSession = {
            id: newId,
            title: '新对话',
            time: now,
            messages: [{ type: 'system' }],
            flowData: { nodes: [], edges: [] },
            code: '',
        };
        const nextSessions = [...(chatSessions || []), newSession];
        this.setState({
            chatSessions: nextSessions,
            activeSessionId: newId,
            flowData: { nodes: [], edges: [] },
            code: '',
        });
    }

    handleSendKey = (key) => {
        const language = this.getLanguage();
        const mock = mockData[language] || mockData.zh;
        const datum = mock?.data?.[key];

        const baseKey = String(key).endsWith('-false') ? String(key).slice(0, -6) : String(key);
        const welcomeQuestion = mock?.welcome?.questions?.find(q => String(q.key) === String(baseKey));
        const question = datum?.question || welcomeQuestion?.text;

        if (!question) {
            // mock 未配置，至少不要崩溃
            return;
        }

        const answer = datum?.answer || [{ type: 'text', data: '（暂无回答，待补充）' }];
        const flow = datum?.flow;
        const code = datum?.code;
        const codeLoading = datum?.codeLoading;

        const { activeSessionId, chatSessions } = this.state;
        const nextSessions = (chatSessions || []).map(s => {
            if (s.id !== activeSessionId) return s;
            const isFirstMessage = (s.messages || []).length === 1;
            const nextSession = {
                ...s,
                messages: [
                    ...(s.messages || []),
                    { type: 'user', data: question },
                    { type: 'ai', data: answer },
                ],
            };
            if (isFirstMessage) {
                nextSession.title = question;
                nextSession.time = this.formatTime(new Date());
            }
            if (flow) {
                // 每次创建新引用，确保 ChatFlow 能检测到更新并重新播放入场动画（包括相同问题再次提问）
                nextSession.flowData = {
                    nodes: (flow.nodes || []).map(n => ({ ...n, data: { ...n.data } })),
                    edges: (flow.edges || []).map(e => ({ ...e })),
                };
            }
            if (typeof code === 'string') {
                nextSession.code = code;
            }
            return nextSession;
        });

        const active = nextSessions.find(s => s.id === activeSessionId);

        this.setState(
            {
                chatSessions: nextSessions,
                flowData: active?.flowData ?? this.state.flowData,
                code: active?.code ?? this.state.code,
                animateFlow: !!flow,
                flowVersion: flow ? this.state.flowVersion + 1 : this.state.flowVersion,
            },
            () => {
                if (codeLoading) {
                    this.handleCodeScroll();
                }
            }
        );
    }
    render() {
        const {
            activeSessionId,
            flowData,
            flowNodeActive,
            code,
            chatSessions
        } = this.state;
        const { t } = (this.props as any);
        const locale = typeof localStorage !== 'undefined' ? localStorage.getItem(APP_LANGUAGE_KEY) : null;
        const language = (locale && mockData[locale]) ? locale : 'zh';
        const prompt = getAgentPrompt(locale);
        const { promptTitle, agentName } = getAgentLabels(locale);
        const activeSession = (chatSessions || []).find(s => s.id === activeSessionId);
        const welcome = (mockData[language] || mockData.zh).welcome;
        return (
            <>
            <div
                className="agent-app-chat">
                <div
                    className="menu-container">
                    
                    <img
                        className="menu-robot"
                        src={new URL('./imgs/menu-robot.png', import.meta.url).href}/>
                    <img className="background" src={new URL('./imgs/menu-bg.png', import.meta.url).href}/>
                    <div
                        className="menu-content">
                        {/* <img className="add-chat" src={new URL('./imgs/new-chat.png', import.meta.url).href} onClick={() => this.handleAddChat()}/> */}
                        <div className="add-chat-container" onClick={() => this.handleAddChat()}>
                            <img className="add-chat" src={new URL('./imgs/new-chat-btn.png', import.meta.url).href} />
                            <div className="add-chat-text">
                            <img className="message-add" src={new URL('./imgs/message-add.svg', import.meta.url).href} />
                            {t('agent.newChat')}
                            </div>
                        </div>   
                        <div className="chat-history">
                            {(() => {
                                const list = chatSessions.filter(s => s.title !== '新对话');
                                return list.length > 0 ? (
                            list.map(session => (
                                <div
                                    className={`chat-history-item ${session.id === activeSessionId ? 'active' : ''}`}
                                    key={session.id}
                                    onClick={() => this.handleSelectSession(session.id)}>
                                        <div className="chat-history-item-title">{session.title}</div>
                                        <div className="chat-history-item-time">{session.time}</div>
                                </div>
                            ))
                            ) : (
                                <div className="empty">
                                    <img src={new URL('./imgs/empty.svg', import.meta.url).href} />
                                    <div className="empty-text">{t('agent.noQARecord')}</div>
                                </div>
                            );
                            })()}
                        </div>
                        <div className="chat-prompt-container">
                            <svg xmlns="http://www.w3.org/2000/svg" width="340" height="1" viewBox="0 0 340 1" fill="none">
                                <path d="M0 0.5L340 0.49997" stroke="white" stroke-opacity="0.1"/>
                            </svg>
                            <div className="chat-prompt">
                                <div className="chat-prompt-title">
                                    <div className="chat-prompt-title-text">{promptTitle}</div>
                                    <div className="chat-prompt-title-info">{agentName}</div>
                                </div>
                                <div className="chat-prompt-content">
                                    <pre>
                                        {prompt}
                                    </pre>
                                </div>
                            </div> 
                        </div>
                    </div>
                </div>
                <div
                    className="chat-container">
                    <Chat
                        key={activeSessionId}
                        sessionId={activeSessionId}
                        language={language}
                        welcome={welcome}
                        messages={activeSession?.messages || [{ type: 'system' }]}
                        onSendKey={this.handleSendKey}
                        onThinkComplete={this.handleThinkComplete}
                        select={text => {
                            this.chatFlowRef.current?.select([text.substring(1, text.length - 1)])
                        }}
                        stopCodeScroll={this.stopCodeScroll}/>
                </div>
                <div
                    className="chat-flow-container">
                    <svg className="chat-flow-container-bg" width="320" height="920" viewBox="0 0 320 920" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <foreignObject x="-20" y="-20" width="360" height="960"><div xmlns="http://www.w3.org/1999/xhtml"  style={{
                                        backdropFilter: 'blur(10px)',
                                        clipPath: 'url(#bgblur_0_0_51599_clip_path)',
                                        height: '100%',
                                        width: '100%',
                                    }}></div></foreignObject><path data-figma-bg-blur-radius="20" d="M17.7773 0.5H302.223C311.719 0.500256 319.5 9.02914 319.5 19.6582V900.342C319.5 910.971 311.719 919.5 302.223 919.5H17.7773C8.28139 919.5 0.5 910.971 0.5 900.342V19.6582C0.5 9.02914 8.2814 0.500259 17.7773 0.5Z" fill="white" fill-opacity="0.06" stroke="url(#paint0_linear_0_51599)"/>
                        <defs>
                        <clipPath id="bgblur_0_0_51599_clip_path" transform="translate(20 20)"><path d="M17.7773 0.5H302.223C311.719 0.500256 319.5 9.02914 319.5 19.6582V900.342C319.5 910.971 311.719 919.5 302.223 919.5H17.7773C8.28139 919.5 0.5 910.971 0.5 900.342V19.6582C0.5 9.02914 8.2814 0.500259 17.7773 0.5Z"/>
                        </clipPath><linearGradient id="paint0_linear_0_51599" x1="160" y1="0" x2="160" y2="920" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white" stop-opacity="0.3"/>
                        <stop offset="1" stop-color="white" stop-opacity="0"/>
                        </linearGradient>
                        </defs>
                    </svg>
                    <div className="chat-flow-graph">
                        {flowData.nodes.length > 0 ? (
                            <ChatFlow
                                key={`${activeSessionId}-${this.state.flowVersion}`}
                                ref={this.chatFlowRef}
                                data={flowData}
                                animate={this.state.animateFlow}/>
                        ) : (
                            <div
                                className="empty">
                                <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none">
                                    <g opacity="0.7">
                                        <path opacity="0.55" d="M44.074 39.1054C44.074 41.5121 43.118 43.8202 41.4162 45.522C39.7144 47.2238 37.4062 48.1799 34.9995 48.1799C32.5928 48.1799 30.2847 47.2238 28.5829 45.522C26.8811 43.8202 25.925 41.5121 25.925 39.1054H5.96118L16.306 25.3121C16.4751 25.0868 16.6943 24.9039 16.9463 24.7779C17.1983 24.6519 17.4762 24.5862 17.7579 24.5862H52.2411C52.5228 24.5862 52.8007 24.6518 53.0527 24.7778C53.3047 24.9038 53.5239 25.0868 53.693 25.3121L64.0378 39.1054H44.074ZM39.0729 15.8098H32.9748V6.18066H39.0729V15.8098Z" fill="#AEA6FF"/>
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M54.9501 13.2649L50.6393 8.72656L44.5376 15.1432L48.8543 19.6816L54.9501 13.2649Z" fill="#ABA2FF"/>
                                        <path opacity="0.25" d="M44.074 39.1055C44.074 41.5122 43.118 43.8203 41.4162 45.5221C39.7144 47.2239 37.4062 48.18 34.9995 48.18C32.5928 48.18 30.2847 47.2239 28.5829 45.5221C26.8811 43.8203 25.925 41.5122 25.925 39.1055H5.96118V60.8843C5.96117 61.361 6.05505 61.833 6.23746 62.2734C6.41987 62.7138 6.68724 63.1139 7.02431 63.451C7.36138 63.788 7.76153 64.0554 8.20193 64.2378C8.64233 64.4202 9.11435 64.5141 9.59103 64.5141H60.4082C60.8849 64.5141 61.3569 64.4202 61.7973 64.2378C62.2377 64.0554 62.6379 63.788 62.975 63.451C63.312 63.1139 63.5794 62.7138 63.7618 62.2734C63.9442 61.833 64.0381 61.361 64.0381 60.8843V39.1055H44.074ZM27.5092 15.1448L21.4113 8.72559L17.0993 13.2645L23.197 19.6836L27.5092 15.1448Z" fill="#968CFF"/>
                                    </g>
                                </svg>
                                <div
                                    className="text">
                                    {t('agent.noData')}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* <div
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
                    </div> */}
                </div>
            </div>
            </>
        )
    }
}

export default withTranslation()(AgentApp);
