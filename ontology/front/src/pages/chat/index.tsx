import React, { useState, useRef, useEffect } from 'react';
import {
    Layout, Modal, Button, Tooltip, Empty, Typography, Message as ArcoMessage, Spin
} from '@arco-design/web-react';
import {
    IconClockCircle,
    IconFullscreen, IconLeft, IconMenuFold, IconRight
} from '@arco-design/web-react/icon';

import {IconSliderOffColor,IconSliderOnColor,IconArchiColor, IconMgmtNodeColor} from "modo-design/icon";
import GraphPanel from './components/GraphPanel';
import TestManagementSider from './components/TestManagementSider';
import TestCaseManagerModal from './components/test-case-manager-modal';
import BatchTestCaseModal from './components/test-case-manager-modal/batch-test-case';
import Chat from './components/Chat'; // 引入新组件
import { Message, GraphData, TestCase, ChatSession } from './types'; 

import './App.less';

import graphBranchIcon from '@/pages/chat/images/branchGraph.svg';
import {  getAllSession,getAllTaskSession, getSessionHistory,stopChat,getOntologyData,
    ontologyPromptBasic,
    deleteChat,
    saveGraph,
    getGraph,
    getTestCaseList,
    taskStatus,
    startTestCaseTask,
    deleteTask,
    stopTestCaseTask,
    getPromptList,
    getPromptDetail,
    getPromptRdf
} from './api';
import {useParams} from "react-router";
import {getOntologyOverview} from "@/pages/ontology-graph-preview/api";

import { v4 as uuidv4 } from 'uuid';
import ModoTabs from '@/components/Tabs';

