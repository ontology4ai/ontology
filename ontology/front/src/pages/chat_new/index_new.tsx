import React, { useState, useRef, useEffect } from 'react';
import {
    Layout, Modal, Button, Tooltip, Tag, Typography, Message as ArcoMessage, Spin, Tabs, Radio, Dropdown, Input, Form, Select
} from '@arco-design/web-react';
import {
    IconClockCircle,
    IconFullscreen, IconLeft, IconMenuFold, IconRight,
    IconClose
} from '@arco-design/web-react/icon';
import {IconSliderOffColor,IconSliderOnColor,IconUnitDevColor, IconArrowDown, IconSetting, IconSearchColor} from "modo-design/icon";
import GraphPanel from './components/GraphPanel';
import TestManagementSider from './components/TestManagementSider';
import Chat from './components/Chat'; // 引入新组件
import { Message, GraphData, TestCase, ChatSession } from './types'; 

import chatIcon from '@/pages/chat_new/images/chat.svg';
import './index.less';

import graphBranchIcon from '@/pages/chat_new/images/branchGraph.svg';
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
    saveOntologyModeSetting,
    getPromptDetail,
    getOntologyModeSettingData,
} from './api';
import {useParams} from "react-router";
import {getOntologyOverview} from "@/pages/ontology-graph-preview/api";

import { v4 as uuidv4 } from 'uuid';

