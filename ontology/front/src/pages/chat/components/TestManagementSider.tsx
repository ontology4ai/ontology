import React, { useState, useMemo } from 'react';
import {Layout, Input, Button, Tag, Typography, Tooltip, Divider, Modal, Empty} from '@arco-design/web-react';
import {
    IconMenuFold, IconMenuUnfold, IconApps,
    IconSearch, IconClockCircle
} from '@arco-design/web-react/icon';
import { TestCase, SessionSummary } from '../types';
import {IconSearchColor,IconCaretRight,IconDelete,IconSliderOffColor,IconSliderOnColor, IconResMgrColor,IconProgramMgrColor,IconReportDetailColor} from "modo-design/icon";
import emptyIcon from "@/pages/chat/images/empty.svg";
import caseIcon from "@/pages/chat/images/case.svg";
import noCaseIcon from "@/pages/chat/images/no_case_chat.svg";

const { Sider } = Layout;
const { Title } = Typography;

interface TestManagementSiderProps {
    collapsed: boolean;
    onCollapse: (val: boolean) => void;
    width: number;
    testCases: TestCase[];
    sessions: SessionSummary[];
    activeSessionId: string;
    onSelectTestCase: (tc: TestCase[]) => void;
    onSelectSession: (sessionId: string) => void;
    onClearSessions: () => void;
    onDeleteSession: (id:string) => void;
    onManage: () => void;
    onBatch:() => void;
}