const { Sider } = Layout;
const { Title } = Typography; 
export function formatTimestamp(timestamp: any) {
    let date: Date;

    // 如果是纯数字且长度大于10位，可能是毫秒，否则如果是10位数字是秒
    if (typeof timestamp === 'number') {
        if (timestamp > 1e12) {
            // 已经是毫秒
            date = new Date(timestamp);
        } else {
            // 是秒
            date = new Date(timestamp * 1000);
        }
    } else if (typeof timestamp === 'string') {
        // 支持 "2025-12-29T14:19:52" 或 "2025-12-29 14:19:52" 等
        const numVal = Number(timestamp);
        if (!isNaN(numVal)) {
            if (timestamp.length === 10) {
                // 秒时间戳
                date = new Date(numVal * 1000);
            } else if (timestamp.length === 13) {
                // 毫秒时间戳
                date = new Date(numVal);
            } else {
                // 作为普通数字
                date = new Date(numVal);
            }
        } else {
            // 字符串日期，比如 "2025-12-29T14:19:52" 或 "2025-12-29 14:19:52"
            // 为兼容Safari，统一替换T为空格，将"-"替换为"/"
            let str = timestamp.replace('T', ' ').replace(/-/g, '/');
            date = new Date(str);
            if (isNaN(date.getTime())) {
                // 如果继续无效，尝试不替换
                date = new Date(timestamp);
            }
        }
    } else {
        // 兜底
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return ''; // 不合法返回空字符串

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const App: React.FC = () => {


    let { id } = useParams();
   // const ontologyName = 'CEM';  //todo  假数据
    // --- 布局状态 ---
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [fullScreenVisible, setFullScreenVisible] = useState(false);
    const [leftWidth, setLeftWidth] = useState(280);
    const [rightWidth, setRightWidth] = useState(600);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    // --- 核心数据：会话列表 ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState('');
    const [activeGraphMessageId, setActiveGraphMessageId] = useState('');

    // --测试用例数据状态
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [managerVisible, setManagerVisible] = useState(false); // 管理弹窗显隐
    const [batchVisible, setBatchVisible] = useState(false); // 批量测试弹窗显隐

    const [ontologyData, setOntologyData] = useState({});
    const [currentGraphData, setCurrentGraphData] = useState<GraphData|null>(null);
    const [sysPrompt,setSysPrompt] = useState({id:'',promptContent:''});  //提示词
    const [siderOntologyData, setSiderOntologyData] =  useState({});

    // 当前 UI 状态
    const [inputValue, setInputValue] = useState('');
    const [sessionLoading, setSessionLoading] = useState(false);
    const [loading, setLoading] = useState(false);


    // Ref
    const graphRef = useRef<any>(null);
    //const fullGraphRef = useRef<any>(null);
    const controllerRef = useRef<any>(null);
    const taskRef = useRef(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSessionRef = useRef('new');
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const modoTabsRef = useRef();

    // --- 计算属性 ---
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
    const currentMessages = activeSession ? activeSession.messages : [];

    // --- 滚动 & 拖拽 ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages, activeSessionId, loading]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft) setLeftWidth(Math.max(220, Math.min(e.clientX, 500)));
            if (isResizingRight) setRightWidth(Math.max(300, Math.min(window.innerWidth - e.clientX, 800)));
        };
        const handleMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        if (isResizingLeft || isResizingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft, isResizingRight]);

    //数据初始化
    //获取本体初始数据
    useEffect(()=>{
        getOntologyInfo();
        getOntologyPrompt();
        getTestCaseData();
    },[]);
    //获取初始会话数据
    useEffect(()=>{
        if(ontologyData && ontologyData.ontologyName){
            getSessionList().then(()=>{
                setTimeout(async()=>{
                    handleStartNewSession();
                });
            })
        }

    },[ontologyData]);

    const getHisChatAndGraphData = async (activeSessionId)=>{
        setCurrentGraphData(null);
      /*  setTimeout(async()=>{*/
            chatSessionRef.current = activeSessionId;
            if(activeSessionId.startsWith('error-')){
                const currentSession = sessions.find(s=>s.id==activeSessionId);
                if(currentSession){
                    const messages:Message[] = [];
                    messages.push({
                        id:`user-${activeSessionId}`,
                        content:currentSession.summary.name,
                        role:'user'
                    })
                    messages.push({
                        id:activeSessionId,
                        content:[{
                            id:activeSessionId,
                            type:'answer',
                            data:'error'
                        }],
                        role:'ai',
                        graphData:null,
                        status:'error'
                    })
                    setSessions(prev => prev.map((s) => {
                        if(s.id==activeSessionId){
                            return {
                                ...s,
                                messages:messages,
                                taskGraphData:null
                            }
                        }
                        return s;
                    }));
                    setRightCollapsed(false);
                    setCurrentGraphData(null);
                    return;
                }
                return;
            }
            const messages = await getSessionHis(activeSessionId);
            const taskGraphData = await getSessionGraphData(activeSessionId);
            //将图谱数据给到每个aiMessage;
            messages &&  messages.forEach(message=>{
                if(message.role === 'ai'){
                    message.graphData = taskGraphData?.find(graphData=>graphData.taskId==message.id)?.graph||null;
                }
            });
            await setSessions(prev => prev.map((s) => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: messages,
                        taskGraphData:taskGraphData
                    };
                }
                return s;
            }));
            if(messages && messages.length>0 && taskGraphData && taskGraphData.length>0){
                await setRightCollapsed(false);
                const aiGraphMessages = messages.filter(msg => msg.role === 'ai');
                // 渲染最后一个aiMessage的图谱
                const lastAiMessage = aiGraphMessages.length > 0 ? aiGraphMessages[aiGraphMessages.length - 1] : null;
                await setCurrentGraphData(lastAiMessage?.graphData||null);
                //setActiveGraphMessageId(lastAiMessage.id);

            }
       /* },20)*/
    };
    const getOntologyInfo = ()=>{
        getOntologyData(id).then(async res=>{
            if(res.data.success){
               await setOntologyData(res.data.data);
                await getOverviewData();
            }
        })
    };

    const getOntologyPrompt = ()=>{
        getPromptList({ontologyId:id,page:1,limit:999,keyword:''}).then(res=>{
            if(res.data.success){
                const data = res.data.data.content;
                const prompt = data.find(item=>item.promptType==0);
                getPromptDetail({id:prompt.id}).then(res=>{
                    if(res.data.success){
                        setSysPrompt({id:prompt.id,promptContent:res.data.data?.promptContent||''});
                    }
                })
            }
        })
    };

    // ================= 业务逻辑 =================

    // 1. 新建会话
    const handleStartNewSession = (forceNew=false) => {
        if(activeSessionId=='new'&&!forceNew){
            return
        }
        const newSessionId = 'new';
        const newSession: ChatSession = {
            id: newSessionId,
            summary: { id: newSessionId,name:'新会话',type:'new' },
            messages: [{
                content:[{
                    id:`answer`,
                    type:'answer',
                    data:'您好！我是本体测试助手。当前本体模型已就绪，您可以输入问题或选择测试用例进行本体测试。'
                }],
                role:'ai',
                status:'completed'
            }],
            type:0,
            taskGraphData: null
        };
        setSessions(prev => {
            const sessionList = prev.filter(item=>item.id!='new');
            return [newSession, ...sessionList]
        });
        chatSessionRef.current = 'new';
        setActiveSessionId(newSessionId);
        setRightCollapsed(false);
        setCurrentGraphData(null);
        graphRef.current?.clearGraph();
        setLoading(false);
    };
    const handleDeleteSession = (sessionId)=>{
        const session = sessions.find(session=>session.id==sessionId);
        const newSessions = sessions.filter(session=>session.id!=sessionId);
        deleteTask({
            ontologyName:ontologyData.ontologyName,
            batchNumList :[session.batchNum]
        }).then(res=>{
            if(res.data.success){
                ArcoMessage.success('删除成功');
                setSessions([...newSessions]);
                if(sessionId == activeSessionId){
                    handleStartNewSession(true);
                }
            }else{
                ArcoMessage.error('删除失败');
            }
        }).catch(e=>{
            console.log(e);
            ArcoMessage.error('删除失败');
        })

    };
    const handleClearSession = async ()=>{
        try{
            setSessionLoading(true);
            if(chatSessionRef.current!=='new'){
                await handleStop();
            }
           // await setActiveSessionId('');
            console.log('----sessionIds-----',chatSessionRef.current, sessions.map(item=>item.id));
            // const deleteAxios = sessions.map(async (session)=>{
            //     await deleteChat({
            //         ontologyName:ontologyData.ontologyName,
            //         conversationId :session.id
            //     });
            //     return session.id;
            // });
            // const deletedIds = await Promise.all(deleteAxios);
            const batchNumList = sessions.map(session=>session.batchNum);
            deleteTask({
                ontologyName:ontologyData.ontologyName,
                batchNumList
            }).then(res=>{
                if(res.data.success){
                    ArcoMessage.success('已清空');
                    setSessions([]);
                    setLoading(false);
                    setSessionLoading(false);
                    controllerRef.current = null;
                    handleStartNewSession(true);
                }else{
                    ArcoMessage.error('清空失败');
                }
            }).catch(e=>{
                console.log(e);
                ArcoMessage.error('清空失败');
            })  
        }catch(error){

        }

    };

    // 2. 发送消息
    const handleSend = (text: string = inputValue,parentMessageId?:string|null) => {
        if (!text.trim()) return;
        if (!activeSession) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };

        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    messages: [...s.messages, userMsg],
                    summary: { ...s.summary, time: formatTimestamp(Math.floor(Date.now()/1000))}
                };
            }
            return s;
        }));

        if (text === inputValue) {
            setInputValue('');
        }
        chatSessionRef.current = activeSessionId;
        setCurrentGraphData(null);
        triggerAIResponse(activeSessionId, text,parentMessageId);
    };

    // 3. 停止生成
    const handleStop = async() => {
        const currentSession = sessions.find(item=>item.id==chatSessionRef.current);
        if(currentSession?.type==1 && currentSession?.batchNum){
            stopTestCaseTask({
                batchNum:currentSession.batchNum
            }).then(res=>{
                if(res.data.status=='success'){
                    ArcoMessage.info('已成功发起停止会话请求');
                    setSessions(prev => {
                        return prev.map((s:ChatSession) => {
                            if (s.id === chatSessionRef.current) {
                                return {
                                    ...s,
                                    isStop:true,
                                };
                            }
                            return s;
                        })
                    });
                }else{
                    ArcoMessage.error('停止指令发送失败');
                }
               
            }).catch(err=>{
                ArcoMessage.error('停止指令发送失败');
            })
        }else if (currentSession?.taskId) {
            try {
                stopChat({
                    ontologyName:ontologyData.ontologyName,
                    taskId:currentSession?.taskId
                }).then(res=>{
                    if(res.data.status=='success'){
                        ArcoMessage.info('已成功发起停止 会话请求');
                        setSessions(prev => {
                            return prev.map((s:ChatSession) => {
                                if (s.id === chatSessionRef.current) {
                                    return {
                                        ...s,
                                        isStop:true,
                                    };
                                }
                                return s;
                            })
                        });
                    }else{
                        ArcoMessage.error('停止指令发送失败');
                    }
                });
                
            } catch (e) {
                console.error('Stop request failed', e);
                ArcoMessage.error('停止指令发送失败');
            }
        }else{
            console.log('taskId==null',currentSession);
        }
    };

    // 4. 重新生成
    const handleRegenerate = (msgIndex: number) => {
        const session = sessions.find(session=>session.id==activeSessionId);
        const msgs = session.messages;
        let targetUserMsg = null;
        let userIndex = null;
        let parentMessageId = null;
        for (let i = msgIndex - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') {
                targetUserMsg = msgs[i];
                userIndex = i;
                break;
            }
        }

        for (let i = userIndex - 1; i >= 0; i--) {
            if (msgs[i].role === 'ai') {
                parentMessageId = msgs[i].id;
                break;
            }
        }

        if (targetUserMsg) {
            handleSend(targetUserMsg.content,parentMessageId);
        } else {
            ArcoMessage.warning('未找到对应的提问上下文');
        }
    };
    //渲染message对应的图谱
    const handleRenderGraph =(messageId)=>{
        const session = sessions.find(session=>session.id==activeSessionId);
        const taskGraphData = session.taskGraphData||[];
        const currentData = taskGraphData.find(item=>{return item.taskId==messageId});
        setRightCollapsed(false);
        setCurrentGraphData(currentData?.graph);
        setActiveGraphMessageId(messageId);

    };

    // 5. 复制 (增强兼容性)
    const handleCopy = (content: string) => {
        // 使用 textarea 并确保复制兼容性
        const fallbackCopy = (text: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // 避免页面滚动
            textArea.setAttribute('readonly', 'readonly');
            textArea.style.position = "absolute";
            textArea.style.left = "-9999px";
            textArea.style.top = "-9999px";
            textArea.style.opacity = "0";
            textArea.id = "chat-copy-textarea"; // 添加id
 
            document.body.appendChild(textArea);

            // 选中内容
            // 下面两种方式二选一，兼容某些旧环境
            if (textArea.select) {
                textArea.select();
            } else {
                const range = document.createRange();
                range.selectNodeContents(textArea);
                const sel = window.getSelection();
                sel && sel.removeAllRanges();
                sel && sel.addRange(range);
            }

            let copySuccess = false;
            try {
                copySuccess = document.execCommand('copy');
            } catch (err) {
                copySuccess = false;
            }

            document.body.removeChild(textArea);

            if (copySuccess) {
                ArcoMessage.success('已复制到剪贴板');
            } else {
                ArcoMessage.error('复制失败，请手动复制');
            }
        };
        //fallbackCopy(content);
        //优先使用 navigator.clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content)
              .then(() => {
                  ArcoMessage.success('已复制到剪贴板');
              })
              .catch((err) => {
                  // 某些浏览器可能支持 navigator 但没有 writeText 权限，降级处理
                  console.warn('Clipboard API failed, using fallback.', err);
                  fallbackCopy(content);
              });
        } else {
            // 不支持 navigator.clipboard 时使用降级方案
            fallbackCopy(content);
        }
    };

    // 6. 编辑
    const handleEdit = (content: string) => {
        setInputValue(content);
    };

    const updateSessionMessage = (sessionId: string, msgId: string,messageId: string, updates: Partial<Message>,sessionUpate?:any) => {
//        console.log('update-Session',sessionId,msgId,messageId,updates,sessionUpate);
        setSessions(prev => {
            return prev.map((s:ChatSession) => {
                if (s.id === sessionId) {
                   // console.log('update--',s.messages,messageId,msgId);
                    const newMsgs = s.messages?.map(m =>
                      m.id === msgId|| m.id === messageId ? { ...m, id:messageId, ...updates } : m
                    );
                    return {
                        ...s,
                        ...sessionUpate,
                        messages: newMsgs,

                    };
                }
                return s;
            })});
    };
    const updateSessionSummaryName = (sessionId:string,name:string)=>{
        setSessions(prev => {
            return prev.map((s:ChatSession) => {

                if (s.id === sessionId) {
                    console.log('session-summary',s.id,sessionId);
                    const messages = s.messages;
                    messages?.forEach(message=>{
                        if(message.role == 'ai'){
                            message.content.forEach(item=>{
                                if(item.type=='mcp'){
                                    item.status = 'end';
                                }
                            })
                        }
                    })
                    return {
                        ...s,
                        id: sessionId,
                        summary: {...s.summary, type: 'update', id: sessionId, name: name ? name : s.summary.name},
                        messages: messages,
                        taskId:null
                    };
                }
                return s;
            })
        });
        chatSessionRef.current == sessionId && setActiveSessionId(sessionId);
        console.log('chatSessionRef.current',chatSessionRef.current)
    };
    const updateSessionId = async (oriSessionId:string,sessionId:string,update?:any)=>{
        await setSessions(prev => {
          //  console.log('oldSession',sessionId,oriSessionId,sessions)
            return prev.map((s:ChatSession) => {
                if (s.id === oriSessionId) {
                    return {
                        ...s,
                        id: sessionId,
                        oldId:oriSessionId,
                        messages:s.messages,
                      ...update
                    };
                }
                return s;
            })
        });
     //   setActiveSessionId(sessionId);
    };
    const getPromptRdfData = ()=>{
        return new Promise((resolve, reject) => {
            getPromptRdf({id:id}).then(res=>{
                if(res.data.success){
                    resolve(res.data?.data?.prompt??'');
                }else{
                    ArcoMessage.error(res.data.message||'获取提示词RDF失败');
                    resolve('');
                   
                }
            }).catch(err=>{
                ArcoMessage.error('获取提示词RDF失败');
                resolve('');
            })
        })
    };
    // 7.   AI 回复
    const triggerAIResponse = async(targetSessionId: string, queryText?: string,parentMessageId?:string) => {
        let sessionId = targetSessionId;

        //////
      //  templateGraphData();
      //  return;
        ////////////

        setLoading(true);
        // 1. 先创建一条空消息占位
        const aiMsgId = (Date.now() + 1).toString();
        const initialAiMsg: Message = {
            id: aiMsgId,
            role: 'ai',
            content: [],
            status: 'streaming',
            taskId:''
        };
        await setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, messages: [...s.messages, initialAiMsg],taskId:null };
            }
            return s;
        }));

        const promptRdf = await getPromptRdfData();
        const controller = new AbortController();
        controllerRef.current = controller; // 此时 ref 仅用于意外中断清理，正常 Stop 不会调用 abort
        try {
            const requestBody = {
                query:queryText,
                ontologyName:ontologyData.ontologyName,
                sysPrompt:`${sysPrompt.promptContent||''}\n${promptRdf}`,
                conversationId :sessionId=='new'?'':sessionId
            };
            parentMessageId?requestBody.parentMessageId=parentMessageId:'';
            const origin = window.location.origin;
            const response = await fetch(`${origin}/ontology/_api/v1/dify/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Accept': 'text/event-stream',
                    'Connection': 'keep-alive',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            if (!response.ok) throw new Error('Network response was not ok');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            // --- 新增：缓冲控制变量 ---
            let lastUpdateTime = 0; 
            const UPDATE_INTERVAL = 200; // 每 200ms 更新一次 UI，人眼感觉不到延迟，但性能提升巨大
            let messageId = aiMsgId;
            const graphNodes:any = [];
            const graphOrderEdges:any = [];
            let graphRelationEdges:any = [];
            let orderLabel = 0;  //思考链路顺序
            let preNode = null;   //思考链路上的上一个节点
            const relationEdgesMap:any = {};  //关系链路数据

            const contents:any = {};
            let message_index=0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';
                let needUpdate = false; // 标记是否需要在本次循环更新
                let taskId = '';
                for (const part of parts) {
                    if (!part.trim()) continue;
                    if (!part.startsWith('data:')) continue;

                    const dataStr = part.slice(5);

                    try{
                        const data = JSON.parse(dataStr);

                        messageId=data.message_id;
                        if(sessionId=='new'){
                            //如果是新建会话，有回复时更新下会话id
                            sessionId = data.conversation_id;
                            chatSessionRef.current = sessionId;
                            const taskId = data.task_id;
                            await updateSessionId(targetSessionId,sessionId,{taskId});
                        }else if(!taskId){
                            taskId = data.task_id;
                            updateSessionMessage(sessionId, aiMsgId, messageId, {},{ taskId:data.task_id});
                        }

                       /* if(!taskRef.current){
                            taskRef.current = data.task_id;
                            console.log('taskId',data.task_id,taskRef.current,controllerRef.current,contents);
                            updateSessionMessage(sessionId, aiMsgId, messageId,{ taskId:data.task_id});
                        }*/
                       const eventType = data.event;
                       switch (eventType) {
                            case 'agent_thought':
                                if(data.tool){
                                    const input = data.tool_input;//JSON.parse(a.tool_input)[a.tool];
                                    const output = data.observation;//JSON.parse(a.observation)[a.tool];
                                    const detail = data.running_detail;
                                    const content = {
                                        id:data.id,
                                        type:'mcp',
                                        data:{
                                            tool:data.tool,
                                            input:input||'',
                                            output:output||'',
                                            runningType:data.running_type,
                                            runningLabel:data.running_label,
                                            status:data.mcp_status
                                        }
                                    };
                                    if(['object','action','logic','interface'].includes(data.running_type)){


                                       /* let ss ={ nodes: [
                                            {id: 'n0', data: {label: 'Check', nodeType: 'object'}},
                                            {id: 'n1', data: {label: 'Data A', nodeType: 'logic'}},
                                            {id: 'n2', data: {label: 'Data B', nodeType: 'action'}},
                                            {id: 'n3', data: {label: 'Result', nodeType: 'interface'}},
                                        ],
                                          edges: [
                                            {source: 'n0', target: 'n1', label: 'Flow'},
                                            {source: 'n1', target: 'n2', label: 'Flow'},
                                            {source: 'n2', target: 'n3', label: 'End' }
                                        ]};*/
                                       const nodeGraphDetail = data.graph_detail;  //节点图谱关联数据
                                        const nodeName = detail[data.running_type+'_name'];

                                        //console.log(data.running_type,nodeName,data.mcp_status,nodeGraphDetail);
                                        const nodeData = nodeGraphDetail?.nodes?.find(node=>{
                                            const nData = node.data;
                                            if(nData.node_type == data.running_type){
                                                return nData['object_type_name'] == nodeName || nData['action_name'] == nodeName || nData['logic_type_name'] == nodeName || nData['name'] == nodeName
                                            }
                                            return false
                                        });
                                        if(nodeData && nodeGraphDetail){
                                            const node ={
                                                ...nodeData,
                                            };
                                            //添加新节点
                                            if(!graphNodes.find(item=>item.id==nodeData.id)){
                                                graphNodes.push(node);
                                            }

                                            //添加思考链路
                                            if(orderLabel>0){
                                                const edge = {
                                                    source:preNode.id,
                                                    target: node.id,
                                                    label: orderLabel.toString(),
                                                    linkType: 'order',
                                                    id:`${preNode.id}-${node.id}-${orderLabel}-order`
                                                };
                                                graphOrderEdges.push(edge);
                                            }
                                            orderLabel+=1;
                                            preNode = node;

                                            //保存关系链路数据
                                            nodeGraphDetail?.edges?.forEach(edge=>{
                                                relationEdgesMap[`${edge.source}-${edge.target}`] = edge
                                            });

                                            const relationEdgeData  = Object.values(relationEdgesMap)||[];

                                            const edges = relationEdgeData.filter(edge=>{
                                                return graphNodes.find(node=>node.id == edge.source) && graphNodes.find(node=>node.id == edge.target)
                                            });
                                            //关系链路
                                            graphRelationEdges = edges.map((edge:any)=>{
                                                return {
                                                  ...edge,
                                                    linkType:'relation',
                                                    id:`${edge.source}-${edge.target}-relation`
                                                }
                                            });
                                            const graphData = graphNodes.length>0? {nodes:graphNodes,edges:[...graphRelationEdges,...graphOrderEdges]}:null;
                                            graphData && saveTaskGraphData(sessionId,data.message_id,graphData);
                                        }

                                    }
                                    contents[data.id] = content;
                                }
                                message_index+=1;  //markdown开始的标志
                                const graphData = graphNodes.length>0? {nodes:graphNodes,edges:[...graphRelationEdges,...graphOrderEdges]}:null;

                               // updateSessionMessage(sessionId, aiMsgId, messageId,{ content:Object.values(contents),graphData},{taskId:data.task_id});
                                needUpdate = true; // 标记数据变了
                                // if (sessionId == chatSessionRef.current && graphData) {
                                //     await setRightCollapsed(false);
                                //     await setCurrentGraphData(graphData);
                                //     await setActiveGraphMessageId(messageId);
                                // }
                                break;

                            case 'agent_message':
                                let content = null;
                                const id = data.id+message_index;
                                if (contents[id]) {
                                    content = contents[id];
                                    content.data += data.answer;
                                } else {
                                    content = {
                                        id: id,
                                        data: data.answer,
                                        type: 'answer',
                                    };
                                }
                                contents[id]= content;
                               // updateSessionMessage(sessionId, aiMsgId, messageId, { content:Object.values(contents)},{taskId:data.task_id});
                               needUpdate = true; // 标记数据变了
                                break;

                            case 'message_end':
                                // 收到后端明确的结束信号
                                const graphData1 = graphNodes.length>0? {nodes:graphNodes,edges:[...graphRelationEdges,...graphOrderEdges]}:null;
                                 updateSessionMessage(sessionId, aiMsgId, messageId,{
                                    status: 'completed',
                                    content: Object.values(contents)
                                },{taskId:data.task_id});
                                graphData1 && saveTaskGraphData(sessionId,data.message_id,graphData);

                                if(chatSessionRef.current == sessionId){
                                    setLoading(false);
                                }
                                if (sessionId == chatSessionRef.current && graphData1){
                                    await setRightCollapsed(false);
                                    await setCurrentGraphData(graphData1);
                                    await setActiveGraphMessageId(messageId);
                                }
                                break;
                            case 'error':
                               updateSessionMessage(sessionId, aiMsgId, messageId, {
                                   content: [{
                                       id: `error-${new Date().getTime().toString()}`,
                                       data: data.message || 'error',
                                       type: 'answer',
                                   }],
                                   status: 'completed',
                                },{taskId:data.task_id});
                                if(chatSessionRef.current == sessionId){
                                    setLoading(false);
                                    setActiveSessionId(sessionId)
                                }
                                break;
                        }
                    }catch (error) {
                        debugger;
                        console.error('解析 SSE 数据失败:', error);
                    }

                }
                const now = Date.now();
                if (needUpdate && (now - lastUpdateTime > UPDATE_INTERVAL)) {
                    const graphData = graphNodes.length>0? {nodes:graphNodes,edges:[...graphRelationEdges,...graphOrderEdges]}:null;
                    updateSessionMessage(sessionId, aiMsgId, messageId, { 
                        content: Object.values(contents),
                        graphData
                    });
                    if (sessionId == chatSessionRef.current && graphData) {
                        await setRightCollapsed(false);
                        await setCurrentGraphData(graphData);
                        await setActiveGraphMessageId(messageId);
                    }
                    lastUpdateTime = now;
                }

            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted by user');
            } else {
                console.error('Fetch error:', err);
                ArcoMessage.error('网络请求失败');
                setLoading(false);
                updateSessionMessage(sessionId, aiMsgId, aiMsgId,{
                    content: [{
                        id: new Date().getTime().toString(),
                        data: '网络请求失败',
                        type: 'answer',
                    }],
                    status: 'completed',
                 });
            }
        } finally {
            console.log('fetch end', chatSessionRef.current, targetSessionId, sessionId);
            if(chatSessionRef.current == sessionId){
                setLoading(false);
            }
            controllerRef.current = null;
            if(targetSessionId!=sessionId || sessionId == 'new'){
                updateSessionSummaryName(sessionId,queryText)
            }else{
                setSessions(prev => {
                    return prev.map((s:ChatSession) => {
                        if (s.id === sessionId) {
                            const messages = s.messages;
                            messages?.forEach(message=>{
                                if(message.role == 'ai'){
                                    message.content.forEach(item=>{
                                        if(item.type=='mcp'){
                                            item.status = 'end';
                                        }
                                    })
                                }
                            })
                            return {
                                ...s,
                                messages,
                                taskId:null,
                            };
                        }
                        return s;
                    })
                });
            }

        }

    };
    // 清理轮询定时器
    const clearPollingTimer = () =>{
        if(pollingTimerRef.current){
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
        }
    }
    useEffect(()=>{
        return ()=>{
            clearPollingTimer()
        }
    },[activeSessionId]);
    
    const getTestCaseTaskStatus = (session:any)=>{
        setRightCollapsed(false);
        setCurrentGraphData(null);
        chatSessionRef.current = session.id;
        taskStatus({batchNum:session.id}).then(res=>{
            if(res.data.success){
                const data = res.data.data;
                const messages:Message[] = [];
                const userMessage:Message = {
                    id: session.id,
                    role: 'user',
                    content: session.summary.name,
                };
                messages.push(userMessage);
                const aiMessage:Message = {
                    id: `${session.id}-ai`,
                    role: 'ai',
                    content:[{
                        id:session.id,
                        type:'test-case-result',
                        data:null,
                        finished:data.finished||0,
                        isFinished:!!data.isFinished,
                        total:data.total||0
                    }],
                    status: data.isFinished ? 'completed' : 'streaming',
                };
                messages.push(aiMessage);
                setSessions(prev => {
                    return prev.map((s:ChatSession) => {
                        if (s.id === session.id) {
                            return {
                                ...s,
                                messages:messages,
                                isStop:false,
                            };
                        }
                        return s;
                    })
                });
                
                // 如果 isFinished 不为 true 且 session.id == activeSessionId，启动轮询
                if (!data.isFinished && session.id === chatSessionRef.current) {
                    // 先清除之前的轮询
                    clearPollingTimer();
                    // 启动新的轮询
                    pollingTimerRef.current = setInterval(() => {
                        // 检查当前 session 是否还是 activeSessionId
                        if (session.id !== chatSessionRef.current) {
                            clearPollingTimer();
                            return;
                        }
                        // 查询状态
                        taskStatus({batchNum:session.batchNum}).then((pollRes:any)=>{
                            if(pollRes.data.success){
                                const pollData = pollRes.data.data;
                                const pollMessages:Message[] = [];
                                const pollUserMessage:Message = {
                                    id: session.id,
                                    role: 'user',
                                    content: session.summary.name,
                                };
                                pollMessages.push(pollUserMessage);
                                const pollAiMessage:Message = {
                                    id: `${session.id}-ai`,
                                    role: 'ai',
                                    content:[{
                                        id:session.batchNum,
                                        type:'test-case-result',
                                        data:null,
                                        finished:pollData.finished||0,
                                        isFinished:!!pollData.isFinished,
                                        total:pollData.total||0
                                    }],
                                    status: pollData.isFinished ? 'completed' : 'streaming',
                                };
                                pollMessages.push(pollAiMessage);
                                setSessions(prev => {
                                    return prev.map((s:ChatSession) => {
                                        if (s.id === session.id) {
                                            return {
                                                ...s,
                                                messages:pollMessages
                                            };
                                        }
                                        return s;
                                    })
                                });
                                
                                // 如果 isFinished 为 true，停止轮询
                                if (pollData.isFinished) {
                                    clearPollingTimer();
                                }
                            }
                        }).catch(() => {
                            // 请求失败时也停止轮询
                            clearPollingTimer();
                        });
                    }, 3000);
                }
                 
            }
        }).finally(()=>{
           
        })
    }
    const startTestCaseSession = (testCases:TestCase[])=>{
        if(testCases.length>0){
            const testCase = testCases[0];
            const title = testCases.length == 1?testCase.question:`进行【${testCase.question}】等${testCases.length}个CQ用例测试`;
            const newSessionId = `new-testCase-${uuidv4()}`;
            const newSession: ChatSession = {
                id: newSessionId,
                type:1,
                summary: { id: newSessionId,name:title,type:'new-test-case',testCases:testCases, time: formatTimestamp(Math.floor(Date.now()/1000)) },
                messages: [{
                    id: Date.now().toString(),
                    role: 'user',
                    content: title
                } ],
            };
            setSessions(prev => {
                const sessionList = prev.filter(item=>item.id!='new');
                return [newSession, ...sessionList]
            });
            chatSessionRef.current = newSessionId;
            setActiveSessionId(newSessionId);
            setRightCollapsed(false);
            setCurrentGraphData(null);
            sendAITestCase(newSessionId,testCases);
            
        }else{
            setLoading(false);
        }
    }
    //测试用例会话
    const handleStartTestCaseSession = (testCases:TestCase[])=>{
        if(loading){
            Modal.confirm({
                title: '提示',
                content: `此操作将关闭当前会话内容，请确认后操作？`,
                onOk: async () => {
                    await handleStop();
                    controllerRef.current = null;
                    startTestCaseSession(testCases);
                  
                },
                onCancel: () => {

                }
            });
        }else{
            startTestCaseSession(testCases);
        }
       
    }
    //发送测试用例
    const sendAITestCase = (targetSessionId:string,testCases:TestCase[])=>{
        setLoading(true);
        const initialAiMsg: Message = {
            id: `${targetSessionId}-ai`,
            role: 'ai',
            content: [{
                id:targetSessionId,
                type:'test-case-result',
                data:testCases,
                finished:0,
                isFinished:false,
                total:testCases.length
            }],
            status: 'streaming',
        };
        setSessions(prev => prev.map(s => {
            if (s.id === targetSessionId) {
                return { ...s, messages: [...s.messages, initialAiMsg],taskId:null };
            }
            return s;
        }));
        startTestCaseTask({
            ontologyName:ontologyData.ontologyName,
            caseIdList:testCases.map(item=>item.id)
        }).then(res=>{
            if(res.data.success){
                const batchNum = res.data.data?.batchNum||'';
                 
                setSessions(prev => {
                    return prev.map((s: ChatSession) => {
                        if (s.id === targetSessionId) {
                            const session = s;
                            session.id = batchNum;
                            session.batchNum = batchNum;
                            session.summary.type = 'update-test-case',
                                session.summary.id = batchNum
                            session.messages && session.messages.forEach((message: Message) => {
                                if (message.role == 'user') {
                                    message.id = batchNum;
                                } else {
                                    message.id = `${batchNum}-ai`;
                                    message.content[0].id = batchNum;
                                }
                            })
                            return { ...session, taskId: null };

                        }
                        return s;
                    })
                }
                );
               
                setActiveSessionId(batchNum);
                chatSessionRef.current = batchNum;
                setLoading(false);
                // 启动轮询查询任务状态
                const startPolling = () => {
                    // 先清除之前的轮询
                    clearPollingTimer();
                    // 启动新的轮询
                    pollingTimerRef.current = setInterval(() => {
                        // 检查当前 batchNum 是否还是 activeSessionId
                        if (batchNum !== chatSessionRef.current) {
                            clearPollingTimer();
                            setLoading(false);
                            return;
                        }
                        // 查询状态
                        taskStatus({batchNum}).then((pollRes:any)=>{
                            if(pollRes.data.success){
                                const pollData = pollRes.data.data;
                                // 更新 session 的 messages
                                setSessions(prev => prev.map((s:ChatSession) => {
                                    if (s.id === batchNum) {
                                        const updatedMessages = s.messages?.map((msg:Message) => {
                                            if (msg.role === 'ai' && msg.content && Array.isArray(msg.content)) {
                                                const content = msg.content.map((item:any) => {
                                                    if (item.type === 'test-case-result') {
                                                        return {
                                                            ...item,
                                                            id:batchNum,
                                                            finished: pollData.finished || 0,
                                                            isFinished: !!pollData.isFinished,
                                                            total: pollData.total || 0
                                                        };
                                                    }
                                                    return item;
                                                });
                                                return {
                                                    ...msg,
                                                    content,
                                                    status: (pollData.isFinished ? 'completed' : 'streaming') as 'streaming' | 'completed'
                                                };
                                            }
                                            return msg;
                                        }) || [];
                                        return {
                                            ...s,
                                            messages: updatedMessages
                                        };
                                    }
                                    return s;
                                }));
                                
                                // 如果 isFinished 为 true，停止轮询
                                if (pollData.isFinished) {
                                    clearPollingTimer();
                                    setLoading(false);
                                }
                            }
                        }).catch(() => {
                            // 请求失败时也停止轮询
                            clearPollingTimer();
                            setLoading(false);
                        });
                    }, 3000);
                };
                
                // 立即查询一次状态，如果未完成则启动轮询
                taskStatus({batchNum}).then((statusRes:any)=>{
                    if(statusRes.data.success){
                        const statusData = statusRes.data.data;
                        // 更新 session 的 messages
                        setSessions(prev => prev.map((s:ChatSession) => {
                            if (s.id === batchNum) {
                                const updatedMessages = s.messages?.map((msg:Message) => {
                                    if (msg.role === 'ai' && msg.content && Array.isArray(msg.content)) {
                                        const content = msg.content.map((item:any) => {
                                            if (item.type === 'test-case-result') {
                                                return {
                                                    ...item,
                                                    id:batchNum,
                                                    finished: statusData.finished || 0,
                                                    isFinished: !!statusData.isFinished,
                                                    total: statusData.total || 0
                                                };
                                            }
                                            return item;
                                        });
                                        return {
                                            ...msg,
                                            content,
                                            status: (statusData.isFinished ? 'completed' : 'streaming') as 'streaming' | 'completed'
                                        };
                                    }
                                    return msg;
                                }) || [];
                                return {
                                    ...s,
                                    messages: updatedMessages
                                };
                            }
                            return s;
                        }));
                        
                        // 如果 isFinished 不为 true，启动轮询
                        if (!statusData.isFinished) {
                            startPolling();
                        } else {
                            setLoading(false);
                        }
                    } else {
                        setLoading(false);
                    }
                }).catch(() => {
                    setLoading(false);
                });
                
            } else {
                setLoading(false);
            }
        }).catch(() => {
            setLoading(false);
        })
      
    }
    // 辅助方法
    const handleSwitchSession = (sessionId: string) => {
        if(loading){
            Modal.confirm({
                title: '提示',
                content: `此操作将关闭当前会话内容，请确认后操作？`,
                onOk: async () => {
                    await handleStop();
                    await setActiveSessionId(sessionId);
                     
                   // getHisChatAndGraphData(sessionId);
                    setLoading(false);
                    const targetSession = sessions.find(s => s.id === sessionId);
                    if(targetSession){
                        graphRef.current?.clearGraph();
                        if(targetSession?.type==0){
                            getHisChatAndGraphData(targetSession.id);
                        }else{
                            getTestCaseTaskStatus(targetSession)
                        }
                      
                    }
                    controllerRef.current = null;
                },
                onCancel: () => {

                }
            });
        }else{
            setActiveSessionId(sessionId);
            const targetSession = sessions.find(s => s.id === sessionId);
            if(targetSession){
                graphRef.current?.clearGraph();
                if(targetSession?.type==0){
                    getHisChatAndGraphData(targetSession.id);
                }else{
                    getTestCaseTaskStatus(targetSession)
                }
              
            }
           
        }
       /* setActiveSessionId(sessionId);
        const targetSession = sessions.find(s => s.id === sessionId);
        setLoading(false);*/
       /* if (targetSession?.graphData) {
            setRightCollapsed(false);
        } else {
            setRightCollapsed(true);
        }*/
    };
    const afterReRunTestCase = ()=>{
        const targetSession = sessions.find(s => s.id === activeSessionId);
        if(targetSession && targetSession.type==1){
            getTestCaseTaskStatus(targetSession)
        }
    }
    const handleCreateEmptySession = () => {
        if(loading && chatSessionRef.current!=='new'){
            console.log(sessions.find(s=>s.id==chatSessionRef.current),activeSessionId,currentMessages);
            Modal.confirm({
                title: '提示',
                content: `此操作将关闭当前会话内容，请确认后操作？`,
                onOk: async () => {
                    await handleStop();
                    controllerRef.current = null;
                    handleStartNewSession(true);
                },
                onCancel: () => {
                }
            });
        }else{
            handleStartNewSession();
        }
    };

    const saveTaskGraphData =(sessionId:string,messageId:string,data:GraphData)=>{
        const param = {
            taskId:messageId,
            conversationId:sessionId,
            data
        };
        saveGraph(param).then(async res=>{
            if(res.data.success){
                if(chatSessionRef.current == sessionId){
                    const taskGraphData = await getSessionGraphData(sessionId);
                    setSessions(prev => prev.map((s) => {
                        if (s.id === sessionId) {
                            return {
                                ...s,
                                taskGraphData:taskGraphData
                            };
                        }
                        return s;
                    }));
                }
            }
        })
    };
    const getSessionGraphData = (sessionId: string) => {
        return new Promise((resolve)=>{
            getGraph({conversationId: sessionId}).then(res=>{
                if(res.data.success){
                    resolve(res.data.data);
                    /*setSessions(prev => prev.map((s:ChatSession) => {
                        if (s.id === sessionId) {
                            return {
                                ...s,
                                taskGraphData:res.data.data
                            };
                        }
                        return s;
                    }));*/
                }else{
                    resolve([])
                }
            }).catch(err=>{
                resolve([])
            })
        })
    };
    //
    const getSessionList = ()=>{
        setSessionLoading(true);
        return getAllTaskSession({
            limit: 100,
            ontologyName:ontologyData.ontologyName||'',
        }).then(res=>{
            if(res.data.success){
                const data = res.data.data?.content||[];
                const sessionData = data.map(item=>{
                  //  item.time= formatTimestamp(item.createTime);
                  //  item.name = item.question;
                   let id = item.type==0?item.conversationId:item.batchNum;
                   if(!id){
                    id = `error-${item.type}-${item.id}`;
                   }
                   const question = item.type == 0?item.question:item.caseTotal>1?`进行【${item.question}】等${item.caseTotal}个CQ用例测试`:item.question;
                    const summary = {
                        ...item,
                        name: question,
                        time:  formatTimestamp(item.createTime),
                        id: id,
                        //id: item.type==0?item.conversationId:item.batchNum,

                    }
                    return {
                        ...item,
                        id, 
                        type:item.type,
                        summary:summary,
                      //  sysPrompt:item.inputs.sys_prompt,
                        messages:[]
                    }
                });
                setSessions(sessionData);

            }else{
                setSessionLoading(false);
            }
        }).catch(err=>{
            setSessionLoading(false);
        }).finally(()=>{
            setSessionLoading(false);
        })
    };
    const getSessionHis = (sessionId)=>{
        return new Promise((resolve)=>{
            setSessionLoading(true);
            getSessionHistory({
                ontologyName:ontologyData.ontologyName,
                conversationId: sessionId,
                limit: 100
            }).then(res=>{
                if(res.data.status == 'success'){
                    const data = res.data?.data?.data||[];//mockHistory;
                    const messages:Message[]  = [];

                    data.forEach(item=>{
                        if(item.query){
                            messages.push({
                                id:`user-${item.id}`,
                                content:item.query,
                                role:'user'
                            })
                        }
                        if(item.answer){
                            const content:any=[];
                            item.agent_thoughts.forEach(a=>{
                                if(a.thought && a.thought.length>0){
                                    content.push({
                                        id:`answer-${a.id}`,
                                        type:'answer',
                                        data:a.thought
                                    })
                                }
                                if(a.tool){
                                    const input = a.tool_input;//JSON.parse(a.tool_input)[a.tool];
                                    const output = a.observation;//JSON.parse(a.observation)[a.tool];
                                    content.push({
                                        id:`mcp-${a.id}`,
                                        type:'mcp',
                                        data:{
                                            tool:a.tool,
                                            input:input||'',
                                            output:output||'',
                                            runningType:a.running_type,
                                            runningLabel:a.running_label,
                                            status:'end'
                                        }
                                    })
                                }
                            });
                            messages.push({
                                id:item.id,
                                content:content,
                                role:'ai',
                                status:'completed'
                            })
                        } else if (item.status == 'error' && item.error) {
                            messages.push({
                                id: item.id,
                                content: [{
                                    id: item.id,
                                    data: item.error,
                                    type: 'answer',
                                }],
                                role: 'ai',
                                status: 'error'
                            })
                        }
                    });
                    resolve(messages);

                    /*setSessions(prev => prev.map(s => {
                        if (s.id === activeSessionId) {
                            return {
                                ...s,
                                messages: messages,
                                summary: {...s.summary}
                            };
                        }
                        return s;
                    }));*/
                }else{
                    resolve([])
                }
            }).catch(err=>{
                resolve([])
            }).finally(()=>{
                setSessionLoading(false);
            });
        })
    };
    const preNodeRef = useRef();
    let orderIndexRef = useRef(0);
    const templateGraphData = ()=>{
        const graphNodes = currentGraphData?.nodes||[];
        const graphEdges = currentGraphData?.edges||[];
        const id = Date.now().toString();
        const nodeTypes=['object','action','logic','interface'];
        const node = {
            id:id,
            data:{
                node_type:nodeTypes[Math.floor(Math.random()*nodeTypes.length)],
                label:id
            }};


        const edges=[];
        if(orderIndexRef.current>0){
            const edge1 = {
                source:preNodeRef.current.id,
                target:node.id,
                label:orderIndexRef.current.toString(),
                linkType:'order',
                id:`${preNodeRef.current.id}-${node.id}-order`
            };
            edges.push(edge1);
        }
        if(graphNodes.length>1){
            const edge2 = {
                target:node.id,
                source:graphNodes[Math.floor(Math.random()*graphNodes.length)].id,
                linkType:'relation'
            };
            edge2.id=`${edge2.source}-${edge2.target}-relation`;
            edges.push(edge2);
        }
        orderIndexRef.current+=1;
        preNodeRef.current=node;
        setRightCollapsed(false);
        setCurrentGraphData({nodes:[...graphNodes,node],edges:[...graphEdges,...edges]});

    };

    const getOverviewData = ()=>{
        getOntologyOverview({ontologyId:id}).then(res=>{
            if(res.data.success){
                const data = res.data.data;
                data.linkTypes = data.linkTypes.filter(item=>item.column)||[];
                data.title = data.ontologyLabel;
                data.type = 'ontology';
                setSiderOntologyData(data);
            }else{
                ArcoMessage.error('获取本体概览信息失败')
            }
        })
    };
    const getTestCaseData = ()=>{
        getTestCaseList({
            ontologyId:id,
            page:1,
            limit:9999,
        }).then(res=>{
            if(res.data.success){
                const data = res.data?.data?.content||[];
                data.forEach(item=>{
                    item.lastTime = item.task?.lastExecTime||'';
                    item.lastResult = item.task?.lastExecTesult||'Untested';
                })
                setTestCases(res.data.data.content);
            }
        })
    }
    useEffect(()=>{
        graphRef.current && graphRef.current.updateGraph(currentGraphData);
        if(!currentGraphData){
            setActiveGraphMessageId('');
        }
        /*if(fullScreenVisible) {
            setTimeout(() => {
                fullGraphRef.current && fullGraphRef.current.updateGraph(currentGraphData);
            }), 200
        }*/

    }, [currentGraphData, fullScreenVisible,rightCollapsed]);

    return (
        <div  className='test-chat-tabs'>
        <ModoTabs
            title='本体测试' 
            icon={<IconMgmtNodeColor/>}
            ref={modoTabsRef}>
        <Spin className="test-chat-spin" loading={sessionLoading}>
            <Layout className="app-layout">
                {/* 左侧 */}
                <TestManagementSider
                  collapsed={leftCollapsed}
                  onCollapse={setLeftCollapsed}
                  width={leftWidth}
                  testCases={testCases}
                  sessions={sessions.map(s => s.summary)}
                  activeSessionId={activeSessionId}
                  onSelectTestCase={handleStartTestCaseSession}
                  onSelectSession={handleSwitchSession}
                  onDeleteSession = {handleDeleteSession}
                  onClearSessions={handleClearSession}
                  onManage={() => setManagerVisible(true)} // 打开管理弹窗
                  onBatch = {()=> setBatchVisible(true)}
                />

                {!leftCollapsed && <div className="resizer-handle resizer-left" onMouseDown={() => setIsResizingLeft(true)}><div className="resizer-line" /></div>}

                {/* 中间：使用 Chat 组件 */}
                <Chat
                  activeSessionId={chatSessionRef.current}
                  activeGraphMessageId = {activeGraphMessageId}
                  messages={currentMessages}
                  sessions = {sessions}
                  graphData={currentGraphData}
                  ontology={ontologyData}
                  loading={loading}
                  sysPrompt={sysPrompt}
                  onChangePrompt={setSysPrompt}
                  inputValue={inputValue}
                  rightCollapsed={rightCollapsed}
                  onInputChange={setInputValue}
                  onSend={handleSend}
                  onStop={handleStop}
                  onRegenerate={handleRegenerate}
                  onRenderGraph={handleRenderGraph}
                  onCopy={handleCopy}
                  onEdit={handleEdit}
                  onRunCase={handleStartTestCaseSession}
                  onExpandRight={() => setRightCollapsed(false)}
                  onCreateEmptySession={handleCreateEmptySession}
                  messagesEndRef={messagesEndRef}
                  siderOntologyData={siderOntologyData}
                  afterReRunTestCase = {afterReRunTestCase}
                />

                {!rightCollapsed && <div className="resizer-handle resizer-right" onMouseDown={() => setIsResizingRight(true)}><div className="resizer-line" /></div>}

                {/* 右侧 */}
                <Sider
                  collapsible
                  collapsed={rightCollapsed}
                  onCollapse={setRightCollapsed}
                  trigger={null}
                  width={rightWidth}
                  collapsedWidth={50}
                  className="insight-sider"

                >
                    <div className="insight-header">
                        {rightCollapsed ?
                          <div className="header-actions">
                              <Tooltip content="展开" position="left">
                                  <Button icon={<IconSliderOffColor/>} style={{color: '#4B5665'}} type="text"
                                          onClick={() => setRightCollapsed(false)}/>
                              </Tooltip>
                          </div>: <>
                            <span className='title'>本体图谱</span>
                            <div className="header-actions">

                                <Tooltip content="收起" position="left">
                                    <Button icon={<IconSliderOnColor/>} style={{color: '#4B5665'}} type="text"
                                            onClick={() => setRightCollapsed(true)}/>
                                </Tooltip>
                            </div>
                        </>}

                    </div>
                    {
                        rightCollapsed ? <div className="sider-icons">
                              <Tooltip content="图谱" position="left">
                                  <Button
                                    className="graph-btn"
                                    type="text"
                                    icon={< IconArchiColor style={{ fontSize: 18, color: '#4B5665' }} />}
                                    onClick={() => setRightCollapsed(false)}
                                  />

                              </Tooltip>
                          </div> :
                          <div className="insight-body">
                            <GraphPanel
                                rightCollapsed={rightCollapsed}
                                ref={graphRef}
                                setFullScreenVisible={setFullScreenVisible}
                                ontology={ontologyData}
                                siderOntologyData={siderOntologyData}
                                disabled={loading}
                            />
                        </div>
                    }


                </Sider>


            </Layout>
        </Spin>
        </ModoTabs>
    {/* ★★★ 用例管理弹窗 ★★★ */}
        <TestCaseManagerModal
            visible={managerVisible}
            onClose={() =>{
                getTestCaseData();
                setManagerVisible(false)}}
            dataSource={testCases}
            ontology={ontologyData}
            onRunCase={handleStartTestCaseSession} // 在弹窗里点击“测试”，直接开启新会话
        />
        <BatchTestCaseModal
            visible={batchVisible}
            onClose={() => setBatchVisible(false)} 
            siderOntologyData={siderOntologyData}
            ontology={ontologyData}
            onRunCase={handleStartTestCaseSession} // 在弹窗里点击“开始测试”，直接开启新会话
        /> 
    </div>
    );
};

export default App;
