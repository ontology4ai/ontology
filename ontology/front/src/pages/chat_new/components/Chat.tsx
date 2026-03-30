import React, { useState } from 'react';
import {
    Layout, Input, Button, Avatar, Spin, Tooltip, Empty, Tag, Typography,
    Divider, Modal, Space, Card,Dropdown,Menu,Message as ArcoMessage
} from '@arco-design/web-react';
import {
    IconSend, IconRobot, IconUser, IconLeft, IconPlus, IconStop, IconCopy, IconEdit, IconApps, IconCheck,IconDown
} from '@arco-design/web-react/icon';
import chatIcon from '@/pages/chat_new/images/newChat.svg';
import disChatIcon from '@/pages/chat_new/images/newChatDisabled.svg';
import settingIcon from '@/pages/chat_new/images/setting.svg';
import sendIcon from '@/pages/chat_new/images/send.svg';
import defaultSendIcon from '@/pages/chat_new/images/defaultSend.svg';
import stopIcon from '@/pages/chat_new/images/stop.svg';
import userIcon from '@/pages/chat_new/images/user.svg';
import aiIcon from '@/pages/chat_new/images/ai.svg';
import graphBranchIcon from '@/pages/chat_new/images/branchGraph.svg';

import MarkdownRender from './MarkdownRender';
import AIMessage from './AIMessage';
import { Message, ChatSession, GraphData, TestCase } from '../types';
import {IconBookmark,IconSendColor,IconEnlarge,IconReduce,IconRefresh} from "modo-design/icon";
import copy from 'copy-to-clipboard';
import PromptSetting from './prompt-setting';

const { Content } = Layout;
const { TextArea } = Input;
const { Text } = Typography;

interface ChatProps {
    activeSessionId?: string;
    activeGraphMessageId?: string;
    messages: Message[];
    sessions:ChatSession[];
    graphData: GraphData | null;
    loading: boolean;
    inputValue: string;
    rightCollapsed: boolean;
    siderOntologyData?: any;
    onInputChange: (val: string) => void;
    onSend: (text?: string) => void;
    onStop: () => void;
    onRegenerate: (index: number) => void;
    onRenderGraph: (index: string) => void;
    onCopy: (content: string) => void;
    onEdit: (content: string) => void;
    onExpandRight: () => void;
    onCreateEmptySession: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    ontology:any;
    onChangePrompt:(val:string)=>void;
    sysPrompt?:string,
    onRunCase:(testCase: TestCase[]) => void;  
    afterReRunTestCase?:()=>void;
}

// 模拟初始提示词数据 (仅一个)
// const INITIAL_PROMPT = {
//     id: '1',
//     title: '客户风险控制系统指令',
//     desc: '用于指导 AI 根据输入的工单信息进行风险等级评估与建议的核心系统提示词。',
//     content: `你是一个专业的金融风控专家系统。你的任务是分析用户输入的工单内容，并根据以下规则进行评估：

// 1. 提取工单中的关键实体（如客户ID、交易金额、涉及地区）。
// 2. 判断风险等级（High/Medium/Low）。
// 3. 如果风险等级为 High，必须给出具体的冻结建议。
// 1. 提取工单中的关键实体（如客户ID、交易金额、涉及地区）。
// 2. 判断风险等级（High/Medium/Low）。
// 3. 如果风险等级为 High，必须给出具体的冻结建议。
// 1. 提取工单中的关键实体（如客户ID、交易金额、涉及地区）。
// 2. 判断风险等级（High/Medium/Low）。
// 3. 如果风险等级为 High，必须给出具体的冻结建议。

// 请以 JSON 格式输出分析结果。`
// };

