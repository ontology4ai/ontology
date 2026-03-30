import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Tabs, Input, Badge, Tooltip } from '@arco-design/web-react';
import { Tag } from 'modo-design';
// 引入自定义Empty组件
import CustomEmpty from '../Empty';
import {
  IconSearch,
  IconRefresh,
  IconCounterColor,
  IconDataIntegrationColor,
  IconCalendarColor,
  IconTextareaColor,
  IconUnitMgrColor,
} from 'modo-design/icon';
import './style/index.less';
import ObjectIcon from './img/obj-title.png';
import FunctionIcon from './img/func-title.png';
import ActionIcon from './img/action-title.png';
import draClose from './img/dra-close.svg';
import funcParams from './img/func-params.svg';
import funcLine from './img/func-line.svg';
import editCode from './img/edit-code.svg';
import editLink from './img/edit-link.svg';

import { getObjDetail, getActionDetail, getLogicDetail } from '../api/index';
import { IconLoading } from '@arco-design/web-react/icon';

const { TabPane } = Tabs;

interface NodeDetailDrawerProps {
  visible: boolean;
  onCancel: () => void;
  getPopupContainer?: React.RefObject<HTMLElement>;
  nodeType?: 'object' | 'logic' | 'action';
  afterOpen?: () => void;
  selectData?: any;
  onObjDetailChange?: (data: any) => void;
}

