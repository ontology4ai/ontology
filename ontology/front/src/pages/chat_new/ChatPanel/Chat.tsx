import React, { useState, useRef } from 'react';
import {
    Layout, Input, Button, Avatar, Spin, Tooltip, Empty, Tag, Typography,
    Divider, Modal, Form, Select, Space, Card,Dropdown,Menu,Message as ArcoMessage
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
import AIMessage from '../components/AIMessage';
import { Message, ChatSession, GraphData, TestCase } from '../types';
import {IconBookmark,IconSendColor,IconEnlarge,IconRefresh} from "modo-design/icon";
import copy from 'copy-to-clipboard';
import PromptSetting from '../components/prompt-setting';
import promptTextIcon from '@/pages/chat_new/images/promptText.svg';
import saveTestCaseIcon from '@/pages/chat_new/images/saveTestCase.svg';
import { addTestCase, getPromptList } from '@/pages/chat_new/api';

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
    onChangePrompt:(val:any)=>void;
    sysPrompt?:any,
    promptListData?: any[];
    oagPromptListData?: any[];
    onRunCase:(testCase: TestCase[]) => void;
    afterReRunTestCase?:()=>void;
    onCreateTestCaseReportTab?:(batchNum: string, total?: number) => void;
    /** 测试用例 tab：未获取到 batchNum 时禁用测试报告按钮 */
    reportDisabled?: boolean;
    /** 测试配置中的默认提示词（无对应模版时使用） */
    modeSettingData?: { defaultPrompt?: string; oagPrompt?: string };
    /** 保存用例成功后回调（用于刷新用例管理列表等） */
    onTestCaseSaved?: () => void;
}


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
                                       promptListData,
                                       oagPromptListData,
                                       afterReRunTestCase,
                                       onCreateTestCaseReportTab,
                                       reportDisabled = false,
                                       modeSettingData,
                                       onTestCaseSaved
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
    // 输入框引用与容器点击聚焦
    const textAreaRef = useRef<any>(null);
    const handleInputWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        // 点击 input-actions 区域不触发聚焦
        if (target.closest('.input-actions')) return;
        if (target.closest('.chat-textarea')) return;
        // 加载中不允许输入时不聚焦
        if (loading) return;
        // 聚焦到 TextArea
        (textAreaRef.current as any)?.focus?.();
    };

    // 保存用例弹窗状态与逻辑
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [savePromptLoading, setSavePromptLoading] = useState(false);
    const [savePromptList, setSavePromptList] = useState<any[]>([]);
    const [saveOagPromptList, setSaveOagPromptList] = useState<any[]>([]);
    const [caseForm] = Form.useForm();
    // 从 AI 消息中提取并拼接 content 里所有 type==='answer' 的文本；若无，则退化为拼接其它字符串内容
    const extractAnswerText = (aiMsg: any) => {
        try {
            const c = aiMsg?.content;
            if (Array.isArray(c)) {
                const answerTexts = c
                    .filter((it: any) => it?.type === 'answer')
                    .map((it: any) => (typeof it?.data === 'string' ? it.data : ''))
                    .filter(Boolean);
                if (answerTexts.length) return answerTexts.join('\n');
                const texts = c.map((it: any) => (typeof it?.data === 'string' ? it.data : '')).filter(Boolean);
                if (texts.length) return texts.join('\n');
            }
            if (typeof c === 'string') return c;
        } catch {}
        return '';
    };
    const fetchSavePromptOptions = async () => {
        if (!ontology?.id) return { normal: [] as any[], oag: [] as any[] };
        setSavePromptLoading(true);
        try {
            const res: any = await getPromptList({ ontologyId: ontology.id, page: 1, limit: 999, keyword: '' });
            if (res?.data?.success) {
                const data = res?.data?.data?.content || [];
                const normal = data.filter((item: any) => item.promptType == 0);
                const oag = data.filter((item: any) => item.promptType == 1);
                setSavePromptList(normal);
                setSaveOagPromptList(oag);
                return { normal, oag };
            }
        } catch (e) {
            // ignore: UI will show empty options; save still possible if user fills required fields
        } finally {
            setSavePromptLoading(false);
        }
        setSavePromptList([]);
        setSaveOagPromptList([]);
        return { normal: [] as any[], oag: [] as any[] };
    };

    // 打开“保存用例”弹窗：问题=上一条用户问题，预期结果=当前 AI 的 type==='answer' 内容；
    // 下拉提示词由弹窗自身请求接口获取（避免依赖上层 tab props 快照）。
    const handleOpenSaveModal = async (aiMsg: Message, msgIndex: number) => {
        let questionText = '';
        for (let i = msgIndex - 1; i >= 0; i--) {
            const m = messages[i];
            if (m?.role === 'user' && typeof m.content === 'string') {
                questionText = m.content;
                break;
            }
        }
        const expectedText = extractAnswerText(aiMsg);
        caseForm.setFieldsValue({ question: questionText, expectedResult: expectedText });
        setSaveModalVisible(true);

        // 拉取提示词列表后再补齐默认值（如果用户尚未选择）
        const { normal, oag } = await fetchSavePromptOptions();
        const usedPromptId = sysPrompt?.id;
        const hasInNormal = normal.some((p: any) => p.id === usedPromptId);
        const hasInOag = oag.some((p: any) => p.id === usedPromptId);
        const defaultPromptVal = hasInNormal ? usedPromptId : (modeSettingData?.defaultPrompt ?? undefined);
        const oagPromptVal = hasInOag ? usedPromptId : (modeSettingData?.oagPrompt ?? undefined);
        try {
            const cur: any = (caseForm as any).getFieldsValue?.() || {};
            const patch: any = {};
            if (!cur?.defaultPrompt && defaultPromptVal) patch.defaultPrompt = defaultPromptVal;
            if (!cur?.oagPrompt && oagPromptVal) patch.oagPrompt = oagPromptVal;
            if (Object.keys(patch).length) caseForm.setFieldsValue(patch);
        } catch {
            // ignore
        }
    };
    // 提交保存
    const handleSaveCase = () => {
        if (!ontology?.id) {
            ArcoMessage.error('缺少本体ID，无法保存用例');
            return;
        }
        // 使用表单校验+获取表单值
        caseForm.validate().then((values) => {
            setSaveLoading(true);
            const normalOptions = savePromptList.length ? savePromptList : (promptListData || []);
            const oagOptions = saveOagPromptList.length ? saveOagPromptList : (oagPromptListData || []);
            addTestCase({
                ontologyId: ontology.id,
                question: values.question,
                expectedResult: values.expectedResult,
                normalPromptName: normalOptions.find((item: any) => item.id === values.defaultPrompt)?.promptName || '',
                oagPromptName: oagOptions.find((item: any) => item.id === values.oagPrompt)?.promptName || ''
            }).then((res: any) => {
                if (res?.data?.success) {
                    ArcoMessage.success('保存用例成功');
                    setSaveModalVisible(false);
                    onTestCaseSaved?.();
                } else {
                    ArcoMessage.error(res?.data?.msg || '保存用例失败');
                }
            }).catch(() => {
                ArcoMessage.error('保存用例失败');
            }).finally(() => {
                setSaveLoading(false);
            });
        }).catch(() => {});
    };

    const handleUpdatePrompt = (newData: any) => {
        onChangePrompt({...sysPrompt,...newData});
    };
   
    return (
      <Layout className="chat-layout">
          {/* 1. 顶部 Header */}

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
                              {msg.role === 'ai' ?  <AIMessage message={msg} onRunCase={onRunCase} ontology={ontology} siderOntologyData={siderOntologyData} afterReRunTestCase={afterReRunTestCase} onCreateTestCaseReportTab={onCreateTestCaseReportTab} reportDisabled={reportDisabled}/>  : msg.content}
                          </div>

                          {msg.role === 'ai' && !loading && currentSession?.type!=1 && <div className="message-actions">
                              {msg.id && msg.status==='completed' && msg.graphData && (
                                <Tooltip content="图谱">
                                    <span className={`action-icon ${activeGraphMessageId==msg.id?'active-graph':''}`} onClick={() => msg.id && onRenderGraph(msg.id)}>
                                        <img src={graphBranchIcon} />
                                    </span>
                                </Tooltip>
                              )}
                              {msg.id && msg.id !== 'welcome' && (msg.status==='completed' || (msg.status==='error' && !msg.id.startsWith('error-')) ) && (
                                <Tooltip content="重新生成">
                                    <span className="action-icon" onClick={() => onRegenerate(index)}><IconRefresh /></span>
                                </Tooltip>
                              )}
                              {/* {msg.id && msg.id !== 'welcome' && msg.status === 'completed' &&
                              <Tooltip content="保存用例">
                                <span className="action-icon" onClick={() => handleOpenSaveModal(msg, index)}><img src={saveTestCaseIcon} alt="" /></span>
                                </Tooltip>
                              } */}

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
          {currentSession?.type != 1 &&
            <div className="chat-prompt-setting">
                <Button type="outline" icon={<img src={promptTextIcon} />} onClick={() => setPromptModalVisible(true)}>提示词</Button>
            </div>
          }

          {/* 3. 底部输入框 */}
          {currentSession?.type !=1 && <div className="chat-input-wrapper" onClick={handleInputWrapperClick}>
              <TextArea ref={textAreaRef}
                className="chat-textarea"
                placeholder="请输入测试问题"
                value={inputValue ?? ''}
                onChange={(val: any) => onInputChange((val ?? '') as string)}
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
            visible={promptModalVisible}
            onOk={() => setPromptModalVisible(false)}
            onCancel={() => setPromptModalVisible(false)}
            style={{ width: 560 }}
            footer={null}
            autoFocus={false}
            focusLock={false}
            unmountOnExit
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
          {/* 保存用例弹窗（样式与 case-manager 新增用例弹窗一致） */}
          <Modal
            title={
              <div style={{ textAlign: 'left', fontWeight: 700 }}>
                <span style={{ fontSize: '16px' }}>保存用例</span>
              </div>
            }
            visible={saveModalVisible}
            onOk={handleSaveCase}
            onCancel={() => setSaveModalVisible(false)}
            confirmLoading={saveLoading}
            style={{ width: 560 }}
            autoFocus={false}
            focusLock={false}
            unmountOnExit
            className='save-test-case-modal'
          >
            <Form form={caseForm} labelCol={{ span: 5 }} wrapperCol={{ span: 19 }} layout="vertical">
              <Form.Item label="问题" field="question" rules={[{ required: true, message: '请输入问题' }]}>
                <Input.TextArea placeholder="请输入问题" style={{ height: '100px' }} maxLength={500} showWordLimit />
              </Form.Item>
              <Form.Item label="预期结果" field="expectedResult" rules={[{ required: true, message: '请输入预期结果' }]}>
                <Input.TextArea placeholder="请输入预期结果" style={{ height: '200px' }} />
              </Form.Item>
              <Form.Item
                label="通用模板提示词"
                field="defaultPrompt"
                rules={[{ required: true, message: '请选择通用模板提示词' }]}
              >
                <Select
                  placeholder="请选择通用模板提示词"
                  allowClear={false}
                  showSearch
                  loading={savePromptLoading}
                  filterOption={(inputValue: string, option: any) =>
                    (option?.props?.extra?.label ?? '')
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) >= 0
                  }
                >
                  {(savePromptList || []).map((item: any) => (
                    <Select.Option key={item.id} value={item.id} extra={{ label: item.promptName }}>
                      <span>
                        {item.promptName}
                        {(item.defaultType === 1 || item.defaultType === '1') && (
                          <span style={{ marginLeft: 6 }}>
                            <Tag bordered color="arcoblue" size="small">提示词模板</Tag>
                          </span>
                        )}
                      </span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                label="OAG模板提示词"
                field="oagPrompt"
                rules={[{ required: true, message: '请选择OAG模板提示词' }]}
              >
                <Select
                  placeholder="请选择OAG模板提示词"
                  allowClear={false}
                  showSearch
                  loading={savePromptLoading}
                  filterOption={(inputValue: string, option: any) =>
                    (option?.props?.extra?.label ?? '')
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) >= 0
                  }
                >
                  {(saveOagPromptList || []).map((item: any) => (
                    <Select.Option key={item.id} value={item.id} extra={{ label: item.promptName }}>
                      <span>
                        {item.promptName}
                        {(item.defaultType === 1 || item.defaultType === '1') && (
                          <span style={{ marginLeft: 6 }}>
                            <Tag bordered color="arcoblue" size="small">提示词模板</Tag>
                          </span>
                        )}
                      </span>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Modal>
      </Layout>
    );
};

export default Chat;