const TestManagementSider: React.FC<TestManagementSiderProps> = ({
                                                                     collapsed,
                                                                     onCollapse,
                                                                     width,
                                                                     testCases,
                                                                     sessions,
                                                                     activeSessionId,
                                                                     onSelectTestCase,
                                                                     onSelectSession,
                                                                     onClearSessions,
                                                                     onDeleteSession,
                                                                     onManage,
                                                                     onBatch
                                                                 }) => {
    const [searchKeyword, setSearchKeyword] = useState<string>('');

    // 根据搜索关键词过滤测试用例
    const filteredTestCases = useMemo(() => {
        if (!searchKeyword.trim()) {
            return testCases;
        }
        const keyword = searchKeyword.toLowerCase();
        return testCases.filter(tc => 
            tc.question?.toLowerCase().includes(keyword) || 
            tc.expectedResult?.toLowerCase().includes(keyword)
        );
    }, [testCases, searchKeyword]);

    const handleDelete = (id:string)=>{
        Modal.confirm({
            title: '删除测试记录',
            content: `确认是否删除该测试记录？`,
            onOk: () => {
                onDeleteSession(id);
            },
            onCancel: () => {

            }
        });
    };
    const clearSessions = ()=>{
        Modal.confirm({
            title: '清空测试记录',
            content: `确认是否删除该本体的所有测试记录（包括当前会话）？`,
            onOk: () => {
                onClearSessions();
            },
            onCancel: () => {

            }
        });
    };
    return (
      <Sider
        collapsible
        trigger={null} // 1. 隐藏默认底部触发器
        collapsed={collapsed}
        onCollapse={onCollapse}
        width={width}
        collapsedWidth={50}
        className="app-sider"
      >
          {/* 顶部 Header 区域 */}
          <div className="sider-header-area">
              {!collapsed ? (
                <>
                    {/* 展开状态的标题栏 */}
                    <div className="sider-title-row">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className='sider-title'>测试管理</span>
                        </div>

                        {/* 2. 右上角：收起按钮 */}
                        <Tooltip content="收起">
                            <Button
                              type="text"
                              icon={<IconSliderOffColor />}
                              onClick={() => onCollapse(true)}
                              style={{ color: '#4B5665' }}
                            />
                        </Tooltip>
                    </div>
                </>
              ) : (
                // 3. 折叠状态：显示展开按钮
                <div
                  className='collapsed-header'
                >
                    <Tooltip content="展开" position="right">
                        <Button
                          type="text"
                          icon={<IconSliderOnColor style={{ fontSize: 18, color: '#4B5665' }} />}
                          onClick={() => onCollapse(false)}
                        />
                    </Tooltip>

                </div>
              )}
          </div>

          {/* 中间：测试用例列表 */}
          {!collapsed ?
          <div className="test-case-list">
              <div className="sider-tags-row">
                  <span className='case-title'>CQ测试用例库</span>
                  <div className="case-btns">
                      {/* <Button size="small" type='text' onClick={onBatch}>
                          批量测试
                      </Button>
                      <Divider type="vertical" style={{margin:"0 4px"}}/> */}
                      <Button size="small" type='text' onClick={onManage}>
                          用例管理
                      </Button>
                  </div>

              </div>

              {testCases && testCases.length > 0 ? (
                <>
                    <div className="sider-search-row">
                        <Input
                          suffix={<IconSearchColor />}
                          placeholder="请输入"
                          value={searchKeyword}
                          onChange={(value) => setSearchKeyword(value)}
                          allowClear
                        />
                    </div>
                    <div className="sider-scroll-area">
                        {filteredTestCases.slice(0, 20).map(tc => (
                          <div
                            key={tc.id}
                            className="test-case-card"
                          >
                              <div className="tc-header">
                                  {/* <span className="tc-dot" style={{background: tc.statusColor,marginRight:'3px'}}/> */}
                                  <span className="tc-title">
                                      <Tooltip content={tc.question}> {tc.question}</Tooltip>
                                  </span>
                                  <span className='action-icon' onClick={() => onSelectTestCase([tc])} ><IconCaretRight/></span>
                              </div>
                              <div className="tc-desc">
                                  <Tooltip content={tc.expectedResult}> {tc.expectedResult} </Tooltip>
                              </div>
                          </div>
                        ))}
                    </div>
                    {filteredTestCases.length > 20 && (
                      <Button className="view-more-btn" type='text' onClick={onManage}>查看更多用例</Button>
                    )}
                    {searchKeyword.trim() && filteredTestCases.length === 0 && (
                      <Empty
                        icon={<img style={{ height: '60px' }} src={emptyIcon} />}
                        description="未找到匹配的测试用例"
                      />
                    )}
                </>
              ) : (
                <Empty
                  icon={<img style={{ height: '60px' }} src={emptyIcon} />}
                  description="暂无测试用例库"
                />
              )}

          </div>:
          <div className="sider-icons">
                <Tooltip content="测试用例库" position="right">
                    <Button
                      type="text"
                      icon={< IconProgramMgrColor style={{ fontSize: 18, color: '#4B5665' }} />}
                      onClick={() => onCollapse(false)}
                    />
                </Tooltip>
            </div>
          }

          {/* 底部：会话列表 */}
          {!collapsed ? (
            <div className="sider-footer-area">
               <Divider className='footer-divider'/>
                <div className="footer-title">
                    <span>最近测试记录</span>
                    {sessions.length > 0 && !(sessions.length == 1 && sessions[0].type=='new') && <Button type="text" size="mini" onClick={clearSessions}>
                        清空
                    </Button>}
                </div>
                {sessions.length > 0 &&
                    <div className="history-list">
                        {sessions.map((session: SessionSummary) => {
                              return session.type == 'new' ? '' : <div
                                key={session.id}
                                className={`history-item ${session.id === activeSessionId ? 'active' : ''}`}
                                onClick={() => onSelectSession(session.id)}
                              >
                                  <div className="history-title">
                                      <div className="h-query">
                                      <img src={session?.type == '1'|| session.type=='update-test-case'?caseIcon:noCaseIcon} alt="" /> 
                                          <Tooltip content={session.name}>{session.name}</Tooltip>
                                      </div>
                                      <div className="h-actions">
                                          <Button size='small' shape='circle' type='text'
                                                  icon={<IconDelete/>}
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDelete(session.id)
                                                  }}/>

                                      </div>
                                  </div>

                                  <div className="h-meta">
                                      {/*  <span style={{ marginRight: 8 }}>#{session.id.slice(0,4)}</span>*/}
                                      <span>{session.time}</span>
                                  </div>
                              </div>
                          }
                        )}
                    </div>
                }
                {
                    (!sessions || sessions.length==0 ||(sessions.length==1 && sessions[0].type=='new')) &&
                    <Empty icon={<img style={{height: '60px'}} src={emptyIcon}/>}
                    description='暂无测试记录'
                    />
                }

            </div>
          ):
            <div className="sider-icons">
                <Tooltip content="测试记录" position="right">
                    <Button
                      type="text"
                      icon={< IconReportDetailColor style={{ fontSize: 18, color: '#4B5665' }} />}
                      onClick={() => onCollapse(false)}
                    />
                </Tooltip>
            </div> }

      </Sider>
    );
};

export default TestManagementSider;
