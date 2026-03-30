import React, { useRef, useState, useEffect } from 'react';
import { Layout, Button, Tooltip, Message as ArcoMessage } from '@arco-design/web-react';
import { IconSliderOffColor, IconSliderOnColor, IconArchiColor } from 'modo-design/icon';
import Chat from './Chat';
import GraphPanel from '../components/GraphPanel';
import { Message, GraphData, TestCase } from '../types';
import {
    getSessionHistory,
    stopChat,
    saveGraph,
    getGraph,
    taskStatus,
    startTestCaseTask,
    stopTestCaseTask,
    getPromptRdf,
    getPromptDetail
} from '../api';
import { formatTimestamp, OagPromptDefault } from '../index_new';

const { Sider } = Layout;

interface ChatPanelProps {
    mode: string;
    // 初始会话ID（可选，用于加载历史会话）
    initialSessionId?: string;
    // 会话类型：0=普通会话, 1=测试用例会话
    sessionType?: 0 | 1;
    // 测试用例（如果是测试用例会话）
    testCases?: TestCase[];
    // 共享数据
    ontology: any;
    siderOntologyData?: any;
    initialPromptId?: string; // 初始提示词ID（创建tab时的快照，不随配置变更）
    initialTitle?: string; // 初始标题（用于错误会话等场景）
    // 保存用例弹窗用：提示词列表与测试配置默认值
    promptListData?: any[];
    oagPromptListData?: any[];
    modeSettingData?: { defaultPrompt?: string; oagPrompt?: string };
    /** 保存用例成功后回调（用于刷新用例管理列表等） */
    onTestCaseSaved?: () => void;
    // 回调函数
    onRunCase?: (testCases: TestCase[]) => void; // 运行测试用例（可能会创建新tab）
    onSessionUpdate?: (sessionId: string, summary: any) => void; // 会话更新回调（用于更新tab标题等）
    onUserSend?: (text: string) => void; // 用户发送消息（用于标记/更新tab）
    onTaskStatusChange?: (status: { loading: boolean; taskId?: string | null; batchNum?: string }) => void; // 任务状态变化回调
    onCreateTestCaseReportTab?: (batchNum: string, total?: number) => void; // 创建测试报告tab
    /** 报告页「重新测试」后触发本 tab 刷新：注册 batchNum -> 刷新回调，callback 为 null 时注销 */
    onRegisterReRunRefresh?: (batchNum: string, callback: (() => void) | null) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
    mode,
    initialSessionId,
    sessionType = 0,
    testCases: initialTestCases,
    ontology,
    siderOntologyData,
    initialPromptId,
    initialTitle,
    promptListData,
    oagPromptListData,
    modeSettingData,
    onTestCaseSaved,
    onRunCase,
    onSessionUpdate,
    onUserSend,
    onTaskStatusChange,
    onCreateTestCaseReportTab,
    onRegisterReRunRefresh,
}) => {
    // ========== 状态管理 ==========
    const [sessionId, setSessionId] = useState(initialSessionId || 'new');
    const [sessionTypeState, setSessionTypeState] = useState<0 | 1>(sessionType);
    const [messages, setMessages] = useState<Message[]>([]);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [taskGraphData, setTaskGraphData] = useState<any[]>([]); // 所有消息的图谱数据
    const [activeGraphMessageId, setActiveGraphMessageId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sysPrompt, setSysPrompt] = useState<any>({});
    const [sysPromptLoading, setSysPromptLoading] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [rightWidth, setRightWidth] = useState(600);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [batchNum, setBatchNum] = useState<string | undefined>();
    const [taskId, setTaskId] = useState<string | null>(null);
    const [isStop, setIsStop] = useState(false);

    // Refs
    const graphRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<AbortController | null>(null);
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const batchNumRef = useRef<string | undefined>(batchNum);
    /** 同一本体下 RDF 提示词只请求一次 */
    const promptRdfCacheRef = useRef<{ ontologyId: string; value: string } | null>(null);
    const [fullScreenVisible, setFullScreenVisible] = useState(false);

    // ========== 初始化 ==========
    useEffect(() => {
        promptRdfCacheRef.current = null;
    }, [ontology?.id]);

    useEffect(() => {
        // 拉取本 tab 的默认提示词（promptId 为创建时快照，不随配置变更）
        if (initialPromptId) {
            setSysPromptLoading(true);
            getPromptDetail({ id: initialPromptId })
                .then(res => {
                    if (res.data?.success) {
                        const data = res.data.data || {};
                        setSysPrompt({
                            ...data,
                            id: initialPromptId,
                            promptContent: data?.promptContent || '',
                            initPromptContent: data?.promptContent || ''
                        });
                    }
                })
                .finally(() => {
                    setSysPromptLoading(false);
                });
        }

        if (initialSessionId && initialSessionId !== 'new') {
            // 加载历史会话
            loadHistorySession(initialSessionId, sessionTypeState);
        } else {
            // 新建会话，显示欢迎消息
            const welcomeMessage: Message = {
                id: 'welcome',
                role: 'ai',
                content: [{
                    id: 'welcome',
                    type: 'answer',
                    data: '您好！我是本体测试助手。当前本体模型已就绪，您可以输入问题或选择测试用例进行本体测试。'
                }],
                status: 'completed'
            };
            setMessages([welcomeMessage]);
        }

        // 如果是测试用例会话，自动启动
        if (initialTestCases && initialTestCases.length > 0) {
            setTimeout(() => {
                handleStartTestCaseSession(initialTestCases);
            }, 100);
        }

        // 清理资源
        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
            clearPollingTimer();
        };
    }, []);

    useEffect(() => {
        batchNumRef.current = batchNum;
    }, [batchNum]);

    // 监听任务状态变化，通知父组件
    useEffect(() => {
        onTaskStatusChange?.({
            loading,
            taskId,
            batchNum
        });
    }, [loading, taskId, batchNum, onTaskStatusChange]);

    // ========== 工具函数 ==========
    const clearPollingTimer = () => {
        if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
        }
    };

    // ========== 核心会话操作 ==========

    // 1. 发送消息
    const handleSend = (text?: string, parentMessageId?: string | null) => {
        const queryText = text || inputValue;
        if (!queryText.trim()) return;
        if (sysPromptLoading) {
            ArcoMessage.info('提示词加载中，请稍后再试');
            return;
        }

        onUserSend?.(queryText);

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: queryText
        };

        setMessages(prev => [...prev, userMsg]);

        if (queryText === inputValue) {
            setInputValue('');
        }

        setGraphData(null);
        triggerAIResponse(queryText, parentMessageId);
    };

    // 2. 停止生成
    const handleStop = async () => {
        if (sessionTypeState === 1 && batchNum) {
            stopTestCaseTask({
                batchNum: batchNum
            }).then(res => {
                if (res.data.status === 'success') {
                    ArcoMessage.info('已成功发起停止会话请求');
                    setIsStop(true);
                } else {
                    ArcoMessage.error('停止指令发送失败');
                }
            }).catch(err => {
                ArcoMessage.error('停止指令发送失败');
            });
        } else if (taskId) {
            try {
                stopChat({
                    promptType:mode==0?0:1,
                    ontologyName: ontology.ontologyName,
                    taskId: taskId
                }).then(res => {
                    if (res.data.status === 'success') {
                        ArcoMessage.info('已成功发起停止会话请求');
                        setIsStop(true);
                    } else {
                        ArcoMessage.error('停止指令发送失败');
                    }
                });
            } catch (e) {
                console.error('Stop request failed', e);
                ArcoMessage.error('停止指令发送失败');
            }
        }
    };

    // 3. 重新生成
    const handleRegenerate = (msgIndex: number) => {
        let targetUserMsg: Message | null = null;
        let userIndex: number | null = null;
        let parentMessageId: string | null = null;

        for (let i = msgIndex - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                targetUserMsg = messages[i];
                userIndex = i;
                break;
            }
        }

        for (let i = (userIndex || 0) - 1; i >= 0; i--) {
            if (messages[i].role === 'ai') {
                parentMessageId = messages[i].id || null;
                break;
            }
        }

        if (targetUserMsg) {
            handleSend(targetUserMsg.content, parentMessageId);
        } else {
            ArcoMessage.warning('未找到对应的提问上下文');
        }
    };

    // 4. 创建空会话（tab内重置）
    const handleCreateEmptySession = () => {
        if (loading) {
            // 如果正在加载，先停止
            handleStop();
        }

        setSessionId('new');
        setMessages([{
            id: 'welcome',
            role: 'ai',
            content: [{
                id: 'welcome',
                type: 'answer',
                data: '您好！我是本体测试助手。当前本体模型已就绪，您可以输入问题或选择测试用例进行本体测试。'
            }],
            status: 'completed'
        }]);
        setGraphData(null);
        setTaskGraphData([]);
        setActiveGraphMessageId('');
        setBatchNum(undefined);
        setTaskId(null);
        setSessionTypeState(0);
        setLoading(false);
        graphRef.current?.clearGraph();
    };

    // ========== 消息和会话状态更新 ==========

    const updateSessionMessage = (msgId: string, messageId: string, updates: Partial<Message>, sessionUpdate?: any) => {
        setMessages(prev => prev.map(m =>
            m.id === msgId || m.id === messageId ? { ...m, id: messageId, ...updates } : m
        ));

        if (sessionUpdate?.taskId) {
            setTaskId(sessionUpdate.taskId);
        }
    };

    const updateSessionSummaryName = (sid: string, name: string) => {
        if (onSessionUpdate) {
            onSessionUpdate(sid, {
                id: sid,
                name: name || '新会话',
                type: sid === 'new' ? 'new' : 'update',
                time: formatTimestamp(Math.floor(Date.now() / 1000))
            });
        }
    };

    const updateSessionId = (oriSessionId: string, newSessionId: string, update?: any) => {
        setSessionId(newSessionId);
        if (update?.taskId) {
            setTaskId(update.taskId);
        }
    };

    // ========== 图谱相关 ==========

    const handleRenderGraph = (messageId: string) => {
        const currentData = taskGraphData.find(item => item.taskId === messageId);
        setRightCollapsed(false);
        setGraphData(currentData?.graph || null);
        setActiveGraphMessageId(messageId);
    };

    const saveTaskGraphData = (sid: string, msgId: string, data: GraphData) => {
        const param = {
            taskId: msgId,
            conversationId: sid,
            data
        };
        saveGraph(param).then(async res => {
            if (res.data.success) {
                // 新会话时 sessionId 尚未从 'new' 更新，调用方即当前会话，直接按 sid 刷新
                const graphDataList = await getSessionGraphData(sid);
                setTaskGraphData(graphDataList);
            }
        });
    };

    const getSessionGraphData = (sid: string): Promise<any[]> => {
        return new Promise((resolve) => {
            getGraph({ conversationId: sid }).then(res => {
                if (res.data.success) {
                    resolve(res.data.data || []);
                } else {
                    resolve([]);
                }
            }).catch(err => {
                resolve([]);
            });
        });
    };

    // ========== AI 回复（SSE流式处理） ==========

    const triggerAIResponse = async (queryText: string, parentMessageId?: string | null) => {
        let currentSessionId = sessionId;
        setLoading(true);

        // 创建空消息占位
        const aiMsgId = (Date.now() + 1).toString();
        const initialAiMsg: Message = {
            id: aiMsgId,
            role: 'ai',
            content: [],
            status: 'streaming',
            taskId: ''
        };

        setMessages(prev => [...prev, initialAiMsg]);
        setTaskId(null);

        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            // 获取提示词RDF
            const promptRdf = await getPromptRdfData();
            const requestBody: any = {
                query: queryText,
                ontologyName: ontology.ontologyName,
                promptType:mode == '0'?0:1,
                sysPrompt: `${sysPrompt.promptContent || ''}\n${mode=='0'?promptRdf:OagPromptDefault+'"'+ontology.id+'"'}`,
                ...(sysPrompt.promptContent!==sysPrompt.initPromptContent ? {sysPromptId: sysPrompt.id} : {}),
                conversationId: currentSessionId === 'new' ? '' : currentSessionId
            };

            if (parentMessageId) {
                requestBody.parentMessageId = parentMessageId;
            }

            const origin = window.location.origin;
            const response = await fetch(`${origin}/ontology/_api/v1/dify/chat`, {

           // const response = await fetch(`${origin}/ontology/_api/v1/ontology_back/api/v1/ontology/agent/chat`, {
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
            let lastUpdateTime = 0;
            const UPDATE_INTERVAL = 200;
            let messageId = aiMsgId;
            const graphNodes: any = [];
            const graphOrderEdges: any = [];
            let graphRelationEdges: any = [];
            let orderLabel = 0;
            let preNode: any = null;
            const relationEdgesMap: any = {};
            const contents: any = {};
            let message_index = 0;
            let currentTaskId = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || '';
                let needUpdate = false;

                for (const part of parts) {
                    if (!part.trim()) continue;
                    if (!part.startsWith('data:')) continue;

                    const dataStr = part.slice(5);
                    try {
                        const data = JSON.parse(dataStr);

                        messageId = data.message_id;

                        // 如果是新建会话，更新会话ID
                        if (currentSessionId === 'new') {
                            currentSessionId = data.conversation_id;
                            setSessionId(currentSessionId);
                            currentTaskId = data.task_id;
                            updateSessionId('new', currentSessionId, { taskId: currentTaskId });
                        } else if (!currentTaskId) {
                            currentTaskId = data.task_id;
                            setTaskId(currentTaskId);
                        }

                        const eventType = data.event;

                        switch (eventType) {
                            case 'agent_thought':
                                if (data.tool) {
                                    const content = {
                                        id: data.id,
                                        type: 'mcp',
                                        data: {
                                            tool: data.tool,
                                            input: data.tool_input || '',
                                            output: data.observation || '',
                                            runningType: data.running_type,
                                            runningLabel: data.running_label,
                                            status: data.mcp_status
                                        }
                                    };

                                    // 处理图谱节点
                                    if (['object', 'action', 'logic', 'interface'].includes(data.running_type)) {
                                        const nodeGraphDetail = data.graph_detail;
                                        const detail = data.running_detail;
                                        const nodeName = detail[data.running_type + '_name'];

                                        const nodeData = nodeGraphDetail?.nodes?.find((node: any) => {
                                            const nData = node.data;
                                            if (nData.node_type === data.running_type) {
                                                return nData['object_type_name'] === nodeName ||
                                                    nData['action_name'] === nodeName ||
                                                    nData['logic_type_name'] === nodeName ||
                                                    nData['name'] === nodeName;
                                            }
                                            return false;
                                        });

                                        if (nodeData && nodeGraphDetail) {
                                            const node = { ...nodeData };
                                            if (!graphNodes.find((item: any) => item.id === nodeData.id)) {
                                                graphNodes.push(node);
                                            }

                                            if (orderLabel > 0) {
                                                const edge = {
                                                    source: preNode.id,
                                                    target: node.id,
                                                    label: orderLabel.toString(),
                                                    linkType: 'order',
                                                    id: `${preNode.id}-${node.id}-${orderLabel}-order`
                                                };
                                                graphOrderEdges.push(edge);
                                            }
                                            orderLabel += 1;
                                            preNode = node;

                                            nodeGraphDetail?.edges?.forEach((edge: any) => {
                                                relationEdgesMap[`${edge.source}-${edge.target}`] = edge;
                                            });

                                            const relationEdgeData = Object.values(relationEdgesMap) || [];
                                            const edges = relationEdgeData.filter((edge: any) => {
                                                return graphNodes.find((n: any) => n.id === edge.source) &&
                                                    graphNodes.find((n: any) => n.id === edge.target);
                                            });

                                            graphRelationEdges = edges.map((edge: any) => ({
                                                ...edge,
                                                linkType: 'relation',
                                                id: `${edge.source}-${edge.target}-relation`
                                            }));

                                            const graphData = graphNodes.length > 0 ?
                                                { nodes: graphNodes, edges: [...graphRelationEdges, ...graphOrderEdges] } : null;
                                            if (graphData) {
                                                saveTaskGraphData(currentSessionId, data.message_id, graphData);
                                            }
                                        }
                                    }

                                    contents[data.id] = content;
                                }
                                message_index += 1;
                                needUpdate = true;
                                break;

                            case 'agent_message':
                                const contentId = data.id + message_index;
                                if (contents[contentId]) {
                                    contents[contentId].data += data.answer;
                                } else {
                                    contents[contentId] = {
                                        id: contentId,
                                        data: data.answer,
                                        type: 'answer',
                                    };
                                }
                                needUpdate = true;
                                break;

                            case 'message_end':
                                const finalGraphData = graphNodes.length > 0 ?
                                    { nodes: graphNodes, edges: [...graphRelationEdges, ...graphOrderEdges] } : null;

                                updateSessionMessage(aiMsgId, messageId, {
                                    status: 'completed',
                                    content: Object.values(contents)
                                }, { taskId: currentTaskId });

                                if (finalGraphData) {
                                    saveTaskGraphData(currentSessionId, data.message_id, finalGraphData);
                                }

                                setLoading(false);

                                // 新会话时 sessionId 仍为 'new'（setState 异步），用 sessionId === 'new' 表示当前即本会话
                                if (finalGraphData && (currentSessionId === sessionId || sessionId === 'new')) {
                                    setRightCollapsed(false);
                                    setGraphData(finalGraphData);
                                    setActiveGraphMessageId(messageId);
                                }
                                break;

                            case 'error':
                                updateSessionMessage(aiMsgId, messageId, {
                                    content: [{
                                        id: `error-${new Date().getTime().toString()}`,
                                        data: data.message || 'error',
                                        type: 'answer',
                                    }],
                                    status: 'completed',
                                }, { taskId: currentTaskId });
                                setLoading(false);
                                break;
                        }
                    } catch (error) {
                        console.error('解析 SSE 数据失败:', error);
                    }
                }

                const now = Date.now();
                if (needUpdate && (now - lastUpdateTime > UPDATE_INTERVAL)) {
                    const graphData = graphNodes.length > 0 ?
                        { nodes: graphNodes, edges: [...graphRelationEdges, ...graphOrderEdges] } : null;

                    updateSessionMessage(aiMsgId, messageId, {
                        content: Object.values(contents),
                        graphData
                    });

                    // 新会话时 sessionId 仍为 'new'，用 sessionId === 'new' 表示当前即本会话
                    if (graphData && (currentSessionId === sessionId || sessionId === 'new')) {
                        setRightCollapsed(false);
                        setGraphData(graphData);
                        setActiveGraphMessageId(messageId);
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
                updateSessionMessage(aiMsgId, aiMsgId, {
                    content: [{
                        id: new Date().getTime().toString(),
                        data: '网络请求失败',
                        type: 'answer',
                    }],
                    status: 'completed',
                });
            }
        } finally {
            setLoading(false);
            controllerRef.current = null;

            if (currentSessionId !== 'new') {
                updateSessionSummaryName(currentSessionId, queryText);
            } else {
                // 更新所有 mcp 状态为 end
                setMessages(prev => prev.map(msg => {
                    if (msg.role === 'ai' && msg.content) {
                        return {
                            ...msg,
                            content: msg.content.map((item: any) => {
                                if (item.type === 'mcp') {
                                    return { ...item, status: 'end' };
                                }
                                return item;
                            })
                        };
                    }
                    return msg;
                }));
            }
            setTaskId(null);
        }
    };

    const getPromptRdfData = (): Promise<string> => {
        const id = ontology?.id;
        if (!id) return Promise.resolve('');

        const cached = promptRdfCacheRef.current;
        if (cached && cached.ontologyId === id) {
            return Promise.resolve(cached.value);
        }

        return new Promise((resolve, reject) => {
            getPromptRdf({ id }).then(res => {
                if (res.data.success) {
                    const value = res.data?.data?.prompt || '';
                    promptRdfCacheRef.current = { ontologyId: id, value };
                    resolve(value);
                } else {
                    ArcoMessage.error(res.data.message || '获取提示词RDF失败');
                    resolve('');
                }
            }).catch(err => {
                ArcoMessage.error('获取提示词RDF失败');
                resolve('');
            });
        });
    };

    // ========== 测试用例会话相关 ==========

    const handleStartTestCaseSession = (testCases: TestCase[]) => {
        if (testCases.length === 0) {
            setLoading(false);
            return;
        }

        const testCase = testCases[0];
        const title = testCases.length === 1 ?
            testCase.question :
            `进行【${testCase.question}】等${testCases.length}个CQ用例测试`;

        setSessionTypeState(1);
        setMessages([{
            id: Date.now().toString(),
            role: 'user',
            content: title
        }]);

        sendAITestCase(testCases);
    };

    const sendAITestCase = (testCases: TestCase[]) => {
        setLoading(true);
        const initialAiMsg: Message = {
            id: `${sessionId}-ai`,
            role: 'ai',
            content: [{
                id: sessionId,
                type: 'test-case-result',
                data: testCases,
                finished: 0,
                isFinished: false,
                total: testCases.length
            }],
            status: 'streaming',
        };

        setMessages(prev => [...prev, initialAiMsg]);
        setTaskId(null);

        startTestCaseTask({
            promptType:mode == '0'?0:1,
            ontologyName: ontology.ontologyName,
            caseIdList: testCases.map(item => item.id)
        }).then(async (res: any) => {
            if (res.data.success) {
                const newBatchNum = res.data.data?.batchNum || '';
                setBatchNum(newBatchNum);
                batchNumRef.current = newBatchNum;
                setSessionId(newBatchNum);

                // 更新消息ID
                setMessages(prev => prev.map(msg => {
                    if (msg.role === 'user') {
                        return { ...msg, id: newBatchNum };
                    } else if (msg.role === 'ai') {
                        return {
                            ...msg,
                            id: `${newBatchNum}-ai`,
                            content: msg.content.map((item: any) => ({
                                ...item,
                                id: newBatchNum
                            }))
                        };
                    }
                    return msg;
                }));

                setLoading(false);

                // 通知父组件更新tab标题
                if (onSessionUpdate) {
                    const testCase = testCases[0];
                    const title = testCases.length === 1 ?
                        testCase.question :
                        `进行【${testCase.question}】等${testCases.length}个CQ用例测试`;
                    onSessionUpdate(newBatchNum, {
                        id: newBatchNum,
                        name: title,
                        type: 'update-test-case',
                        time: formatTimestamp(Math.floor(Date.now() / 1000))
                    });
                }

                // 启动轮询
                startTestCasePolling(newBatchNum);
            } else {
                setLoading(false);
            }
        }).catch(() => {
            setLoading(false);
        });
    };

    const getTestCaseTaskStatus = (batchNumParam?: string) => {
        const currentBatchNum = batchNumParam || batchNum;
        if (!currentBatchNum) return;

        setRightCollapsed(false);
        setGraphData(null);

        taskStatus({ batchNum: currentBatchNum }).then(res => {
            if (res.data.success) {
                const data = res.data.data;
                const aiMessage: Message = {
                    id: `${sessionId}-ai`,
                    role: 'ai',
                    content: [{
                        id: currentBatchNum,
                        type: 'test-case-result',
                        data: null,
                        finished: data.finished || 0,
                        isFinished: !!data.isFinished,
                        total: data.total || 0
                    }],
                    status: data.isFinished ? 'completed' : 'streaming',
                };

                setMessages(prev => {
                    const userMsg = prev.find(m => m.role === 'user');
                    return userMsg ? [userMsg, aiMessage] : [aiMessage];
                });

                if (!data.isFinished) {
                    startTestCasePolling(currentBatchNum);
                }
            }
        });
    };

    const startTestCasePolling = (batchNumToPoll: string) => {
        clearPollingTimer();

        pollingTimerRef.current = setInterval(() => {
            if (batchNumToPoll !== batchNumRef.current) {
                clearPollingTimer();
                setLoading(false);
                return;
            }

            taskStatus({ batchNum: batchNumToPoll }).then((pollRes: any) => {
                if (pollRes.data.success) {
                    const pollData = pollRes.data.data;
                    setMessages(prev => prev.map((msg: Message) => {
                        if (msg.role === 'ai' && msg.content && Array.isArray(msg.content)) {
                            const content = msg.content.map((item: any) => {
                                if (item.type === 'test-case-result') {
                                    return {
                                        ...item,
                                        id: batchNumToPoll,
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
                    }));

                    if (pollData.isFinished) {
                        clearPollingTimer();
                        setLoading(false);
                    }
                }
            }).catch(() => {
                clearPollingTimer();
                setLoading(false);
            });
        }, 3000);
    };

    const afterReRunTestCase = () => {
        if (sessionTypeState === 1) {
            getTestCaseTaskStatus();
        }
    };

    // 报告页「重新测试」时由父组件触发：本 tab 拉取状态，若未结束则开始轮询
    useEffect(() => {
        if (sessionTypeState !== 1 || !batchNum || !onRegisterReRunRefresh) return;
        onRegisterReRunRefresh(batchNum, () => getTestCaseTaskStatus(batchNum));
        return () => onRegisterReRunRefresh(batchNum, null);
    }, [sessionTypeState, batchNum, onRegisterReRunRefresh]);

    // ========== 会话历史加载 ==========

    const getSessionHis = (sid: string): Promise<Message[]> => {
        return new Promise((resolve) => {
            getSessionHistory({
                promptType:mode == '0'?0:1,
                ontologyName: ontology.ontologyName,
                conversationId: sid,
                limit: 100
            }).then(res => {
                if (res.data.status === 'success') {
                    const data = res.data?.data?.data || [];
                    const messagesList: Message[] = [];

                    data.forEach((item: any) => {
                        if (item.query) {
                            messagesList.push({
                                id: `user-${item.id}`,
                                content: item.query,
                                role: 'user'
                            });
                        }
                        if (item.answer) {
                            const content: any = [];
                            item.agent_thoughts.forEach((a: any) => {
                                if (a.thought && a.thought.length > 0) {
                                    content.push({
                                        id: `answer-${a.id}`,
                                        type: 'answer',
                                        data: a.thought
                                    });
                                }
                                if (a.tool) {
                                    content.push({
                                        id: `mcp-${a.id}`,
                                        type: 'mcp',
                                        data: {
                                            tool: a.tool,
                                            input: a.tool_input || '',
                                            output: a.observation || '',
                                            runningType: a.running_type,
                                            runningLabel: a.running_label,
                                            status: 'end'
                                        }
                                    });
                                }
                            });
                            messagesList.push({
                                id: item.id,
                                content: content,
                                role: 'ai',
                                status: 'completed'
                            });
                        } else if (item.status === 'error' && item.error) {
                            messagesList.push({
                                id: item.id,
                                content: [{
                                    id: item.id,
                                    data: item.error,
                                    type: 'answer',
                                }],
                                role: 'ai',
                                status: 'error'
                            });
                        }
                    });

                    resolve(messagesList);
                } else {
                    resolve([]);
                }
            }).catch(err => {
                resolve([]);
            });
        });
    };

    const loadHistorySession = async (sid: string, type: 0 | 1) => {
        setLoading(true);
        setMessages([]);
        setGraphData(null);
        setSessionId(sid);
        setSessionTypeState(type);

        if (sid.startsWith('error-')) {
            // 错误会话：使用 initialTitle（即 summary.question）作为 user message 的 content
            setMessages([{
                id: `user-${sid}`,
                content: initialTitle || '错误会话',
                role: 'user'
            }, {
                id: sid,
                content: [{
                    id: sid,
                    type: 'answer',
                    data: 'error'
                }],
                role: 'ai',
                graphData: null,
                status: 'error'
            }]);
            setLoading(false);
            return;
        }

        try {
        if (type === 0) {
            // 普通会话
            const messagesList = await getSessionHis(sid);
            const graphDataList = await getSessionGraphData(sid);

            // 将图谱数据关联到消息
            messagesList.forEach(msg => {
                if (msg.role === 'ai') {
                    msg.graphData = graphDataList?.find((g: any) => g.taskId === msg.id)?.graph || null;
                }
            });

            setMessages(messagesList);
            setTaskGraphData(graphDataList || []);

            if (messagesList.length > 0 && graphDataList.length > 0) {
                setRightCollapsed(false);
                const aiGraphMessages = messagesList.filter(msg => msg.role === 'ai');
                const lastAiMessage = aiGraphMessages.length > 0 ? aiGraphMessages[aiGraphMessages.length - 1] : null;
                if (lastAiMessage?.graphData) {
                    setGraphData(lastAiMessage.graphData);
                    setActiveGraphMessageId(lastAiMessage.id || '');
                }
            }
        } else {
            // 测试用例会话
            setBatchNum(sid);
            getTestCaseTaskStatus(sid);
        }
        } finally {
            setLoading(false);
        }
    };

    // ========== 工具函数 ==========

    const handleCopy = (content: string) => {
        const fallbackCopy = (text: string) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.setAttribute('readonly', 'readonly');
            textArea.style.position = "absolute";
            textArea.style.left = "-9999px";
            textArea.style.top = "-9999px";
            textArea.style.opacity = "0";
            textArea.id = "chat-copy-textarea";
            document.body.appendChild(textArea);

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

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content)
                .then(() => {
                    ArcoMessage.success('已复制到剪贴板');
                })
                .catch((err) => {
                    console.warn('Clipboard API failed, using fallback.', err);
                    fallbackCopy(content);
                });
        } else {
            fallbackCopy(content);
        }
    };

    const handleEdit = (content: string) => {
        setInputValue(content);
    };

    // ========== 右侧面板拖拽 ==========

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingRight) {
                const newWidth = Math.max(300, Math.min(window.innerWidth - e.clientX, 800));
                setRightWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizingRight(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (isResizingRight) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingRight]);

    // ========== 图谱更新 ==========

    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.updateGraph(graphData);
        }
        if (!graphData) {
            setActiveGraphMessageId('');
        }
    }, [graphData, rightCollapsed]);

    // ========== 滚动到底部 ==========

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // ========== 渲染 ==========

    const currentSession = {
        id: sessionId,
        summary: { id: sessionId, name: sessionId === 'new' ? '新会话' : sessionId },
        messages,
        type: sessionTypeState,
        taskGraphData,
        taskId,
        isStop,
        batchNum
    };

    return (
        <>
            <Chat
                activeSessionId={sessionId}
                activeGraphMessageId={activeGraphMessageId}
                messages={messages}
                sessions={[currentSession]}
                graphData={graphData}
                ontology={ontology}
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
                onRunCase={(testCases) => {
                    if (onRunCase) {
                        onRunCase(testCases);
                    } else {
                        handleStartTestCaseSession(testCases);
                    }
                }}
                onExpandRight={() => setRightCollapsed(false)}
                onCreateEmptySession={handleCreateEmptySession}
                messagesEndRef={messagesEndRef}
                siderOntologyData={siderOntologyData}
                afterReRunTestCase={afterReRunTestCase}
                onCreateTestCaseReportTab={onCreateTestCaseReportTab}
                reportDisabled={sessionTypeState === 1 && !batchNum}
                promptListData={promptListData}
                oagPromptListData={oagPromptListData}
                modeSettingData={modeSettingData}
                onTestCaseSaved={onTestCaseSaved}
            />

            {!rightCollapsed && (
                <div
                    className="resizer-handle resizer-right"
                    onMouseDown={() => setIsResizingRight(true)}
                >
                    <div className="resizer-line" />
                </div>
            )}

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
                    {rightCollapsed ? (
                        <div className="header-actions">
                            <Tooltip content="展开" position="left">
                                <Button
                                    icon={<IconSliderOffColor />}
                                    style={{ color: '#4B5665' }}
                                    type="text"
                                    onClick={() => setRightCollapsed(false)}
                                />
                            </Tooltip>
                        </div>
                    ) : (
                        <>
                            <span className="title">本体图谱</span>
                            <div className="header-actions">
                                <Tooltip content="收起" position="left">
                                    <Button
                                        icon={<IconSliderOnColor />}
                                        style={{ color: '#4B5665' }}
                                        type="text"
                                        onClick={() => setRightCollapsed(true)}
                                    />
                                </Tooltip>
                            </div>
                        </>
                    )}
                </div>
                {rightCollapsed ? (
                    <div className="sider-icons">
                        <Tooltip content="图谱" position="left">
                            <Button
                                className="graph-btn"
                                type="text"
                                icon={<IconArchiColor style={{ fontSize: 18, color: '#4B5665' }} />}
                                onClick={() => setRightCollapsed(false)}
                            />
                        </Tooltip>
                    </div>
                ) : (
                    <div className="insight-body">
                        <GraphPanel
                            rightCollapsed={rightCollapsed}
                            ref={graphRef}
                            setFullScreenVisible={setFullScreenVisible}
                            ontology={ontology}
                            siderOntologyData={siderOntologyData}
                            disabled={loading}
                        />
                    </div>
                )}
            </Sider>
        </>
    );
};

export default ChatPanel;