const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  visible,
  onCancel,
  getPopupContainer,
  nodeType = 'object',
  afterOpen,
  selectData,
  onObjDetailChange,
}) => {
  // 管理Tabs组件的activeKey
  const [activeKey, setActiveKey] = useState('basic');
  const [logicDetail, setLogicDetail] = useState<any>({});
  const [objDetail, setObjDetail] = useState<any>({});
  const [actionDetail, setActionDetail] = useState<any>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  // loading状态
  const [loading, setLoading] = useState(false);

  // DOM引用
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const codeEditorRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 设置代码编辑器高度
  const setCodeEditorHeight = () => {
    if (!contentRef.current) return;

    const contentHeight = contentRef.current.offsetHeight;
    // 获取header和description的高度
    const headerHeight = headerRef.current?.offsetHeight || 0;
    const descriptionHeight = descriptionRef.current?.offsetHeight || 0;
    // 计算编辑器高度，减去header和description的高度
    const editorHeight = Math.max(100, contentHeight - headerHeight - descriptionHeight - 140); // 最小高度100px

    // 设置所有代码编辑器的高度
    Object.values(codeEditorRefs.current).forEach(editor => {
      if (editor) {
        editor.style.height = `${editorHeight}px`;
      }
    });
  };

  // 监听visible变化和resize事件
  useEffect(() => {
    if (visible) {
      // 延迟设置高度，确保DOM已渲染
      const timer = setTimeout(() => {
        setCodeEditorHeight();
      }, 100);

      // 添加resize事件监听
      window.addEventListener('resize', setCodeEditorHeight);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', setCodeEditorHeight);
      };
    }
  }, [visible, activeKey, logicDetail.functionCode, actionDetail.functionCode]);

  // 计算属性：根据搜索关键字过滤后的属性列表
  const filteredAttributes = React.useMemo(() => {
    if (!searchKeyword) return objDetail.attributes || [];
    return (objDetail.attributes || []).filter((item: any) =>
      item.attributeName?.toLowerCase().includes(searchKeyword.toLowerCase()),
    );
  }, [objDetail.attributes, searchKeyword]);

  // 当nodeType或selectData变化时，重置activeKey为默认值并加载数据
  useEffect(() => {
    setActiveKey('basic');
    if (selectData?.id) {
      if (selectData.type === 'logic') {
        fetchLogicDetail();
      } else if (selectData.type === 'object') {
        fetchObjDetail();
      } else if (selectData.type === 'action') {
        fetchActionDetail();
      }
    }
  }, [selectData]);

  // 获取逻辑类型详情
  const fetchLogicDetail = async () => {
    setLoading(true);
    try {
      const response = await getLogicDetail(selectData.id);
      if (response?.data?.success && response?.data?.data) {
        setLogicDetail(response.data.data);
      }
    } catch (error) {
      console.error('获取逻辑详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取对象类型详情
  const fetchObjDetail = async () => {
    setLoading(true);
    try {
      const response = await getObjDetail(selectData.id);
      if (response?.data?.success && response?.data?.data) {
        setObjDetail(response.data.data);
        // 调用回调函数，将数据传递给父组件
        onObjDetailChange && onObjDetailChange(response.data.data);
      }
    } catch (error) {
      console.error('获取对象详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取动作类型详情
  const fetchActionDetail = async () => {
    setLoading(true);
    try {
      const response = await getActionDetail(selectData.id);
      if (response?.data?.success && response?.data?.data) {
        setActionDetail(response.data.data);
      }
    } catch (error) {
      console.error('获取动作详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染对象类型内容
  const renderObjectContent = () => {
    return (
      <>
        {/* 节点基本信息 */}
        <div className="node-detail-drawer-header" ref={headerRef}>
          <img src={ObjectIcon} alt="对象图标" style={{ marginRight: 12 }} />
          <div className="node-detail-drawer-title">
            <div className="node-detail-drawer-name">
              {objDetail.objectTypeLabel || '对象中文名称'}
            </div>
            <div className="node-detail-drawer-english-name">
              {objDetail.objectTypeName || '对象英文名称'}
            </div>
          </div>
        </div>

        <div className="node-detail-drawer-description" ref={descriptionRef}>
          <Tooltip
            content={objDetail.objectTypeDesc}
            disabled={objDetail.objectTypeDesc?.length < 51}
            getPopupContainer={node => {
              return document.body;
            }}>
            {(objDetail.objectTypeDesc?.length > 50 ? objDetail.objectTypeDesc.substring(0, 50) + '...' : objDetail.objectTypeDesc) || '--'}
          </Tooltip>
        </div>

        {/* 标签页 */}
        <Tabs className="node-detail-drawer-tabs" activeTab={activeKey} onChange={setActiveKey}>
          <TabPane key="basic" title="基本信息">
            {/* 属性列表 */}
            <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>属性</span>
                  <div className="node-detail-drawer-property-count">
                    {objDetail.attributes?.length || 4}
                  </div>
                </div>
                <div className="node-detail-drawer-property-filter">
                  <Input
                    placeholder="请输入"
                    allowClear
                    addAfter={<IconSearch />}
                    value={searchKeyword}
                    onChange={setSearchKeyword}
                  />
                </div>
              </div>

              {/* 属性列表 */}
              <div className="node-detail-drawer-property-list attr-list list">
                {filteredAttributes.length > 0 ? (
                  filteredAttributes.map((item: any, index: number) => (
                    <div className="node-detail-drawer-property-item attr-item item" key={index}>
                      <div className="node-detail-drawer-property-type-icon icon">
                        <IconDataIntegrationColor />
                      </div>
                      <span className="node-detail-drawer-property-name label">
                        {item.attributeName}
                      </span>
                      <div className="node-detail-drawer-property-tags tag-list">
                        {item.isPrimaryKey === 1 && (
                          <Tag size="mini" effect="plain" color="arcoblue">
                            主键
                          </Tag>
                        )}
                        {item.isTitle === 1 && (
                          <Tag size="mini" effect="plain" color="cyan">
                            标题
                          </Tag>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <CustomEmpty />
                )}
              </div>
            </div>
          </TabPane>
          <TabPane key="instance" title="实例" disabled={true}>
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>实例内容待实现</div>
          </TabPane>
          <TabPane key="alarmSetting" title="告警设置" disabled={true}>
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              告警设置内容待实现
            </div>
          </TabPane>
        </Tabs>
      </>
    );
  };

  // 根据节点类型渲染不同的内容
  const renderContent = () => {
    if (selectData.type === 'logic') {
      return renderFunctionContent();
    } else if (selectData.type === 'action') {
      return renderActionContent();
    }
    return renderObjectContent();
  };

  // 渲染函数类型内容
  const renderFunctionContent = () => {
    return (
      <>
        {/* 节点基本信息 */}
        <div className="node-detail-drawer-header" ref={headerRef}>
          <div className="node-detail-drawer-icon">
            <img src={FunctionIcon} alt="逻辑图标" style={{ marginRight: 12 }} />
          </div>
          <div className="node-detail-drawer-title">
            <div className="node-detail-drawer-name">{logicDetail.logicTypeLabel}</div>
            <div className="node-detail-drawer-english-name">{logicDetail.logicTypeName}</div>
          </div>
        </div>

        <div className="node-detail-drawer-description" ref={descriptionRef}>
          <Tooltip
            content={logicDetail.logicTypeDesc}
            disabled={logicDetail.logicTypeDesc?.length < 51}
            getPopupContainer={node => {
              return document.body;
            }}>
            {(logicDetail.logicTypeDesc?.length > 50 ? logicDetail.logicTypeDesc.substring(0, 50) + '...' : logicDetail.logicTypeDesc) || '--'}
          </Tooltip>
        </div>

        {/* 标签页 */}
        <Tabs className="node-detail-drawer-tabs" activeTab={activeKey} onChange={setActiveKey}>
          <TabPane key="basic" title="基本信息">
            {/* 概览 */}
            <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span className="node-detail-drawer-property-header-title">概览</span>
                </div>
              </div>
              <div className="node-detail-drawer-overview">
                <div className="node-detail-drawer-overview-item">
                  <div className="node-detail-drawer-overview-label">构建方式</div>
                  <div className="node-detail-drawer-overview-value">
                    {(() => {
                      const buildType = logicDetail.buildType || 'function';
                      switch (buildType) {
                        case 'function':
                          return '函数';
                        case 'object':
                          return '对象';
                        default:
                          return buildType;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* 参数列表 */}
            <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>参数</span>
                  <div className="node-detail-drawer-property-count">
                    {(() => {
                      try {
                        if (logicDetail.inputParam) {
                          const inputParams = JSON.parse(logicDetail.inputParam);
                          return Object.keys(inputParams).length;
                        }
                      } catch (error) {
                        console.error('解析inputParam失败:', error);
                      }
                      return 0;
                    })()}
                  </div>
                </div>
              </div>

              <div className="node-detail-drawer-property-list">
                {(() => {
                  try {
                    if (logicDetail.inputParam) {
                      const inputParams = JSON.parse(logicDetail.inputParam);
                      const paramKeys = Object.keys(inputParams);
                      if (paramKeys.length > 0) {
                        return paramKeys.map((key, index) => (
                          <div className="node-detail-drawer-property-item" key={index}>
                            <div className="node-detail-drawer-property-type-icon">
                              <img src={funcParams} alt="参数图标" style={{ marginRight: 6 }} />
                            </div>
                            <span className="node-detail-drawer-property-name">{key}</span>
                          </div>
                        ));
                      }
                    }
                  } catch (error) {
                    console.error('解析inputParam失败:', error);
                  }
                  return <CustomEmpty />;
                })()}
              </div>
            </div>

            {/* 关联对象 */}
            <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>关联对象</span>
                  <div className="node-detail-drawer-property-count">
                    {logicDetail.objectTypeList?.length || 0}
                  </div>
                </div>
              </div>

              <div className="node-detail-drawer-property-list">
                {logicDetail.objectTypeList && logicDetail.objectTypeList.length > 0 ? (
                  logicDetail.objectTypeList.map((item: any, index: number) => (
                    <div className="node-detail-drawer-property-item" key={index}>
                      <div className="node-detail-drawer-property-type-icon">
                        <img src={funcLine} alt="对象图标" style={{ marginRight: 6 }} />
                      </div>
                      <span className="node-detail-drawer-property-name">
                        {item.objectTypeLabel || item.objectTypeName}
                      </span>
                    </div>
                  ))
                ) : (
                  <CustomEmpty />
                )}
              </div>
            </div>
          </TabPane>
          <TabPane key="logic" title="逻辑规则">
            {/* 逻辑表达式 */}
            <div className="node-detail-drawer-logic">
              {/* 逻辑规则头部 */}
              <div className="node-detail-drawer-property-header">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>逻辑预览</span>
                </div>
                <div
                  className="node-detail-drawer-logic-switch"
                  onClick={() => {
                    const url = `${window.location.origin}${logicDetail.codeUrl}`;
                    window.open(url, '_blank');
                  }}
                >
                  <img src={editCode} alt="编辑图标" style={{ marginRight: 6 }} />
                  <span className="node-detail-drawer-logic-switch-text">逻辑开发</span>
                </div>
              </div>

              {/* 代码编辑器 */}
              {logicDetail.functionCode ? (
                <div
                  className="node-detail-drawer-code-editor func-code-view"
                  ref={el => (codeEditorRefs.current['logic'] = el)}
                >
                  <div style={{ display: 'flex' }}>
                    <div className="func-code-view-index">
                      {logicDetail.functionCode.split('\n').map((_, idx) => (
                        <div key={idx} style={{ height: 20, lineHeight: '20px' }}>
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                    <pre style={{ margin: 0, flex: 1 }}>
                      <code>
                        {logicDetail.functionCode.split('\n').map((line, idx) => (
                          <div
                            key={idx}
                            style={{
                              height: 20,
                              lineHeight: '20px',
                              color: 'var(--Components-AI-Global-colorText, #202939)',
                            }}
                          >
                            {line}
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                <CustomEmpty />
              )}
            </div>
          </TabPane>
        </Tabs>
      </>
    );
  };

  // 渲染动作类型内容
  const renderActionContent = () => {
    return (
      <>
        {/* 节点基本信息 */}
        <div className="node-detail-drawer-header" ref={headerRef}>
          <div className="node-detail-drawer-icon">
            <img src={ActionIcon} alt="动作图标" style={{ marginRight: 12 }} />
          </div>
          <div className="node-detail-drawer-title">
            <div className="node-detail-drawer-name">
              {actionDetail.actionLabel || '动作中文名称'}
            </div>
            <div className="node-detail-drawer-english-name">
              {actionDetail.actionName || '动作英文名称'}
            </div>
          </div>
        </div>

        <div className="node-detail-drawer-description" ref={descriptionRef}>
          <Tooltip
            content={actionDetail.actionDesc}
            disabled={actionDetail.actionDesc?.length < 51}
            getPopupContainer={node => {
              return document.body;
            }}>
            {(actionDetail.actionDesc?.length > 50 ? actionDetail.actionDesc.substring(0, 50) + '...' : actionDetail.actionDesc) || '--'}
          </Tooltip>
        </div>

        {/* 标签页 */}
        <Tabs className="node-detail-drawer-tabs" activeTab={activeKey} onChange={setActiveKey}>
          <TabPane key="basic" title="基本信息">
            {/* 概览 */}
            <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>概览</span>
                </div>
              </div>
              <div className="node-detail-drawer-overview">
                <div className="node-detail-drawer-overview-item">
                  <div className="node-detail-drawer-overview-label">执行对象</div>
                  <div className="node-detail-drawer-overview-value">
                    {actionDetail.objectType?.objectTypeLabel || '对象名称'}
                  </div>
                </div>
                <div className="node-detail-drawer-overview-item">
                  <div className="node-detail-drawer-overview-label">构建方式</div>
                  <div className="node-detail-drawer-overview-value">
                    {(() => {
                      const buildType = actionDetail.buildType || 'function';
                      switch (buildType) {
                        case 'function':
                          return '函数';
                        case 'object':
                          return '对象';
                        default:
                          return buildType;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* 参数列表 */}
            <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>参数</span>
                  <div className="node-detail-drawer-property-count">
                    {(() => {
                      try {
                        if (actionDetail.inputParam) {
                          const inputParams = JSON.parse(actionDetail.inputParam);
                          return Object.keys(inputParams).length;
                        }
                      } catch (error) {
                        console.error('解析inputParam失败:', error);
                      }
                      return 0;
                    })()}
                  </div>
                </div>
              </div>

              <div className="node-detail-drawer-property-list">
                {(() => {
                  try {
                    if (actionDetail.inputParam) {
                      const inputParams = JSON.parse(actionDetail.inputParam);
                      const paramKeys = Object.keys(inputParams);
                      if (paramKeys.length > 0) {
                        return paramKeys.map((key, index) => (
                          <div className="node-detail-drawer-property-item" key={index}>
                            <div className="node-detail-drawer-property-type-icon">
                              <img src={funcParams} alt="参数图标" style={{ marginRight: 6 }} />
                            </div>
                            <span className="node-detail-drawer-property-name">{key}</span>
                          </div>
                        ));
                      }
                    }
                  } catch (error) {
                    console.error('解析inputParam失败:', error);
                  }
                  return <CustomEmpty />;
                })()}
              </div>
            </div>

            {/* 触发动作 */}
            {/* <div className="node-detail-drawer-property">
              <div className="node-detail-drawer-property-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>触发动作</span>
                  <div className="node-detail-drawer-property-count">
                    {actionDetail.triggerActions?.length || 0}
                  </div>
                </div>
              </div>

              <div className="node-detail-drawer-property-table-header">
                <div className="node-detail-drawer-property-table-header-item">动作名称</div>
                <div className="line"></div>
                <div className="node-detail-drawer-property-table-header-item">执行对象</div>
              </div>

   
              <div className="node-detail-drawer-property-list">
                {actionDetail.triggerActions && actionDetail.triggerActions.length > 0 ? (
                  actionDetail.triggerActions.map((item: any, index: number) => (
                    <div className="node-detail-drawer-property-item" key={index}>
                      <div className="node-detail-drawer-property-item-cell">
                        <div className="node-detail-drawer-property-type-icon">
                          <img src={editLink} alt="动作图标" style={{ marginRight: 6 }} />
                        </div>
                        <span className="node-detail-drawer-property-name">
                          {item.actionName || item.actionLabel || '未命名动作'}
                        </span>
                      </div>
                      <div className="node-detail-drawer-property-item-cell">
                        <div className="node-detail-drawer-property-type-icon">
                          <img src={funcLine} alt="对象图标" style={{ marginRight: 6 }} />
                        </div>
                        <span className="node-detail-drawer-property-name">
                          {item.objectType?.objectTypeLabel ||
                            item.objectType?.objectTypeName ||
                            '未指定对象'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <CustomEmpty />
                )}
              </div>
            </div> */}
          </TabPane>
          <TabPane key="actionRule" title="动作规则">
            {/* 动作表达式 */}
            <div className="node-detail-drawer-action">
              {/* 动作规则头部 */}
              <div className="node-detail-drawer-property-header">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div className="node-detail-drawer-property-header-icon"></div>
                  <span>动作预览</span>
                </div>
                <div
                  className="node-detail-drawer-logic-switch"
                  onClick={() => {
                    const url = `${window.location.origin}${actionDetail.codeUrl}`;
                    window.open(url, '_blank');
                  }}
                >
                  <img src={editCode} alt="编辑图标" style={{ marginRight: 6 }} />
                  <span className="node-detail-drawer-logic-switch-text">动作开发</span>
                </div>
              </div>

              {/* 代码编辑器 */}
              {actionDetail.functionCode ? (
                <div
                  className="node-detail-drawer-code-editor func-code-view"
                  ref={el => (codeEditorRefs.current['action'] = el)}
                >
                  <div style={{ display: 'flex' }}>
                    <div className="func-code-view-index">
                      {actionDetail.functionCode.split('\n').map((_, idx) => (
                        <div key={idx} style={{ height: 20, lineHeight: '20px' }}>
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                    <pre style={{ margin: 0, flex: 1 }}>
                      <code>
                        {actionDetail.functionCode.split('\n').map((line, idx) => (
                          <div
                            key={idx}
                            style={{
                              height: 20,
                              lineHeight: '20px',
                              color: 'var(--Components-AI-Global-colorText, #202939)',
                            }}
                          >
                            {line}
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                <CustomEmpty />
              )}
            </div>
          </TabPane>
        </Tabs>
      </>
    );
  };

  return (
    <Drawer
      title={null}
      visible={visible}
      onCancel={onCancel}
      focusLock={false}
      autoFocus={false}
      width={400}
      getPopupContainer={() => getPopupContainer && getPopupContainer.current}
      footer={null}
      mask={false}
      className="detail-simulation-drawer  node-detail-drawer"
      afterOpen={afterOpen}
    >
      {/* 自定义标头 */}
      <div
        className="node-detail-drawer-custom-header"
        style={{
          background:
            selectData.type === 'object'
              ? 'linear-gradient(to bottom, rgba(46, 144, 250 , 0.2) 0%, rgba(46, 144, 250 , 0) 100%)'
              : selectData.type === 'logic'
              ? 'linear-gradient(to bottom, rgba(90, 214, 214, 0.2) 0%, rgba(90, 214, 214, 0) 100%)'
              : 'linear-gradient(to bottom, rgba(151, 122, 231, 0.2) 0%, rgba(151, 122, 231, 0) 100%)',
        }}
      >
        <div
          className="head-color"
          style={{
            backgroundColor:
              selectData.type === 'object'
                ? '#2e90fa'
                : selectData.type === 'logic'
                ? '#5ad6d6 '
                : '#977ae7',
          }}
        ></div>
        <div className="title-content">
          <div className="node-detail-drawer-custom-header-title">节点详情</div>
          <div className="node-detail-drawer-custom-header-close" onClick={onCancel}>
            <img src={draClose} alt="关闭" style={{ cursor: 'pointer' }} />
          </div>
        </div>
      </div>
      <div
        className="node-detail-drawer-content"
        data-id="node-detail-drawer-content"
        ref={contentRef}
      >
        {renderContent()}
      </div>

      {/* 自定义loading覆盖层 */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <IconLoading style={{ fontSize: 32, color: '#2e90fa', marginBottom: 12 }} />
          <span style={{ fontSize: 12, color: '#2e90fa' }}>加载中...</span>
        </div>
      )}
    </Drawer>
  );
};

export default NodeDetailDrawer;
