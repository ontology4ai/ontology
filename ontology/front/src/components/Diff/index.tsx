import React, { useState, useEffect, useMemo } from 'react';
import Editor, { loader, DiffEditor } from "@monaco-editor/react";
import {
    Tabs,
    Collapse,
    Popover,
    Typography,
    Select,
    Switch,
    Button,
    Drawer,
    Notification,
    Spin,
    Tag as ArcoTag
} from '@arco-design/web-react';

import ModoCodeEditor from '@/components/Editor';

import {
    IconEdit,
    IconFileEditLine,
    IconFullscreen,
    IconFullscreenExit,
    IconDataDevelop,
    IconBrush,
    IconSearch,
    IconSynchronous,
    IconGuide,
    IconHelp,
    IconFactTableFill,
    IconModelFill,
    IconImpactAnalyse,
    IconDifferenceAnalyse,
    IconHelpFill,
    IconErrorFill,
    IconPlusFill,
    IconMinusFill
} from "modo-design/icon";

import {
    Tag
} from 'modo-design';

import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';

import './style/index.less';

import data from './mock/diff.json';
import qs from 'qs';

import {
    getApp,
    getView,
    getModel,
    getTape,
    getViewVersions,
    getViewDiff,
    getModelDiff,
    getTapeDiff,
    updateView,
    updateModel,
    updateTape
} from './api';

const { Title } = Typography;

const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? '_resource_' : 'static';
loader.config({ paths: { vs: `/${rootPath}/monaco-editor-0.33.0/package/min/vs` } });

loader.config({ "vs/nls": { availableLanguages: { "*": "zh-cn" } } });


