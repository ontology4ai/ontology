import AgentDebugging from '@/pages/ontology-manager/pages/agent-debugging';
import { Spin, Tabs } from '@arco-design/web-react';
import {
  IconBackupsShareColor,
  IconCardColor,
  IconDataGovernanceColor,
  IconDataResDirColor,
  IconListColor,
  IconServerNodeColor,
  IconSwapLeftRightColor,
  IconTopologyColor,
} from 'modo-design/icon';
import React from 'react';
import ActionManager from '../action-manager';
import AttrManager from '../attr-manager';
import FunctionManager from '../function-manager';
import InterfaceManager from '../interface-manager';
import TipCopy from '../tip-copy';
import fxIcon from '../function-manager/images/fx.svg';
import fxActiveIcon from '../function-manager/images/fxactive.svg';
import Linkanager from '../link-manager';
import ObjManager from '../obj-manager';
import ObjVersion from '../obj-version';
import OntologyDetail from '../ontology-detail';
import Prompt from './prompt';
import TaskRecord from './task-record';
import { getData } from './api';
import './style/index.less';

const { TabPane } = Tabs;

class OntologyOverview extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      loading: true,
      data: {
        sharedAttributes: [],
        objectTypes: [],
        linkTypes: [],
        actionTypes: [],
        promptTotal: 0,
      },
      menuKey: '',
      selectedRowKeys: [],
    };
    this.ontologyOverviewRef = React.createRef();
    this.viewMapRef = React.createRef();
    this.viewMapRef.current = {};
  }
  getData = () => {
    this.setState({
      loading: true,
    });
    getData(this.props.ontology.id)
      .then(res => {
        if (res.data.data) {
          const { data } = res.data;
          this.setState({
            data: {
              ...data,
              sharedAttributes: data.sharedAttributes || [],
              objectTypes: data.objectTypes || [],
              linkTypes: data.linkTypes || [],
              actionTypes: data.actionTypes || [],
              promptTotal: data.promptTotal || 0,
            },
          });
          this.formRef.current.setFieldsValue({
            ontologyName: data.ontologyName,
            ontologyLabel: data.ontologyLabel,
            ontologyDesc: data.ontologyDesc,
            status: Boolean(data.status),
          });
        }
      })
      .catch(err => {})
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };
  handleSave = callback => {
    const view = this.viewMapRef.current[this.state.menuKey];
    if (view && typeof view.handleSave === 'function') {
      view.handleSave((...args) => {
        this.getData();
        callback(...args);
      });
    }
  };

  onPublishSuccess = () => {
    // 调用 ObjVersion 组件的 getData 方法
    const objVersionRef = this.viewMapRef.current.history;
    if (objVersionRef && typeof objVersionRef.getData === 'function') {
      objVersionRef.getData();
    }
  };

  updateParentSaveBtnState = shouldEnableSaveBtn => {
    if (this.props.onUpdateUseSaveBtn) {
      // 使用 setTimeout 确保状态更新在下一个 tick 执行
      setTimeout(() => {
        this.props.onUpdateUseSaveBtn(this.props.ontology.id, shouldEnableSaveBtn);
      }, 0);
    }
  };

  componentDidMount() {
    this.getData();
    if (this.state.menuKey !== 'detail') {
      this.setState({ menuKey: 'detail' });
      this.updateParentSaveBtnState(true);
    }
  }

  shouldEnableSaveBtn = () => {
    const enableMenus = ['detail']; // 需要启用保存按钮的菜单
    return enableMenus.includes(this.state.menuKey);
  };
  componentDidUpdate(prevProps, prevState) {
    if (prevState.menuKey !== this.state.menuKey) {
      const shouldEnableSaveBtn = this.shouldEnableSaveBtn();
      this.updateParentSaveBtnState(shouldEnableSaveBtn);
    }
  }
  render() {
    const { data, loading, menuKey } = this.state;
    const { ontology, push } = this.props;
    return (
      <>
        <Spin loading={loading} className="ontology-overview-spin">
          <div
            ref={this.ontologyOverviewRef}
            className="ontology-overview"
            style={
              {
                // visibility: component ? 'hidden' : 'visible',
                // zIndex: component ? '-1' : '1',
              }
            }
          >
            <AgentDebugging
              agentId={ontology?.id}
              label={ontology?.ontologyLabel}
              popupRef={this.ontologyOverviewRef}
            />
            <div className="ontology-overview-sidebar">
              <div className="base-info">
                <div className="label">
                  <span className="label-text">{data.ontologyLabel || ontology.ontologyLabel}</span>
                  <span className="icon">
                    <IconSwapLeftRightColor />
                  </span>
                </div>
                <div className="name">
                  <span className="name-text">{data.ontologyName || ontology.ontologyName}</span>
                </div>
              </div>
              <div className="menu-list">
                {[
                  {
                    name: 'detail',
                    label: '总览',
                    icon: <IconCardColor />,
                  },
                  {
                    name: 'history',
                    label: '历史',
                    icon: <IconCardColor />,
                  },
                ].map(item => {
                  return (
                    <div
                      className={`menu-item ${item.name === menuKey ? 'active' : ''}`}
                      onClick={() => {
                        this.setState({
                          menuKey: item.name,
                        });
                      }}
                    >
                      <span className="icon">{item.icon}</span>
                      <span className="label">{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="ontology-res-title">本体资源</div>
              <div className="ontology-res">
                {[
                  {
                    name: 'object',
                    label: '对象定义',
                    icon: <IconDataResDirColor />,
                    num: data.objectTypes.length,
                  },
                  {
                    name: 'link',
                    label: '关系定义',
                    icon: <IconDataGovernanceColor />,
                    num: data.linkTypes.length,
                  },
                  {
                    name: 'function',
                    label: '逻辑定义',
                    icon: <img src={fxIcon} alt="" />,
                    num: data?.logicTypes?.length || 0,
                  },
                  {
                    name: 'action',
                    label: '动作定义',
                    icon: <IconTopologyColor />,
                    num: data?.actionDtos?.length || 0,
                  },
                  {
                    name: 'interface',
                    label: '接口定义',
                    icon: <IconServerNodeColor />,
                    num: data?.interfaces?.length || 0,
                  },
                  // {
                  //   name: 'tip',
                  //   label: '提示词',
                  //   icon: <IconServerNodeColor />,
                  //   num: 0,
                  //   noNum: true,
                  //   //  disabled: true,
                  // },
                  {
                    name: 'prompt',
                    label: '提示词管理',
                    icon: <IconServerNodeColor />,
                    num: data?.promptTotal || 0,
                  },
                  {
                    name: 'attribute',
                    label: '共享属性',
                    icon: <IconBackupsShareColor />,
                    num: data.sharedAttributes.length,
                    disabled: true,
                    noNum: true,
                  },
                  {
                    name: 'group',
                    label: '分组',
                    icon: <IconListColor />,
                    num: 0,
                    disabled: true,
                    noNum: true,
                  },
                ].map(item => {
                  return (
                    <div
                      className={`ontology-res-item menu-item ${
                        item.name === menuKey ? 'active' : ''
                      } ${item.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (item.disabled) {
                          return;
                        }
                        this.setState({
                          menuKey: item.name,
                        });
                      }}
                    >
                      <span className="icon">
                        {item.name != 'function' ? (
                          item.icon
                        ) : item.name === menuKey ? (
                          <img
                            src={fxActiveIcon}
                            alt=""
                            style={{ width: '12px', height: '14px', marginTop: '4px' }}
                          />
                        ) : (
                          <img
                            src={fxIcon}
                            alt=""
                            style={{ width: '12px', height: '14px', marginTop: '4px' }}
                          />
                        )}
                      </span>
                      <span className="label">{item.label}</span>
                      {item.noNum ? '' : <span className="num">{item.num}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="ontology-res-title">导入导出管理</div>
              <div className="ontology-res">
                {[
                  {
                    name: 'task-record',
                    label: '任务记录',
                    icon: <IconDataResDirColor />,
                    noNum: true,
                  },
                ].map(item => {
                  return (
                    <div
                      className={`ontology-res-item menu-item ${
                        item.name === menuKey ? 'active' : ''
                      } ${item.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (item.disabled) {
                          return;
                        }
                        this.setState({
                          menuKey: item.name,
                        });
                      }}
                    >
                      <span className="icon">
                        {item.name != 'function' ? (
                          item.icon
                        ) : item.name === menuKey ? (
                          <img
                            src={fxActiveIcon}
                            alt=""
                            style={{ width: '12px', height: '14px', marginTop: '4px' }}
                          />
                        ) : (
                          <img
                            src={fxIcon}
                            alt=""
                            style={{ width: '12px', height: '14px', marginTop: '4px' }}
                          />
                        )}
                      </span>
                      <span className="label">{item.label}</span>
                      {item.noNum ? '' : <span className="num">{item.num}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="ontology-overview-content">
              <div className="ontology-data">
                <Tabs activeTab={menuKey} destroyOnHide>
                  <TabPane key="detail" title="detail">
                    <OntologyDetail
                      ref={ref => (this.viewMapRef.current.detail = ref)}
                      ontology={data}
                      push={push}
                      switchMenuKey={key => {
                        this.setState({
                          menuKey: key,
                        });
                      }}
                    />
                  </TabPane>
                  <TabPane key="history" title="history">
                    <ObjVersion
                      ref={ref => (this.viewMapRef.current.history = ref)}
                      ontology={data}
                    />
                  </TabPane>
                  <TabPane key="attribute" title="attribute">
                    <AttrManager
                      ref={ref => (this.viewMapRef.current.attribute = ref)}
                      ontology={ontology}
                      push={push}
                      updateParent={() => {
                        this.getData();
                      }}
                    />
                  </TabPane>
                  <TabPane key="object" title="object">
                    <ObjManager
                      ref={ref => (this.viewMapRef.current.object = ref)}
                      ontology={ontology}
                      push={push}
                      updateParent={() => {
                        this.getData();
                      }}
                      changeTab={(tab, oper) => {
                        this.setState({ menuKey: tab }, () => {
                          this.props?.changeActiveTab(ontology.id, () => {
                            if (oper == 'add') {
                              const viewMapRefTab = this.viewMapRef.current[tab];
                              if (tab == 'action') {
                                viewMapRefTab.handleCreateAction('object');
                              } else if (tab == 'link') {
                                viewMapRefTab.handleCreateLink();
                              }
                            }
                          });
                        });
                      }}
                      onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                    />
                  </TabPane>
                  <TabPane key="link" title="link">
                    <Linkanager
                      ref={ref => (this.viewMapRef.current.link = ref)}
                      ontology={ontology}
                      push={push}
                      updateParent={() => {
                        this.getData();
                      }}
                      onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                    />
                  </TabPane>
                  <TabPane key="action" title="action">
                    <ActionManager
                      ref={ref => (this.viewMapRef.current.action = ref)}
                      ontology={ontology}
                      push={push}
                      updateParent={() => {
                        this.getData();
                      }}
                      onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                    />
                  </TabPane>
                  <TabPane key="function" title="function">
                    <FunctionManager
                      ref={ref => (this.viewMapRef.current.function = ref)}
                      ontology={ontology}
                      push={push}
                      updateParent={() => {
                        this.getData();
                      }}
                      onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                    />
                  </TabPane>
                  <TabPane key="interface" title="interface">
                    <InterfaceManager
                      ref={ref => (this.viewMapRef.current.function = ref)}
                      ontology={ontology}
                      push={push}
                      onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                      changeTab={(tab, oper) => {
                        this.setState({ menuKey: tab }, () => {
                          this.props?.changeActiveTab(ontology.id, () => {
                            if (oper == 'add') {
                              const viewMapRefTab = this.viewMapRef.current[tab];
                              if (tab == 'action') {
                                viewMapRefTab.handleCreateAction('object');
                              } else if (tab == 'link') {
                                viewMapRefTab.handleCreateLink();
                              }
                            }
                          });
                        });
                      }}
                      updateParent={() => {
                        this.getData();
                      }}
                    />
                  </TabPane>
                  <TabPane key="tip" title="tip">
                    <TipCopy
                      ref={ref => (this.viewMapRef.current.tip = ref)}
                      ontology={ontology}
                      push={push}
                    />
                  </TabPane>

                  <TabPane key="prompt" title="prompt">
                    <Prompt ontologyId={ontology.id} />
                  </TabPane>

                  <TabPane key="task-record" title="prompt">
                    <TaskRecord ontologyId={ontology.id} />
                  </TabPane>
                </Tabs>
              </div>
            </div>
          </div>
        </Spin>
      </>
    );
  }
}

export default OntologyOverview;
