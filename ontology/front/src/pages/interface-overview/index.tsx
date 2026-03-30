import { Tabs } from '@arco-design/web-react';
import { IconCorrectFill,IconNodeTreeColor,IconTopologyColor, IconDataCatalogMgrColor, IconGridColor, IconLevelColor,IconDataGovernanceColor, IconReportDetailColor } from 'modo-design/icon';
import React from 'react';
import { getData } from './api';
import ObjAttributeCanvas from './pages/obj-attribute-canvas';
import ObjDetail from './pages/obj-detail';
import './style/index.less';
import ObjManager from "@/pages/obj-manager";
import RelationshipConstraint from './pages/relationship-constraint'
const TabPane = Tabs.TabPane;

class ObjOverview extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            data: {},
            // obj: {},
            menuKey: 'overview'
        };
        this.viewMapRef = React.createRef();
        this.viewMapRef.current = {};
        this.objAttributeCanvasRef = React.createRef();
    }
    getData = () => {
        getData(this.props.obj.id).then(res => {
            if (res.data.data) {
                const {
                    data
                } = res.data;
                this.setState({
                    data,
                    // obj: data
                })
            }
        }).catch(err => {

        })
    };
    handleSave = (callback, onerror) => {
        const view = this.viewMapRef.current[this.state.menuKey];
        if (view && typeof view.handleSave === 'function') {
            view.handleSave((...args) => {
                this.getData();
                callback(...args)
            }, onerror);
        }
    };
    componentDidMount() {
        this.getData();
        if (this.props.onUpdateUseSaveBtn) {
            const shouldEnableSaveBtn = this.state.menuKey === 'overview'||this.state.menuKey === 'attr';
            this.props.onUpdateUseSaveBtn(this.props.obj.id, shouldEnableSaveBtn);          }
    }
    componentDidUpdate(prevProps, prevState) {
        // 当 menuKey 发生变化时，更新 useSaveBtn 状态
        if (prevState.menuKey !== this.state.menuKey) {
            if (this.props.onUpdateUseSaveBtn) {
                this.props.onUpdateUseSaveBtn(this.props.obj.id, this.state.menuKey === 'overview'||this.state.menuKey === 'attr'); // 或 false，根据具体需求
              }
        }
    }
    render() {
        const {
            data,
            // obj,
            menuKey
        } = this.state;
        const {
            obj
        } = this.props;
        return (
            <>
                <div
                    className="obj-overview">
                    <div
                        className="obj-overview-sidebar">
                        <div
                            className="base-info">
                            <div
                                className="label">
                                <span className="label-text">{data.label || obj.label}</span>

                            </div>
                            <div
                                className="name">
                                <span className="name-text">{data.name}</span>
                            </div>
                        </div>
                        <div
                            className="menu-list">
                            {[
                                {
                                    icon: <IconGridColor/>,
                                    label: '概览',
                                    name: 'overview'
                                },
                                {
                                    icon: <IconReportDetailColor/>,
                                    label: '属性',
                                    name: 'attr'
                                },
                                {
                                    icon: <IconLevelColor/>,
                                    label: '继承对象',
                                    name: 'extendObject'
                                },
                                {
                                    icon: <IconDataGovernanceColor/>,
                                    label: '关系约束',
                                    name: 'relationConstraint',
                                },
                                {
                                    icon: <IconNodeTreeColor/>,
                                    label: '逻辑',
                                    name: 'logic',
                                    disabled: true
                                },
                                {
                                    icon: <IconTopologyColor/>,
                                    label: '动作',
                                    name: 'action',
                                    disabled: true
                                }
                            ].map(item => {
                                return (
                                    <div
                                        className={`menu-item ${item.name === menuKey ? 'active' : ''}  ${item.disabled ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (item.disabled) {
                                                return;
                                            }
                                            this.setState({
                                                menuKey: item.name
                                            })
                                        }}>
                                        <span className="icon">{item.icon}</span>
                                        <span className="label">{item.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div
                        className="obj-overview-content">
                        <div
                            className="obj-data">
                            <Tabs activeTab={menuKey}>
                                <TabPane key='overview' title='overview'>
                                    {Object.keys(obj).length > 0 && <ObjDetail
                                        ref={ref => this.viewMapRef.current['overview'] = ref}
                                        obj={obj}
                                        push={this.props.push}
                                        ontology={this.props.ontology}
                                        onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                        switchMenuKey={(menuKey, operParams) => {
                                           // this.props.changeTab(menuKey,operParams.oper)
                                            this.setState({menuKey})

                                        }}/>}
                                </TabPane>
                                <TabPane key='attr' title='attr'>
                                    <ObjAttributeCanvas
                                        ontology={this.props.ontology}
                                        ref={ref => this.viewMapRef.current['attr'] = ref}
                                        obj={obj}
                                        push={this.props.push}
                                       // onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                        />
                                </TabPane>
                                <TabPane key='extendObject' title='extendObject'>
                                    <ObjManager
                                      ref={ref => (this.viewMapRef.current['extendObject'] = ref)}
                                      ontology={this.props.ontology}
                                      push={this.props.push}
                                      interfaceId={this.props.obj.id}
                                      updateParent={() => {
                                          this.getData();
                                          this.viewMapRef.current['overview'] && this.viewMapRef.current['overview'].getData();
                                      }}
                                      changeTab={(tab, oper) => this.props.changeTab && this.props.changeTab(tab, oper)}
                                     // onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                    />
                                </TabPane>
                                <TabPane key='relationConstraint' title='relationConstraint'>
                                    <RelationshipConstraint
                                      ref={ref => (this.viewMapRef.current['relationConstraint'] = ref)}
                                      ontology={this.props.ontology}
                                      push={this.props.push}
                                      interfaceData={this.props.obj}
                                      updateParent={() => {
                                          this.getData();
                                          this.viewMapRef.current['overview'] && this.viewMapRef.current['overview'].getData();
                                      }}
                                      changeTab={(tab, oper) => this.props.changeTab && this.props.changeTab(tab, oper)}
                                     // onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                    />
                                </TabPane>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default ObjOverview;