// --- 内部组件：提示词卡片 (包含查看/编辑逻辑) ---
const PromptCard = ({ prompt, onUpdate, onCopy }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // 编辑态的临时数据
    const [formData, setFormData] = useState({ ...prompt });

    // 复制逻辑
    const handleCopy = (e) => {
        if (copy(prompt.content)) {
            ArcoMessage.success('已复制到剪贴板');
        } else {
            ArcoMessage.error('复制失败，请手动复制');
        }
        //handleCopyText(prompt.content,e);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    


    // 保存逻辑
    const handleSave = () => {
        onUpdate({ ...formData });
        setIsEditing(false);
    };

    // 取消逻辑
    const handleCancel = () => {
        setFormData({ ...prompt }); // 回滚数据
        setIsEditing(false);
    };

    // --- 编辑模式 ---
    if (isEditing) {
        return (
          <Card bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {/* 标题和描述输入框 */}
                  {/*<Input
                    value={formData.title}
                    onChange={v => setFormData({ ...formData, title: v })}
                    placeholder="请输入提示词标题"
                    style={{ fontWeight: 500 }}
                  />
                  <Input
                    value={formData.desc}
                    onChange={v => setFormData({ ...formData, desc: v })}
                    placeholder="请输入提示词描述"
                  />*/}

                  {/* 内容大文本域 */}
                  <TextArea
                    value={formData.content}
                    onChange={v => setFormData({ ...formData, content: v })}
                    placeholder="请输入提示词内容..."
                    autoSize={{ minRows: 8 }}
                    className='text-area-item'
                    style={{ fontSize: 13, lineHeight: 1.5, background: '#f7f8fa',height:'480px'}}
                  />

                  {/* 底部按钮区 */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <Button onClick={handleCancel}>取消</Button>
                      <Button type="primary" onClick={handleSave}>保存修改</Button>
                  </div>
              </Space>
          </Card>
        );
    }

    // --- 查看模式 ---
    return (
      <Card bordered={false}>
          {/* 顶部 Header：左侧标题描述，右侧按钮 */}
          <div style={{ display: 'flex', justifyContent: 'end', marginBottom: 6 }}>
              {/*<div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginRight: 16 }}>
                  <Text bold style={{ fontSize: 16, color: '#1d2129' }}>{prompt.title}</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>{prompt.desc}</Text>
              </div>*/}

              <Space align="end" className='prompt-top-btns'>
                  <Tooltip content={isCopied ? "已复制" : "复制提示词"}>
                      <Button
                        shape="circle"
                        status={isCopied ? 'success' : 'default'}
                        icon={isCopied ? <IconCheck /> : <IconCopy />}
                        onClick={handleCopy}
                      />
                  </Tooltip>
                  <Tooltip content="编辑提示词">
                      <Button
                        shape="circle"
                        icon={<IconEdit />}
                        onClick={() => setIsEditing(true)}
                      />
                  </Tooltip>
              </Space>
          </div>

          {/* 底部 Content：完整内容展示 */}
          <div style={{
              background: '#f7f8fa',
              padding: '16px',
              borderRadius: 4,
              fontSize: 13,
              lineHeight: 1.6,
              color: '#333',
              whiteSpace: 'pre-wrap',
              border: '1px solid #e5e6eb',
              height:'480px',
              overflow:'auto'
          }}>
              {prompt.content}
          </div>
      </Card>
    );
};

const Chat: React.FC<ChatProps> = ({
                                       activeSessionId,
                                       activeGraphMessageId,
                                       messages,
                                       sessions,
                                       graphData,
                                       loading,
                                       inputValue,
                                       rightCollapsed,
                                       onInputChange,
                                       onSend,
                                       onStop,
                                       onRegenerate,
                                       onRenderGraph,
                                       onCopy,
                                       onEdit,
                                       onExpandRight,
                                       onCreateEmptySession,
                                       messagesEndRef,
                                       ontology,
                                       sysPrompt,
                                       onRunCase,
                                       onChangePrompt,
                                       siderOntologyData,
                                       afterReRunTestCase
                                   }) => {

    const currentSession = sessions.find(session=>session.id==activeSessionId);
    let testCaseFinished= false;
    if(currentSession?.type==1 && messages[1]){
        if( messages[1].role=='ai'){
            testCaseFinished =  messages[1].status == 'completed';
        }
    }
    // 提示词弹窗状态
    const [promptModalVisible, setPromptModalVisible] = useState(false);

    // 提示词数据状态 (仅管理一条)
   // const [promptData, setPromptData] = useState({content:sysPrompt});

    const handleUpdatePrompt = (newData: any) => {
        // setPromptData(newData);
        // 这里可以添加保存到后端的逻辑
        onChangePrompt(newData);
        setPromptModalVisible(false);
    };
    const dropList = (
      <Menu>
          <Menu.Item key='1'>Beijing</Menu.Item>
          <Menu.Item key='2'>Shanghai</Menu.Item>
          <Menu.Item key='3'>Guangzhou</Menu.Item>
      </Menu>
    );
    return (
      <Layout className="chat-layout">
          {/* 1. 顶部 Header */}
          <div className="chat-header">
              
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <span className="chat-title">{ontology?.ontologyLabel}</span>
                  {ontology?.versionName?<Tag color="blue" bordered size="small">{ontology.versionName}</Tag>:''}
              </div>
              <div className="chat-btns" style={{ display: 'flex', alignItems: 'center' }}>


                  {/* 新建会话按钮 */}
                  <Tooltip content="新建会话">
                      <Button size="small" type='text' onClick={onCreateEmptySession} disabled={activeSessionId=='new'}>
                          <img src={activeSessionId=='new'?disChatIcon:chatIcon} alt=""/>
                      </Button>
                  </Tooltip>

                  <Divider type="vertical" style={{ height: 16, borderColor: '#e5e6eb', margin: '0 4px' }} />

                  {/* 提示词管理按钮 */}
                  <Tooltip content="提示词管理">
                      <Button
                        size="small"
                        type='text'
                        onClick={() => {setPromptModalVisible(true);}}
                      >
                          <img src={settingIcon} alt=""/>
                      </Button>
                  </Tooltip>

                  {/*{rightCollapsed && graphData && (
                    <>
                        <Divider type="vertical" style={{ height: 16, borderColor: '#e5e6eb', margin: '0 4px' }} />
                        <Button size="small" type="outline" onClick={onExpandRight}>
                            查看数字孪生 <IconLeft />
                        </Button>
                    </>
                  )}*/}
              </div>
          </div>

          {/* 2. 消息内容区域 */}
          <Content className="chat-content">
              {
                messages.map((msg, index) => (
                  <div key={msg.id||index} className={`message-row ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                      <Avatar size={32}>
                          {msg.role === 'ai' ? <img src={aiIcon} /> : <img src={userIcon} />}
                      </Avatar>

                      <div className="message-content-wrapper">
                          {msg.role === 'user' && <div className="message-actions">
                              <Tooltip content="复制">
                                  <span className="action-icon" onClick={() => onCopy(msg.content)}><IconCopy /></span>
                              </Tooltip>
                              <Tooltip content="编辑并重新提问">
                                  <span className="action-icon" onClick={() => onEdit(msg.content)}><IconEdit /></span>
                              </Tooltip>
                          </div>}
                          <div className="message-bubble">
                              {msg.role === 'ai' ?  <AIMessage message={msg} onRunCase={onRunCase} ontology={ontology} siderOntologyData={siderOntologyData} afterReRunTestCase={afterReRunTestCase}/>  : msg.content}
                          </div>

                          {msg.role === 'ai' && !loading && currentSession?.type!=1 && <div className="message-actions">
                              {msg.id && msg.status==='completed' && msg.graphData && (
                                <Tooltip content="图谱">
                                    <span className={`action-icon ${activeGraphMessageId==msg.id?'active-graph':''}`} onClick={() => onRenderGraph(msg.id)}>
                                        <img src={graphBranchIcon} />
                                    </span>
                                </Tooltip>
                              )}
                              {msg.id && (msg.status==='completed' || (msg.status==='error' && !msg.id.startsWith('error-')) ) && (
                                <Tooltip content="重新生成">
                                    <span className="action-icon" onClick={() => onRegenerate(index)}><IconRefresh /></span>
                                </Tooltip>
                              )}
                          </div>}
                      </div>
                  </div>
                ))
              }

              {loading && (
                <div className="loading-tip">
                    <Spin dot />
                </div>
              )}
              <div ref={messagesEndRef} />
          </Content>

          {/* 3. 底部输入框 */}
          {currentSession?.type !=1 && <div className="chat-input-wrapper">
              <TextArea
                className="chat-textarea"
                placeholder="请输入测试问题"
                value={inputValue}
                onChange={onInputChange}
                onPressEnter={(e) => {
                    if (!e.shiftKey) {
                        e.preventDefault();
                        onSend();
                    }
                }}
                autoSize={{
                    minRows: 1,
                    maxRows: 3
                }}
                disabled={loading}
              />
              <div className='input-actions'>
                  {/* <Dropdown droplist={dropList} position='bl'>
                      <Button type='outline' shape='round' className="case-btn">
                          <IconBookmark/> 用例库 <IconDown/>
                      </Button>
                  </Dropdown> */}
                  {loading ? (
                      <Button type="secondary" className="send-btn" icon={<img src={stopIcon}/>}
                              onClick={onStop}/>

                    ) :
                    inputValue.length > 0 ?
                      <Button type="primary" className="send-btn" icon={<img src={sendIcon}/>}
                              onClick={() => onSend()}/> :
                      <Button disabled type="secondary" className="send-btn send-btn-default" icon={<img src={defaultSendIcon}/>}/>}
              </div>


          </div>}
            {currentSession?.type == 1 &&
                <div className="chat-test-case-stop">
                    {(currentSession?.isStop && !testCaseFinished) ?
                        <Button type="secondary" loading className="send-btn">停止中</Button> :(currentSession?.isStop && testCaseFinished) ?
                        <Button type="secondary"  disabled className="send-btn" icon={<img src={stopIcon} />}>已停止</Button>:
                        <Button disabled={testCaseFinished} type="secondary" className="send-btn" icon={<img src={stopIcon} />} onClick={onStop}>停止会话</Button>}

                </div>
            }

          {/* 提示词管理弹窗*/}
          <Modal
            title={
                <div style={{ textAlign: 'left',fontWeight:600 }}>
                <span>提示词管理</span>
                </div>
            }
            unmountOnExit
            visible={promptModalVisible}
            onOk={() => setPromptModalVisible(false)}
            onCancel={() => setPromptModalVisible(false)}
            style={{ width: 700 }}
            footer={null}
            autoFocus={false}
            focusLock
            className='prompt-setting-modal'
          >
              <div>
                  <PromptSetting
                    ontologyId={ontology.id}
                    prompt={sysPrompt}
                    onCancel={() => setPromptModalVisible(false)}
                    onUpdate={handleUpdatePrompt}
                  />
              </div>
          </Modal>
      </Layout>
    );
};

export default Chat;