import ModoTabs from '@/components/Tabs';
import ChatPanel from './ChatPanel';
import CaseManagerPage from './components/case-manager';
import TestCaseReportPage from './components/test-case-report';
const { Sider } = Layout;
const { Title } = Typography; 
const FormItem = Form.Item;
export const OagPromptDefault = `# 本体基础信息
ontology id: `;
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
const TabPane = Tabs.TabPane;
const RadioGroup = Radio.Group;
const modeOptions = [
    { label: '通用模式', value: '0' },
    { label: 'OAG模式', value: '1' },
];
const App: React.FC = () => {


    let { id } = useParams();
   // const ontologyName = 'CEM';  //todo  假数据
    // --- 布局状态 ---
    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [leftWidth, setLeftWidth] = useState(280);
    const [isResizingLeft, setIsResizingLeft] = useState(false);

    // --- 全局数据状态 ---
    const [testHistoryList, setTestHistoryList] = useState<any[]>([]); // 会话历史列表（用于左侧列表）
    const [testCases, setTestCases] = useState<TestCase[]>([]); // 测试用例列表
    const [ontologyData, setOntologyData] = useState<any>({}); // 本体数据
    // sysPrompt 已下放到 ChatPanel 内部（每个 tab 内部拉取并固定使用）。
    // 这里保留一份 sysPrompt state 仅用于兼容文件内遗留逻辑引用（不再作为 tab 初始化来源）。
    const [sysPrompt, setSysPrompt] = useState<any>({ id: '', promptContent: '', mode: '0' });
    const [siderOntologyData, setSiderOntologyData] = useState<any>({}); // 本体概览数据
    const [sessionLoading, setSessionLoading] = useState(false); // 全局加载状态
    const [mode, setMode] = useState(); // 模式
    const [modeSettingVisible, setModeSettingVisible] = useState(false); // 测试配置弹窗
    const [promptListData, setPromptListData] = useState<any[]>([]); // 提示词列表数据
    const [oagPromptListData, setOagPromptListData] = useState<any[]>([]); // OAG模式提示词列表数据
    const modeSettingFormRef = useRef();
    const [modeSettingData, setModeSettingData] = useState<any>(null); // 测试配置数据
    // --- Tab 管理状态 ---
    const [activeTab, setActiveTab] = useState('');
    const [tabs, setTabs] = useState<any[]>([]);
    const [tabSearchValue, setTabSearchValue] = useState(''); // tab搜索值
    const [tabSearchDropdownVisible, setTabSearchDropdownVisible] = useState(false); // 搜索标签页下拉是否展开
    const [tabTaskStatus, setTabTaskStatus] = useState<Record<string, { loading: boolean; taskId?: string | null; batchNum?: string; sessionType?: 0 | 1 }>>({}); // tab任务状态
    const [caseManagerListRefreshKey, setCaseManagerListRefreshKey] = useState(0); // 保存用例后刷新用例管理列表

    // --- Refs ---
    const modoTabsRef = useRef<any>(null);
    const tabsRef = useRef<any>(null);
    const tabViewRef = useRef<Record<string, React.ReactNode>>({});
    /** 报告页「重新测试」后触发对应 testCase tab 刷新：batchNum -> 该 tab 的刷新回调 */
    const reRunRefreshCallbacksRef = useRef<Record<string, () => void>>({});
    // 模式切换中的保护：避免清空 tabs 时触发“空 tabs 自动新建默认会话”
    const isSwitchingModeRef = useRef(false);

    // --- 拖拽调整左侧宽度 ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft) setLeftWidth(Math.max(220, Math.min(e.clientX, 500)));
        };
        const handleMouseUp = () => {
            setIsResizingLeft(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };
        if (isResizingLeft) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingLeft]);

    //数据初始化
    //获取本体初始数据
    useEffect(()=>{
        getModeSetting();
        getOntologyInfo();
    },[]); 
    
    // 等 getOverviewData 完成并 setSiderOntologyData 后再创建会话 tab，避免新建会话时本体概览侧栏无数据
    useEffect(()=>{
        if(ontologyData && ontologyData.ontologyName && modeSettingData && siderOntologyData?.title ){
            setSessionLoading(true);
            getSessionList(true);
            getTestCaseData();
            const promptId = mode == '0' ? modeSettingData.defaultPrompt : modeSettingData.oagPrompt;
            if (promptId) {
                const newKey = createChatTab({ initialPromptId: promptId });
                setTimeout(() => {
                    setTabs(tabsRef.current?.state?.tabs || []);
                    setActiveTab(newKey);
                    setSessionLoading(false);
                }, 0);
            }
        }else{
            setSessionLoading(false);
        }
    },[ontologyData, mode, siderOntologyData]);
    // 获取提示词列表数据（用于：测试配置弹窗、用例管理等；保存用例弹窗已改为自行请求）
    useEffect(() => {
        if (!id) return;
        getPromptList({ ontologyId: id, page: 1, limit: 999, keyword: '' }).then(res => {
            if (res.data.success) {
                const data = res.data.data.content || [];
                const promptList = data.filter((item: any) => item.promptType == 0).map((item: any) => ({
                    label: item.promptName,
                    value: item.id,
                    ...item,
                }));
                setPromptListData(promptList);
                const oagPromptList = data.filter((item: any) => item.promptType == 1).map((item: any) => ({
                    label: item.promptName,
                    value: item.id,
                    ...item,
                }));
                setOagPromptListData(oagPromptList);
            }
        });
    }, [id]);

    // ================= Tab 管理逻辑 =================

    // 切换模式：停止进行中会话、清空 tabs、刷新数据、创建默认会话 tab
    const handleModeChange = (nextMode: string) => {
        if (nextMode == mode) return;
        const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
        const runningType0Tabs = openedTabs.filter((t: any) => {
            const st = tabTaskStatus[t.key];
            return t.sessionType === 0 && !!st?.loading && !!st?.taskId;
        });

        const doSwitch = async () => {
            if (!ontologyData?.ontologyName) {
                setMode(nextMode);
                return;
            }
            try {
                isSwitchingModeRef.current = true;
                setSessionLoading(true);

                // 1) 停止所有 sessionType=0 且进行中的会话（并发容错）
                await Promise.all(
                    runningType0Tabs.map((t: any) => {
                        const st = tabTaskStatus[t.key];
                        return stopChat({
                            promptType:mode=='0'?0:1,
                            ontologyName: ontologyData.ontologyName,
                            taskId: st.taskId
                        }).catch(() => null);
                    })
                );

                // 2) 一次性清空 tabs（不逐个 delete，避免触发兜底自动建 tab）
                tabViewRef.current = {};
                tabsRef.current?.setTabs?.([]);
                tabsRef.current?.setActive?.(null);
                setTabs([]);
                setActiveTab('');
                setTabTaskStatus({});

                // 3) 切换 mode
                setMode(nextMode);
            } finally {
                isSwitchingModeRef.current = false;
                setSessionLoading(false);
            }
        };

        if (runningType0Tabs.length > 0) {
            Modal.confirm({
                title: '提示',
                content: '模式切换将导致进行中的会话停止运行，是否确认切换？',
                onOk: doSwitch
            });
            return;
        }
        doSwitch();
    };

    // 创建新会话tab
    const createChatTab = (options?: {
        testCases?: TestCase[];
        sessionId?: string;
        sessionType?: 0 | 1;
        title?: string;
        // 允许外部强制指定 tab 初始化使用的 promptId（用于模式切换等场景，避免读到旧 mode）
        initialPromptId?: string;
    }) => {
        const { testCases, sessionId, sessionType = 0, title, initialPromptId } = options || {};
        // 创建 tab 时快照当前配置默认 promptId（已打开 tab 不跟随配置变更）
        // 注意：切换模式时 setMode 不是同步的，因此允许外部强制传入 initialPromptId
        const promptIdSnapshot = initialPromptId || (mode == '0' ? modeSettingData.defaultPrompt : modeSettingData.oagPrompt);

        // 页面保持只有一个“空新会话”tab：再次点击新建会话时复用该tab
        // 只要用户发送过消息（无论标题是否变更），就不算“空新会话”，应创建新的tab
        const isCreateNewSessionTab = !testCases || testCases.length === 0;
        const normalizedSessionId = isCreateNewSessionTab ? (sessionId || 'new') : sessionId;
        if (isCreateNewSessionTab && normalizedSessionId === 'new') {
            const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
            const existedNewTab = openedTabs.find((t: any) => t.sessionId === 'new');
            // 只有当 tab 仍是“空新会话”时，才复用并激活
            if (existedNewTab?.key && existedNewTab.isNewSessionPristine !== false) {
                tabsRef.current?.setActive(existedNewTab.key);
                setActiveTab(existedNewTab.key);
                return existedNewTab.key;
            }
        }

        const tabKey = `chat-${Date.now()}`;
        
        // 确定tab标题
        let tabTitle = title || '新会话';
        if (testCases && testCases.length > 0) {
            tabTitle = testCases.length === 1 
                ? testCases[0].question 
                : `批量测试(${testCases.length})`;
        }

        const chatPanelView = (
            <ChatPanel
                key={tabKey}
                initialSessionId={normalizedSessionId}
                sessionType={sessionType}
                testCases={testCases}
                ontology={ontologyData}
                siderOntologyData={siderOntologyData}
                initialPromptId={promptIdSnapshot}
                mode={mode}
                initialTitle={tabTitle}
                promptListData={promptListData}
                oagPromptListData={oagPromptListData}
                modeSettingData={modeSettingData}
                onUserSend={(text) => {
                    if (normalizedSessionId === 'new') {
                        // 第一次发送消息：标记不再是“空新会话”，并立即更新tab标题
                        const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
                        const currentTab = openedTabs.find((t: any) => t.key === tabKey);
                        if (currentTab?.isNewSessionPristine !== false) {
                            updateTabTitle(tabKey, text||'新会话');
                        }
                        markTabDirty(tabKey);
                    }
                }}
                onRunCase={(testCases) => {
                    // 创建新tab运行用例
                    createChatTab({ testCases });
                }}
                onSessionUpdate={(sessionId, summary) => {
                    // 更新tab标题
                    updateTabTitle(tabKey, summary.name);
                    // 绑定会话ID到tab，便于从历史列表激活已打开tab
                    updateTabSessionId(tabKey, sessionId);
                    // 更新会话历史列表
                    getSessionList(true);
                }}
                onTaskStatusChange={(status) => {
                    // 更新tab任务状态
                    setTabTaskStatus(prev => ({
                        ...prev,
                        [tabKey]: {
                            loading: status.loading,
                            taskId: status.taskId,
                            batchNum: status.batchNum,
                            sessionType: sessionType
                        }
                    }));
                }}
                onCreateTestCaseReportTab={(batchNum, total) => {
                    // 创建测试报告tab
                    createTestCaseReportTab(batchNum, total);
                }}
                onTestCaseSaved={() => setCaseManagerListRefreshKey(k => k + 1)}
                onRegisterReRunRefresh={(batchNum, callback) => {
                    if (callback) reRunRefreshCallbacksRef.current[batchNum] = callback;
                    else delete reRunRefreshCallbacksRef.current[batchNum];
                }}
            />
        );

        tabViewRef.current[tabKey] = chatPanelView;

        tabsRef.current?.addTab({
            key: tabKey,
            title: tabTitle,
            sessionId: normalizedSessionId,
            sessionType: sessionType,
            isNewSessionPristine: normalizedSessionId === 'new' && isCreateNewSessionTab,
           // view: chatPanelView,
        });

        setActiveTab(tabKey);
        return tabKey;
    };

    // 从历史会话创建tab
    const createChatTabFromHistory = (sessionSummary: any) => {
        const session = testHistoryList.find(s => s.id === sessionSummary.id);
        if (session) {
            createChatTab({
                sessionId: session.id,
                sessionType: session.type,
                title: sessionSummary.name
            });
        }
    };

    // 创建「用例管理」tab（页面组件）
    const createCaseManagerTab = () => {
        const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
        const existed = openedTabs.find((t: any) => t.tabType === 'case-manager');
        if (existed?.key) {
            tabsRef.current?.setActive?.(existed.key);
            setActiveTab(existed.key);
            return existed.key;
        }

        const tabKey = `case-manager-${Date.now()}`;
        const view = (
            <CaseManagerPage
                mode={mode}
                modeSettingData={modeSettingData}
                promptListData={promptListData}
                oagPromptListData={oagPromptListData}
                key={tabKey}
                ontology={ontologyData}
                onRunCase={(cases) => createChatTab({ testCases: cases, sessionType: 1 })}
                onTestCaseListChange={getTestCaseData}
            />
        );
        tabViewRef.current[tabKey] = view;
        tabsRef.current?.addTab({
            key: tabKey,
            title: '用例管理',
            tabType: 'case-manager'
        });
        // 同步 tabs 列表用于渲染
        setTimeout(() => {
            setTabs(tabsRef.current?.state?.tabs || []);
            setActiveTab(tabKey);
        }, 0);
        return tabKey;
    };

    // 创建「测试报告」tab（页面组件）
    const createTestCaseReportTab = (batchNum: string, total?: number) => {
        const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
        // 检查是否已存在相同 batchNum 的测试报告 tab
        const existed = openedTabs.find((t: any) => t.tabType === 'test-case-report' && t.batchNum === batchNum);
        if (existed?.key) {
            tabsRef.current?.setActive?.(existed.key);
            setActiveTab(existed.key);
            return existed.key;
        }

        const tabKey = `test-case-report-${Date.now()}`;
        const view = (
            <TestCaseReportPage
                key={tabKey}
                batchNum={batchNum}
                total={total}
                ontology={ontologyData}
                siderOntologyData={siderOntologyData}
                onRunCase={(cases) => createChatTab({ testCases: cases, sessionType: 1 })}
                afterReRunTestCase={() => {
                   
                    const cb = reRunRefreshCallbacksRef.current[batchNum];
                    if (cb) cb();
                }}
            />
        );
        tabViewRef.current[tabKey] = view;
        tabsRef.current?.addTab({
            key: tabKey,
            title: 'CQ测试用例批量执行报告',
            tabType: 'test-case-report',
            batchNum: batchNum
        });
        // 同步 tabs 列表用于渲染
        setTimeout(() => {
            setTabs(tabsRef.current?.state?.tabs || []);
            setActiveTab(tabKey);
        }, 0);
        return tabKey;
    };

    // 更新tab标题
    const updateTabTitle = (tabKey: string, title: string) => {
        tabsRef.current?.updateTabLabel(tabKey, title);
        // 同步更新tabs状态
        setTimeout(() => {
            setTabs(tabsRef.current?.state.tabs || []);
        }, 100);
    };

    const updateTabSessionId = (tabKey: string, sessionId: string) => {
        if (!tabsRef.current?.state?.tabs) return;
        tabsRef.current.setTabs(
            tabsRef.current.state.tabs.map((tab: any) => {
                if (tab.key === tabKey) {
                    return { ...tab, sessionId };
                }
                return tab;
            })
        );
        // 同步更新tabs状态
        setTimeout(() => {
            setTabs(tabsRef.current?.state.tabs || []);
        }, 100);
    };

    const markTabDirty = (tabKey: string) => {
        if (!tabsRef.current?.state?.tabs) return;
        tabsRef.current.setTabs(
            tabsRef.current.state.tabs.map((tab: any) => {
                if (tab.key === tabKey) {
                    return { ...tab, isNewSessionPristine: false };
                }
                return tab;
            })
        );
        setTimeout(() => {
            setTabs(tabsRef.current?.state.tabs || []);
        }, 100);
    };

    // 处理删除 tab（带任务检查）
    const handleDeleteTab = (tabKey: string) => {
        const tab = tabsRef.current?.state?.tabs?.find((t: any) => t.key === tabKey);
        if (!tab) return;

        const taskStatus = tabTaskStatus[tabKey];
        const sessionType = tab.sessionType;

        // 仅判断：是否是正在执行的 sessionType=0 会话 tab
        const isRunningSessionType0 = sessionType === 0 && !!taskStatus?.loading;

        const cleanupAndSync = () => {
            // 清理任务状态
            setTabTaskStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[tabKey];
                return newStatus;
            });
            // 延迟更新状态
            setTimeout(() => {
                const updatedTabs = tabsRef.current?.state?.tabs || [];
                setTabs(updatedTabs);
                if (tabsRef.current?.state?.activeTab) {
                    setActiveTab(tabsRef.current.state.activeTab);
                } else {
                    setActiveTab('');
                }
                // 如果 tab 都关闭完了，自动新建一个默认会话 tab
                if (
                    updatedTabs.length === 0 &&
                    ontologyData?.ontologyName &&
                    (mode == '0' ? modeSettingData.defaultPrompt : modeSettingData.oagPrompt) &&
                    !isSwitchingModeRef.current
                ) {
                    const newKey = createChatTab();
                    setTimeout(() => {
                        setTabs(tabsRef.current?.state?.tabs || []);
                        setActiveTab(newKey);
                    }, 0);
                }
            }, 0);
        };

        const doClose = () => {
            tabsRef.current?.deleteTab(tabKey);
            cleanupAndSync();
        };

        if (isRunningSessionType0 && taskStatus?.taskId) {
            Modal.confirm({
                title: '提示',
                content: '当前会话正在进行中，是否确认关闭？',
                onOk: async () => {
                    try {
                        await stopChat({
                            promptType:mode=='0'?0:1,
                            ontologyName: ontologyData.ontologyName,
                            taskId: taskStatus.taskId
                        }).then(res => {
                            if (res.data.status === 'success') {
                                ArcoMessage.info('已成功发起停止会话请求');
                                // 停止请求发起成功后刷新一次历史列表
                                getSessionList(true);
                            } else {
                                ArcoMessage.error('停止指令发送失败');
                            }
                        }).catch(() => {
                            ArcoMessage.error('停止指令发送失败');
                        });
                    } finally {
                        doClose();
                    }
                }
            });
            return;
        }

        // 非进行中的 tab：直接关闭
        doClose();
    };

    // ================= 全局数据管理函数（保留） =================
    const getOntologyInfo = () => {
        return new Promise((resolve) => {
            getOntologyData(id).then(async (res) => {
                if (res.data.success) {
                    setOntologyData(res.data.data);
                    await getOverviewData();
                    resolve(true);
                }else{
                    ArcoMessage.error('获取本体信息失败');
                    resolve(false);
                }
            }).catch(err => {
                ArcoMessage.error('获取本体信息失败');
                resolve(false);
            })
        });
    }

    // 提示词详情改由 ChatPanel 内部根据 promptId 拉取

    // ================= 业务逻辑 =================

     
    // 删除会话（从历史列表中删除，并关闭对应的 chat tab、报告 tab）
    const handleDeleteSession = (sessionId: string) => {
        const session = testHistoryList.find((s: any) => s.id === sessionId);
        if (!session) return;

        const batchNum = session.batchNum || session.id;

        deleteTask({
            ontologyName: ontologyData.ontologyName,
            batchNumList: [batchNum],
            promptType:mode=='0'?0:1,
        }).then(res => {
            if (res.data.success) {
                ArcoMessage.success('删除成功');
                // 关闭与该会话对应的 chat tab、报告 tab
                const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
                const toRemoveKeys = openedTabs
                    .filter((t: any) => t.sessionId === sessionId || t.batchNum === batchNum)
                    .map((t: any) => t.key);
                if (toRemoveKeys.length > 0) {
                    const filtered = openedTabs.filter((t: any) => !toRemoveKeys.includes(t.key));
                    toRemoveKeys.forEach((key: string) => delete tabViewRef.current[key]);
                    tabsRef.current?.setTabs?.(filtered);
                    const nextActive = toRemoveKeys.includes(activeTab) ? (filtered[0]?.key || '') : activeTab;
                    tabsRef.current?.setActive?.(filtered.length > 0 ? nextActive : null);
                    setTabs(filtered);
                    setActiveTab(nextActive);
                    setTabTaskStatus(prev => {
                        const next = { ...prev };
                        toRemoveKeys.forEach((k: string) => delete next[k]);
                        return next;
                    });
                    if (filtered.length === 0 && ontologyData?.ontologyName && (mode == '0' ? modeSettingData.defaultPrompt : modeSettingData.oagPrompt)) {
                        const newKey = createChatTab();
                        setTimeout(() => {
                            setTabs(tabsRef.current?.state?.tabs || []);
                            setActiveTab(newKey);
                        }, 0);
                    }
                }
                getSessionList(true);
            } else {
                ArcoMessage.error('删除失败');
            }
        }).catch(e => {
            console.log(e);
            ArcoMessage.error('删除失败');
        });
    };

    // 清空所有会话：清空历史列表，并关闭所有 chat tab、报告 tab，保留用例管理 tab 可选
    const handleClearSession = async () => {
        try {
            setSessionLoading(true);
            const batchNumList = testHistoryList.map((s: any) => s.batchNum || s.id).filter(Boolean);

            if (batchNumList.length === 0) {
                setSessionLoading(false);
                return;
            }

            deleteTask({
                ontologyName: ontologyData.ontologyName,
                batchNumList,
                promptType:mode=='0'?0:1,
            }).then(res => {
                if (res.data.success) {
                    ArcoMessage.success('已清空');
                    // 关闭所有 chat tab、报告 tab（与模式切换一致）
                    tabViewRef.current = {};
                    tabsRef.current?.setTabs?.([]);
                    tabsRef.current?.setActive?.(null);
                    setTabs([]);
                    setActiveTab('');
                    setTabTaskStatus({});
                    // 新建一个默认会话 tab
                    setTimeout(() => {
                        const newKey = createChatTab();
                        if (newKey) {
                            setTabs(tabsRef.current?.state?.tabs || []);
                            setActiveTab(newKey);
                        }
                    }, 0);
                    getSessionList(true);
                } else {
                    ArcoMessage.error('清空失败');
                }
            }).catch(e => {
                console.log(e);
                ArcoMessage.error('清空失败');
            }).finally(() => {
                setSessionLoading(false);
            });
        } catch (error) {
            setSessionLoading(false);
        }
    };

    // 启动测试用例会话（创建新tab）
    const handleStartTestCaseSession = (testCases: TestCase[]) => {
        // 直接创建新tab运行用例
        createChatTab({ testCases, sessionType: 1 });
    };
  
    // 切换会话（改为创建新tab打开历史会话）
    const handleSwitchSession = (sessionId: string) => {
        const targetSession = testHistoryList.find((s: any) => s.id === sessionId);
        if (targetSession) {
            const openedTabs: any[] = tabsRef.current?.state?.tabs || tabs || [];
            const existedTab = openedTabs.find((t: any) => t.sessionId === sessionId);
            if (existedTab?.key) {
                tabsRef.current?.setActive(existedTab.key);
                setActiveTab(existedTab.key);
                return;
            }
            createChatTabFromHistory(targetSession.summary);
        }
    };  
     
    //
    const getSessionList = (isUpdate?:boolean)=>{
        !isUpdate && setSessionLoading(true);
        return getAllTaskSession({
            promptType:mode=='0'?0:1,
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
                        messages:[]
                    }
                });
              //  setSessions(sessionData);
                setTestHistoryList(sessionData);

            }else{
                setSessionLoading(false);
            }
        }).catch(err=>{
            setSessionLoading(false);
        }).finally(()=>{
            setSessionLoading(false);
        })
    };
      

    const getOverviewData = () =>
        getOntologyOverview({ ontologyId: id }).then((res) => {
            if (res.data.success) {
                const data = res.data.data;
                data.linkTypes = data.linkTypes.filter((item: any) => item.column) || [];
                data.title = data.ontologyLabel;
                data.type = 'ontology';
                setSiderOntologyData(data);
            } else {
                ArcoMessage.error('获取本体概览信息失败');
            }
        });
    const getTestCaseData = () =>
        getTestCaseList({
            ontologyId: id,
            promptType: mode == '0' ? 0 : 1,
            page: 1,
            limit: 9999,
        }).then((res) => {
            if (res.data.success) {
                const data = res.data?.data?.content || [];
                data.forEach((item: any) => {
                    item.lastTime = item.task?.lastExecTime || '';
                    item.lastResult = item.task?.lastExecTesult || 'Untested';
                });
                setTestCases(res.data.data.content);
            }
        });

    const getModeSetting = () => {
        return new Promise((resolve) => {
        getOntologyModeSettingData({ ontologyId: id }).then((res) => {
            if (res.data.success) {
                const data = res.data.data;
                data.defaultPrompt = data.normalPrompt.id;
                data.oagPrompt = data.oagPrompt.id;
                data.defaultMode = data.promptType == 0 ? '0' : '1';
                setModeSettingData(data);
                setMode(data.defaultMode);
                resolve(true);
            }else{  
                ArcoMessage.error('获取测试配置失败');
                resolve(false);
            }
        }).catch(err => {
            resolve(false);
        })
    });
    }; 
    const handleModeSettingOk = async () => {
        const values = await modeSettingFormRef.current?.validate();
        if(values){
            setModeSettingVisible(false);
            saveModeSetting(values).then(res=>{
                if(res){
                    setModeSettingData(values);
                }
            })
        }
    }
    const saveModeSetting = (values:any) => {
        return new Promise((resolve)=>{
            saveOntologyModeSetting({
                ontologyId:id,
                promptType:values.defaultMode=='0'?0:1,
                normalPromptId:values.defaultPrompt,
                oagPromptId:values.oagPrompt
            }).then(res=>{
                if(res.data.success){
                    ArcoMessage.success('保存成功');
                    resolve(true);
                }else{
                    ArcoMessage.error('保存失败');
                    resolve(false);
                }
            }).catch(err=>{
                ArcoMessage.error('保存失败');
                resolve(false);
            })
        })
    }
    return (
        <div  className='test-chat-tabs'>
        <ModoTabs
            title='本体测试' 
            icon={<IconUnitDevColor/>}
            ref={modoTabsRef}>
                <div className='right-mode-btns'>
                <RadioGroup
                    className='mode-radio-group-container'
                    options={modeOptions}
                    size='large'
                    type='button'
                    value={mode}
                    onChange={(value: string) => handleModeChange(value)} 
                />   
                <Button
                    type='outline'
                    icon={<IconSetting />}
                    className='mode-setting-btn'
                    onClick={()=>{
                        setModeSettingVisible(true);
                        setTimeout(()=>{
                            modeSettingFormRef.current?.setFieldsValue?.(modeSettingData);
                        },100);
                    }}
                >
                    配置
                </Button>

                </div>
                
        <Spin className="test-chat-spin" loading={sessionLoading}>
            <Layout className="app-layout">
                {/* 左侧 */}
                <TestManagementSider
                  ontologyData={ontologyData}
                  collapsed={leftCollapsed}
                  onCollapse={setLeftCollapsed}
                  width={leftWidth}
                  testCases={testCases}
                  sessions={testHistoryList.map((s: any) => s.summary)}
                  activeSessionId={''} // 不再需要全局activeSessionId
                  onSelectTestCase={handleStartTestCaseSession}
                  onSelectSession={handleSwitchSession}
                  onDeleteSession={handleDeleteSession}
                  onClearSessions={handleClearSession}
                  onManage={() => createCaseManagerTab()} // 用例管理改为 tab
             //     onBatch={() => setBatchVisible(true)} // TODO: 改为创建批量测试tab
                />
                        <div className="tabs-container">
                            <div className="tabs-header">
                                <ModoTabs
                                    ref={tabsRef}
                                    beforeDeteleTab={(tabKey: string, done: () => void) => {
                                        const tab = tabsRef.current?.state?.tabs?.find((t: any) => t.key === tabKey);
                                        const taskStatus = tabTaskStatus[tabKey];
                                        const sessionType = tab?.sessionType;
                                        const isRunningSessionType0 = sessionType === 0 && !!taskStatus?.loading;

                                        const cleanupAndSync = () => {
                                            setTabTaskStatus(prev => {
                                                const next = { ...prev };
                                                delete next[tabKey];
                                                return next;
                                            });
                                            setTimeout(() => {
                                                const updatedTabs = tabsRef.current?.state?.tabs || [];
                                                const nextActive = tabsRef.current?.state?.activeTab || '';
                                                setTabs(updatedTabs);
                                                setActiveTab(nextActive);

                                                // 如果 tab 都关闭完了，自动新建一个默认会话 tab
                                                if (
                                                    updatedTabs.length === 0 &&
                                                    ontologyData?.ontologyName &&
                                                    (mode == '0' ? modeSettingData.defaultPrompt : modeSettingData.oagPrompt) &&
                                                    !isSwitchingModeRef.current
                                                ) {
                                                    const newKey = createChatTab();
                                                    setTimeout(() => {
                                                        setTabs(tabsRef.current?.state?.tabs || []);
                                                        setActiveTab(newKey);
                                                    }, 0);
                                                }
                                            }, 0);
                                        };

                                        const doClose = () => {
                                            done();
                                            cleanupAndSync();
                                        };

                                        // 仅对 sessionType=0 且进行中且有 taskId 的情况弹确认
                                        if (isRunningSessionType0 && taskStatus?.taskId) {
                                            Modal.confirm({
                                                title: '提示',
                                                content: '当前会话正在进行中，是否确认关闭？',
                                                onOk: async () => {
                                                    try {
                                                        await stopChat({
                                                            promptType: mode == '0' ? 0 : 1,
                                                            ontologyName: ontologyData.ontologyName,
                                                            taskId: taskStatus.taskId
                                                        }).then(res => {
                                                            if (res.data.status === 'success') {
                                                                ArcoMessage.info('已成功发起停止会话请求');
                                                                // 停止请求发起成功后刷新一次历史列表
                                                                getSessionList(true);
                                                            } else {
                                                                ArcoMessage.error('停止指令发送失败');
                                                            }
                                                        }).catch(() => {
                                                            ArcoMessage.error('停止指令发送失败');
                                                        });
                                                    } finally {
                                                        doClose();
                                                    }
                                                }
                                            });
                                            return;
                                        }

                                        doClose();
                                    }}
                                    onChange={tab => {
                                        setActiveTab(tab);
                                        setTabs(tabsRef.current.state.tabs);
                                    }}
                                />
                                <div className="tab-btns">
                                    <Tooltip content="新建会话">
                                        <Button type='outline' icon={<img src={chatIcon} alt='chat' />} onClick={() => createChatTab()} />
                                    </Tooltip>
                                    <Dropdown
                                        popupVisible={tabSearchDropdownVisible}
                                        onVisibleChange={(visible) => {
                                            setTabSearchDropdownVisible(visible);
                                            if (visible) setTabSearchValue('');
                                        }}
                                        droplist={
                                            <div className="tab-search-dropdown">
                                                <Input
                                                    placeholder="搜索标签页"
                                                    prefix={<IconSearchColor />}
                                                    value={tabSearchValue}
                                                    onChange={(value) => setTabSearchValue(value)}
                                                    allowClear
                                                    onPressEnter={(e) => {
                                                        e.preventDefault();
                                                        const filteredTabs = tabs.filter(tab =>
                                                            tab.title?.toLowerCase().includes(tabSearchValue.toLowerCase())
                                                        );
                                                        if (filteredTabs.length > 0) {
                                                            const firstTab = filteredTabs[0];
                                                            tabsRef.current?.setActive(firstTab.key);
                                                            setActiveTab(firstTab.key);
                                                            setTabs(tabsRef.current?.state?.tabs || []);
                                                            setTabSearchDropdownVisible(false);
                                                        }
                                                    }}
                                                />
                                                <div className="tab-search-dropdown-title">
                                                    打开的标签页
                                                </div>
                                                <div className="tab-search-dropdown-content">
                                                    {(() => {
                                                        const filteredTabs = tabs.filter(tab =>
                                                            tab.title?.toLowerCase().includes(tabSearchValue.toLowerCase())
                                                        );
                                                        if (filteredTabs.length === 0) {
                                                            return (
                                                                <div style={{
                                                                    padding: '20px',
                                                                    textAlign: 'center',
                                                                    color: 'var(--color-text-3)'
                                                                }}>
                                                                    暂无匹配的标签页
                                                                </div>
                                                            );
                                                        }
                                                        return filteredTabs.map(tab => (
                                                            <div
                                                                key={tab.key}
                                                                onClick={() => {
                                                                    tabsRef.current?.setActive(tab.key);
                                                                    setActiveTab(tab.key);
                                                                    setTabs(tabsRef.current?.state?.tabs || []);
                                                                    setTabSearchDropdownVisible(false);
                                                                }}
                                                                className="tab-search-dropdown-item"
                                                                style={{
                                                                    backgroundColor: activeTab === tab.key ? 'var(--color-primary-light-1)' : 'transparent',
                                                                    color: activeTab === tab.key ? 'var(--color-primary-6)' : 'var(--color-text-1)',
                                                                }}
                                                            >
                                                                <span style={{
                                                                    flex: 1,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {tab.title || '未命名标签页'}
                                                                </span>
                                                                <span
                                                                    className="tab-search-dropdown-item-delete"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteTab(tab.key);
                                                                    }}
                                                                >
                                                                    <IconClose />
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        }
                                        position="bl"
                                        trigger="click"
                                    >
                                        <Button type='outline' icon={<IconArrowDown />} />
                                    </Dropdown>
                                </div>
                            </div>

                            <div className="tabs-content">
                                {tabs.map(tab => {
                                    return (
                                        <div
                                            key={tab.key}
                                            className="tab-content"
                                            style={{
                                                visibility: activeTab === tab.key ? 'visible' : 'hidden',
                                                zIndex: activeTab === tab.key ? 1 : -1
                                            }}
                                        >
                                            {tab.tabType === 'case-manager'
                                                ? (
                                                    <CaseManagerPage
                                                        key={tab.key}
                                                        mode={mode ?? '0'}
                                                        modeSettingData={modeSettingData}
                                                        promptListData={promptListData ?? []}
                                                        oagPromptListData={oagPromptListData ?? []}
                                                        ontology={ontologyData}
                                                        listRefreshKey={caseManagerListRefreshKey}
                                                        onRunCase={(cases) => createChatTab({ testCases: cases, sessionType: 1 })}
                                                        onTestCaseListChange={getTestCaseData}
                                                    />
                                                )
                                                : tabViewRef.current[tab.key]
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Layout>
                </Spin>
    
    
        </ModoTabs>
        {/* ★★★ 测试配置弹窗 ★★★ */}
        <Modal
        title={
          <div style={{ textAlign: 'left', fontWeight: 700 }}>
            <span style={{ fontSize: '16px' }}>测试配置</span>
          </div>}
         visible={modeSettingVisible}
         onCancel={() => setModeSettingVisible(false)}
         onOk={handleModeSettingOk}
         style={{ width: 550 }}
        unmountOnExit={false}
      >
        <Form
          layout="vertical"
          ref={modeSettingFormRef}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 19 }}
        > 
          <FormItem 
            label="默认测试模式" 
            field="defaultMode"
            rules={[{ required: true, message: '请选择' }]}
          >
            <Select
              placeholder="请选择"
              options={modeOptions} 
            />
          </FormItem>
          <FormItem 
            label="通用模式提示词" 
            field="defaultPrompt"
            rules={[{ required: true, message: '请选择通用模式提示词' }]}
          >
            <Select
              placeholder="请选择"
              showSearch
              filterOption={(inputValue: string, option: any) =>
                (option?.props?.extra?.label ?? '')
                  .toLowerCase()
                  .indexOf(inputValue.toLowerCase()) >= 0
              }
            >
              {promptListData.map((item: any) => (
                <Select.Option key={item.value} value={item.value} extra={{ label: item.label }}>
                  <span>
                    {item.label}
                    {item.defaultType === 1 && (
                      <span style={{ marginLeft: 6 }}>
                        <Tag bordered color="arcoblue" size="small">提示词模板</Tag>
                      </span>
                    )}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
          <FormItem 
            label="OAG模式提示词" 
            field="oagPrompt"
            rules={[{ required: true, message: '请选择OAG模式提示词' }]}
          >
            <Select
              placeholder="请选择"
              showSearch
              filterOption={(inputValue: string, option: any) =>
                (option?.props?.extra?.label ?? '')
                  .toLowerCase()
                  .indexOf(inputValue.toLowerCase()) >= 0
              }
            >
              {oagPromptListData.map((item: any) => (
                <Select.Option key={item.value} value={item.value} extra={{ label: item.label }}>
                  <span>
                    {item.label}
                    {item.defaultType === 1 && (
                      <span style={{ marginLeft: 6 }}>
                        <Tag  bordered color="arcoblue" size="small">提示词模板</Tag>
                      </span>
                    )}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      </Modal>
    </div>
    
    );
};

export default App;
