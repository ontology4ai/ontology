import { Tabs } from '@arco-design/web-react';
import { IconCorrectFill, IconDataCatalogMgrColor, IconServerNodeColor, IconGridColor, IconRefreshColor, IconReportDetailColor } from 'modo-design/icon';
import React from 'react';
import { getData } from './api';
import ObjAttribute from './pages/obj-attribute';
import ObjAttributeCanvas from './pages/obj-attribute-canvas';
import ObjDetail from './pages/obj-detail';
import ObjInterface from './pages/obj-interface';
import './style/index.less';

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
        // getData('daa49a0818a549c7ae1d52c3fc27c890').then(res => {
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
    handleSave = (callback) => {
        const view = this.viewMapRef.current[this.state.menuKey];
        if (view && typeof view.handleSave === 'function') {
            view.handleSave((...args) => {
                this.getData();
                callback(...args)
            });
        }
    };
    componentDidMount() {
        this.getData();
        if (this.props.onUpdateUseSaveBtn) {
            const shouldEnableSaveBtn = this.state.menuKey === 'overview';
            this.props.onUpdateUseSaveBtn(this.props.obj.id, shouldEnableSaveBtn);          }
    }
    componentDidUpdate(prevProps, prevState) {
        // 当 menuKey 发生变化时，更新 useSaveBtn 状态
        if (prevState.menuKey !== this.state.menuKey) {
            if (this.props.onUpdateUseSaveBtn) {
                this.props.onUpdateUseSaveBtn(this.props.obj.id, true);
                //this.props.onUpdateUseSaveBtn(this.props.obj.id, this.state.menuKey === 'overview'); // 或 false，根据具体需求
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
            obj,
            ontology
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
                                <span className="label-text">{data.objectTypeLabel || obj.objectTypeLabel}</span>
                                <span
                                    className="icon">
                                    <IconCorrectFill/>
                                    <IconRefreshColor/>
                                </span>
                            </div>
                            <div
                                className="name">
                                <span className="name-text">对象实例数：0</span>
                            </div>
                        </div>
                        <div
                            className="menu-list">
                            {[
                                {
                                    icon: <IconGridColor/>,
                                    label: '详情概览',
                                    name: 'overview'
                                },
                                {
                                    icon: <IconReportDetailColor/>,
                                    label: '属性',
                                    name: 'attr'
                                },
                                /*{
                                    icon: <IconDataCatalogMgrColor/>,
                                    label: '数据源',
                                    name: 'ds',
                                    disabled: true
                                }*/

                                ...(obj.interfaceId ? [{
                                    icon: <IconServerNodeColor/>,
                                    label: '接口',
                                    name: 'interface'
                                }] : [])
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
                            <Tabs
                                activeTab={menuKey}
                                destroyOnHide>
                                <TabPane key='overview' title='overview'>
                                    {Object.keys(obj).length > 0 && <ObjDetail
                                        ref={ref => this.viewMapRef.current['overview'] = ref}
                                        obj={obj}
                                        ontology = {ontology}
                                        switchMenuKey={(menuKey, operParams) => {
                                            if (menuKey === 'attr') {
                                                this.setState(() => {
                                                    return {
                                                        menuKey
                                                    }
                                                }, () => {
                                                   /* this.viewMapRef.current['attr'].setState({
                                                        oper: 'create'
                                                    })*/
                                                    /*if (operParams.oper === 'add') {
                                                        this.props.push({
                                                            key: `${obj.id}-attribute-edit`,
                                                            ontology:this.props.ontology,
                                                            title: `${obj.objectTypeLabel}属性映射编辑`,
                                                            view: (
                                                                <ObjAttributeCanvas
                                                                    obj={obj}
                                                                    ref={this.objAttributeCanvasRef}
                                                                    getRef={() => this.objAttributeCanvasRef.current}
                                                                    oper={operParams.oper}
                                                                    onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                                                    />
                                                            )
                                                        })
                                                    }*/

                                                })
                                            }
                                            if (menuKey === 'link') {
                                                this.props.changeTab(menuKey,operParams.oper)
                                            }
                                            if (menuKey === 'action') {
                                                this.props.changeTab(menuKey,operParams.oper)
                                            }

                                        }}/>}
                                </TabPane>
                                <TabPane key='attr' title='attr'>
                                    {/*<ObjAttribute
                                        ontology={this.props.ontology}
                                        ref={ref => this.viewMapRef.current['attr'] = ref}
                                        obj={obj}
                                        push={this.props.push}
                                        onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                        />*/}
                                    <ObjAttributeCanvas
                                        ref={ref => this.viewMapRef.current['attr'] = ref}
                                        getRef={() => this.viewMapRef.current['attr']}
                                        obj={obj}
                                        onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn} />
                                </TabPane>
                                <TabPane key='interface' title='interface'>
                                    {/*<ObjAttribute
                                        ontology={this.props.ontology}
                                        ref={ref => this.viewMapRef.current['attr'] = ref}
                                        obj={obj}
                                        push={this.props.push}
                                        onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                        />*/}
                                    <ObjInterface
                                        ref={ref => this.viewMapRef.current['interface'] = ref}
                                        getRef={() => this.viewMapRef.current['interface']}
                                        obj={{
                                            ...obj,
                                            ...data,
                                            attributes: data.attributes
                                        }}
                                        ontology={ontology}
                                        onUpdateUseSaveBtn={this.props.onUpdateUseSaveBtn}
                                        push={this.props.push}
                                        refresh={this.getData} />
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