class ModoEditor extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            loading: true,
            code: '',
            diff: [],
            appName: '',
            objType: '',
            objName: '',
            appLabel: '',
            v1: '',
            v2: '',
            app: {
            },
            obj: {
            },
            versions1: [],
            versions2: [],
            ...this.getParams()
        };

        this.attrMap = {
            model: {
                label: '模型',
                labelAttr: 'doc',
                icon: <IconModelFill/>,
                attrs: [
                    'javaAnnotation',
                    'oneToMany',
                    'oneToOne',
                    'methods',
                    'services',
                    'fields'
                ]
                
            },
            tape: {
                label: '服务',
                labelAttr: 'label',
                icon: <IconImpactAnalyse/>,
                attrs: [
                    'apiInputParams',
                    'apiOutputParams'
                ]
            },
            view: {
                label: '视图',
                labelAttr: 'label',
                icon: <IconFactTableFill/>,
                attrs: [
                    'parameters'
                ]
            }
        }
    }
    componentDidUpdate(prevProps, prevState) {
    }
    getParams = () => {
        const search = qs.parse(window.location.search.split('?')[1]);
        const { params } = this.props.match;
        return {
            appName: params.appName,
            objType: params.objType,
            objName: params.objName,
            v1: search.v1,
            v2: search.v2
        }
    }
    getJson = (data, type) => {
        const { attrs } = this.attrMap[type];
        for (let attr of attrs) {
            try {
                data[attr] = JSON.parse(data[attr]);
            } catch(e) {

            }
        }
    }
    parseJson = (json, type) => {
        const { attrs } = this.attrMap[type];
        for (let attr of attrs) {
            try {
                json[attr] = JSON.stringify(json[attr]);
            } catch(e) {

            }
        }
    }
    updateView = (view) => {
        updateView(this.state.appName, view).then(res => {
            if ( !res.data || (res.data && !res.data.success)) {
                Notification.error({
                    title: '视图',
                    content: `保存失败, ${res.data.message}`,
                })
            } else {
                Notification.success({
                    title: '视图',
                    content: '保存成功！',
                });
                this.setState({
                    visible: false
                });
                this.getView();
            }
        }).catch(err => {
            Notification.error({
                title: '视图',
                content: '保存失败',
            })
        })
    }
    setVisible = (val) => {
        this.setState({
            visible: val
        })
    }
    saveCode = () => {
        let json;
        try {
            const {
                code,
                objType,
                diff
            } = this.state;

            json = JSON.parse(code);
            const origin = diff[1];
            if (origin.id !== json.id) {
                Notification.error({
                    title: '验证失败',
                    content: 'ID不能修改，请修改数据！',
                })
            } else {
                /*dataMap[codeType][codeFileType][codeIndex][1] = {...json};
                this.parseJson(json, this.state.objType);
                if (codeType === 'view') {
                    this.updateView(json);
                }*/
                this.parseJson(json, objType);
                this.updateObj(json);
            }
        } catch(e) {
            console.log(e);
            Notification.error({
                title: '验证失败',
                content: 'json格式错误，请修改数据！',
            })
        }
    }
    updateObj = (obj) => {
        const updateObj = {
            'view': updateView,
            'model': updateModel,
            'tape': updateTape
        }
        const {
            objType,
            appName,
            objName
        } = this.getParams();
        updateObj[objType](appName, obj).then(res => {
            if (res.data && res.data.success) {
                Notification.success({
                    title: this.attrMap[objType].label,
                    content: '更新成功！',
                });
                this.getObjDiff(obj);
                this.setVisible(false);
            } else {
                throw '更新失败';
            }
        }).catch(err => {
            Notification.error({
                title: this.attrMap[objType].label,
                content: '更新失败！',
            });
            this.setVisible(false);
        })
    }
    getObjDiff = (obj) => {
        this.setState({
            loading: true
        })
        const {
            objType,
            appName,
            objName,
            v1,
            v2
        } = this.getParams();
        const getObjDiff = {
            'view': getViewDiff,
            'model': getModelDiff,
            'tape': getTapeDiff
        }
        getObjDiff[objType](appName, obj.id, v1, v2).then(res => {
            if (res.data) {
                const { data } = res.data;
                if (Array.isArray(data) && data[0] && data[1]) {
                    this.getJson(data[0], objType);
                    this.getJson(data[1], objType)
                    this.setState({
                        diff: data,
                        original: JSON.stringify(data[0], null, 4),
                        modified: JSON.stringify(data[1], null, 4)
                    });
                    document.title = `${data[0].appLabel}-${data[0][this.attrMap[this.state.objType].labelAttr]}版本对比`;
                    this.setState({
                        loading: false
                    })
                }
                throw '数据错误'
            } else {
                throw '请求失败'
            }
        }).catch(err => {
            console.log(err);
            this.setState({
                loading: false
            })
        })
    }
    getObjVersions = (objId, version, versionInfo, type) => {
        const {
            objType,
            appName,
            objName,
            v1,
            v2
        } = this.getParams();
        getViewVersions(
            appName,
            objType,
            objId,
            version,
            versionInfo
        ).then(res => {
            const o = {};
            o[type] = res.data.data.content.map(v => {
                return {
                    value: v.rev,
                    label: v.versionInfo || v.rev
                }
            })
            o[type].unshift({
                value: '-1',
                label: '当前版本'
            })
            this.setState(o);
        }).catch(err => {
            console.log(err);
        })
    }
    getObj = () => {
        this.setState({
            loading: true
        })
        const getObj = {
            'view': getView,
            'model': getModel,
            'tape': getTape
        };
        const {
            objType,
            appName,
            objName,
            v1,
            v2
        } = this.getParams();
        getObj[objType](appName, objName).then(res => {
            if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
                this.setState({
                    obj: res.data.data[0]
                });
                this.getObjDiff(res.data.data[0]);
                this.getObjVersions(res.data.data[0].id, v1, '', 'versions1');
                this.getObjVersions(res.data.data[0].id, v2, '', 'versions2')
            }
        })
    }
    init() {
    }
    componentDidMount() {
        getApp(this.state.appName).then(res => {
            if (res.data && res.data.data) {
                this.setState({
                    app: res.data.data
                });
            }
        }).catch(err => {

        })
        this.getObj();

    }
    render() {
        const {
            app,
            obj,
            original,
            modified,
            loading
        } = this.state;
        const options = {
            readOnly: true,
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always'
        };
        const typeInfo = this.attrMap[this.state.objType];
        return (
            <div className="modo-diff">
                <div
                    className="header">
                    <div className="title">
                        {`${app.label || ''}-${obj[typeInfo.labelAttr] || ''}-${typeInfo.label}版本对比`}
                    </div>
                    <div className="oper-group">
                        <span
                            className="label">
                            历史版本
                        </span>
                        <Select
                            size="mini"
                            value={this.state.v1}
                            options={this.state.versions1}
                            showSearch
                            filterOption={false}
                            onChange={val => {
                                const url = `${this.props.match.url}?&v1=${val}&v2=${this.state.v2}`;
                                this.setState({
                                    v1: val
                                });
                                setTimeout(() => {
                                    this.props.history.push(url);
                                    this.getObj();
                                })
                            }}
                            onSearch={(inputValue) => {
                                this.getObjVersions(this.state.obj.id, this.state.v1, inputValue, 'versions1');
                            }}/>
                        <span
                            className="label">
                            当前版本
                        </span>
                        <Select
                            size="mini"
                            value={this.state.v2}
                            options={this.state.versions2}
                            showSearch
                            filterOption={false}
                            onChange={val => {
                                const url = `${this.props.match.url}?&v1=${this.state.v1}&v2=${val}`;
                                this.setState({
                                    v2: val
                                });
                                setTimeout(() => {
                                    this.props.history.push(url);
                                    this.getObj();
                                })
                            }}
                            onSearch={(inputValue) => {
                                this.getObjVersions(this.state.obj.id, this.state.v2, inputValue, 'versions2');
                            }}/>
                        {this.state.v2 === '-1' && <Button
                            size="mini"
                            onClick={() => {
                                this.setState({
                                    visible: true,
                                    code: this.state.modified
                                })
                            }}>
                            编辑
                        </Button>}
                    </div>
                </div>
                <div
                    className="content">
                    <Spin
                        loading={loading}
                        style={{ display: 'block' }}>
                        <div
                            className="diff-editor">
                            <DiffEditor
                                width="100%"
                                height="100%"
                                language="json"
                                original={original}
                                modified={modified}
                                options={options}/>
                        </div> 
                    </Spin>
                </div>                                                
                <Drawer
                    width="50%"
                    className="diff-drawer"
                    headerStyle={{
                        height: '42px'
                    }}
                    title={(
                        <span>
                            {typeInfo && typeInfo.label}编辑
                        </span>
                    )}
                    visible={this.state.visible}
                    onOk={() => {
                        this.saveCode();
                    }}
                    onCancel={() => {
                        this.setVisible(false);
                    }}>
                    <ModoCodeEditor
                        height="100%"
                        value={this.state.code}
                        language="json"
                        onChange={(code) => {
                            this.setState({
                                code
                            });
                        }}/>
                  </Drawer>
            </div>
        );
    }
}

export default ModoEditor;
