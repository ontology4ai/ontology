import React, { useState, useEffect, useMemo } from 'react';
import Editor, { loader, DiffEditor } from "@monaco-editor/react";
import {
    Tabs,
    Collapse,
    Popover,
    Tooltip,
    Typography,
    Select,
    Switch,
    Button,
    Drawer,
    Notification,
    Spin,
    Checkbox,
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
    IconMinusFill,
    IconSwapDown
} from "modo-design/icon";

import {
    Tag
} from 'modo-design';

import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';

import './style/index.less';

import qs from 'qs';

import {
    getApp,
    getDiff,
    updateModel,
    updateTape,
    updateView,
    download,
    getSelectVersions
} from './api';

const { Title } = Typography;

const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? '_resource_' : 'static';
loader.config({ paths: { vs: `/${rootPath}/monaco-editor-0.33.0/package/min/vs` } });

loader.config({ "vs/nls": { availableLanguages: { "*": "zh-cn" } } });


class ModoEditor extends React.Component {
    constructor(props: any) {
        super(props);
        const search = qs.parse(window.location.search.split('?')[1]);
        this.state = {
            // dataMap: data.data,
            dataMap: {
                view: null,
                model: null,
                tape: null
            },
            loadingMap: {
                view: false,
                model: true,
                tape: false
            },
            checkAll: {
                model: false,
                tape: false,
                view: false
            },
            indeterminate: {
                model: false,
                tape: false,
                view: false
            },
            check: {
                model: {},
                tape: {},
                view: {}
            },
            activeTabKey: 'model',
            visible: false,
            code: '',
            codeFileType: null,
            codeIndex: -1,
            codeType: null,
            statusMap: {},
            versions1: [],
            versions2: [],
            appName: props.match.params.appName,
            appLabel: '',
            v1: search.v1,
            v2: search.v2
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
    getParams = () => {
        const search = qs.parse(window.location.search.split('?')[1]);
        return search;
    }
    componentDidUpdate(prevProps, prevState) {
        /* const editor = this.editorRef.current;
        if (editor) {
            console.log(this.props.value, editor.getValue());
        } */
    }
    getVersions1 = async (version, commitMessage) => {
        try {
            const res = await getSelectVersions(this.state.appName, version || '', commitMessage || '');
            if (res.data.data) {
                const versions1 = [{
                    appVersion: '-1',
                    commitMessage: '当前版本'
                }].concat(res.data.data.content);
                this.setState({
                    versions1
                });
            }
        } catch (err) {
            console.log(err);
        }
    }
    getVersions2 = async (version, commitMessage) => {
        try {
            const res = await getSelectVersions(this.state.appName, version || '', commitMessage || '');
            if (res.data.data) {
                const versions2 = [{
                    appVersion: '-1',
                    commitMessage: '当前版本'
                }].concat(res.data.data.content);
                this.setState({
                    versions2
                });
            }
        } catch (err) {
            console.log(err);
        }
    }
    getJson = (data1, data2, type) => {
        const { attrs } = this.attrMap[type];
        for (let attr of attrs) {
            try {
                data1[attr] = JSON.parse(data1[attr]);
            } catch(e) {

            }
            try {
                data2[attr] = JSON.parse(data2[attr]);
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
    setVisible = (val) => {
        this.setState({
            visible: val
        });
    }
    getApp = () => {
        getApp(this.state.appName).then(res => {
            if (res.data.data) {
                const { label } = res.data.data;
                this.setState({
                    appLabel: label
                });
                document.title = `${label}-版本对比`
            }
        }).catch(err => {

        })
    }
    setObjTypeLoading = (objType, val) => {
        let diffLoading = {};
        diffLoading[objType] = val;
        this.setState({
            loadingMap: {
                ...this.state.loadingMap,
                ...diffLoading
            }
        });
    }
    getDiff = (objType) => {
        this.setObjTypeLoading(objType, true);
        const params = this.getParams();
        getDiff(this.state.appName, objType, params.v1, params.v2).then(res => {
            let diff = {};
            diff[objType] = res.data.data;
            if (diff) {
                this.setState({
                    dataMap: {
                       ...this.state.dataMap,
                       ...diff
                    }
                });
                setTimeout(() => {
                    this.setObjTypeLoading(objType, false);
                }, 500)
            } else {
                throw '获取失败';
                
            }
            
        }).catch(err => {
            setTimeout(() => {
                this.setObjTypeLoading(objType, false);
            }, 500)
        })
    }
    updateObj = (type, obj) => {
        const updateObj = {
            view: updateView,
            tape: updateTape,
            model: updateModel
        }
        updateObj[type](this.state.appName, obj).then(res => {
            if ( !res.data || (res.data && !res.data.success)) {
                Notification.error({
                    title: this.attrMap[type].label,
                    content: `保存失败, ${res.data.message}`,
                })
            } else {
                Notification.success({
                    title: this.attrMap[type].label,
                    content: '保存成功！',
                });
                this.setState({
                    visible: false
                });
                this.getDiff(type);
            }
        }).catch(err => {
            console.log(err);
            Notification.error({
                title: this.attrMap[type].label,
                content: '保存失败',
            })
        })
    }
    saveCode = () => {
        let json;
        try {
            const {
                code,
                codeIndex,
                codeFileType,
                codeType,
                dataMap
            } = this.state;

            json = JSON.parse(code);
            const origin = dataMap[codeType][codeFileType][codeIndex][1];
            if (origin.id !== json.id) {
                Notification.error({
                    title: '验证失败',
                    content: 'ID不能修改，请修改数据！',
                })
            } else {
                this.parseJson(json, codeType);
                this.updateObj(codeType, json);
            }
        } catch(e) {
            console.log(e);
            Notification.error({
                title: '验证失败',
                content: 'json格式错误，请修改数据！',
            })
        }
    }
    handleDownload = () => {
        const {
            model,
            tape,
            view
        } = this.state.check;

        let modelIds = [];
        for (let id in model) {
            if (model[id]) {
                modelIds.push(id);
            }
        }

        let tapeIds = [];
        for (let id in tape) {
            if (tape[id]) {
                tapeIds.push(id);
            }
        }

        let viewIds = [];
        for (let id in view) {
            if (view[id]) {
                viewIds.push(id);
            }
        }
        download({
            appName: this.state.appName,
            model: modelIds,
            view: viewIds,
            tape: tapeIds
        }).then(res => {
            const fileName = `${this.state.appName}_diff.zip`;
            if (window.navigator.msSaveOrOpenBlob) {
                navigator.msSaveBlob(blob, fileName);
            } else {
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(res.data);
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(link.href);
            }
        });
    }
    init() {
        this.getApp();
        this.getDiff('model');
        this.getDiff('tape');
        this.getDiff('view');
        this.getVersions1(this.state.v1, '');
        this.getVersions2(this.state.v2, '');
    }
    componentDidMount() {
        this.init();
    }
    render() {
        const dataMap = this.state.dataMap;
        const types = ['model', 'tape', 'view'];
        // const types = ['view'];
        const fileTypes = ['modified', 'added', 'deleted']
        // const fileTypes = ['modified']

        const options = {
            readOnly: true,
            folding: true,
            // foldingStrategy: 'indentation',
            showFoldingControls: 'always'
        };
        const customStyle = {
            padding: '10px'
        };
        const typeInfo = this.attrMap[this.state.codeType];
        //.getLineChanges()
        const {
            versions1,
            versions2
        } = this.state;
        return (
            <div
                className="modo-app-diff"
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    boxSizing: 'border-box'
                }}>
                <Tabs
                    defaultActiveTab={this.state.activeTabKey}
                    onClickTab={key => {
                        if (!this.state.dataMap[key]) {
                            this.getDiff(key);
                        }
                        this.setState({
                            activeTabKey: key
                        })
                    }}
                    renderTabHeader={(props, DefaultTabHeader) => {
                        return (
                            <div
                                className="modo-tab-header">
                                <div
                                    className="title">
                                    <IconDifferenceAnalyse
                                        style={{ marginRight: 4 }}/>
                                    {this.state.appLabel}应用-版本对比
                                </div>
                                <DefaultTabHeader
                                    {...props}
                                    style={{
                                    }}
                                />
                                <div
                                    className="label">
                                    历史版本:
                                </div>
                                <Select
                                    size="small"
                                    showSearch
                                    filterOption={false}
                                    value={this.state.v1}
                                    options={versions1.map(version => {
                                        return {
                                            value: version.appVersion,
                                            label: version.commitMessage
                                        }
                                    })}
                                    onChange={(val) => {
                                        const url = `${this.props.match.url}?v1=${val || -1}&v2=${this.state.v2 || -1}`;
                                        this.setObjTypeLoading(this.state.activeTabKey, true);
                                        setTimeout(() => {
                                            this.setState({
                                                v1: val,
                                                dataMap: {
                                                    model: null,
                                                    tape: null,
                                                    view: null
                                                },
                                                checkAll: {
                                                    model: false,
                                                    tape: false,
                                                    view: false
                                                },
                                                indeterminate: {
                                                    model: false,
                                                    tape: false,
                                                    view: false
                                                },
                                                check: {
                                                    model: {},
                                                    tape: {},
                                                    view: {}
                                                },
                                                statusMap: {}
                                            });
                                            setTimeout(() => {
                                                this.props.history.push(url);
                                                this.init();
                                            })
                                        })
                                    }}
                                    onSearch={(inputValue) => {
                                        this.getVersions1('', inputValue);
                                    }}>
                                </Select>
                                <div
                                    className="label"
                                    style={{
                                        marginLeft: '10px'
                                    }}>
                                    当前版本:
                                </div>
                                <Select
                                    size="small"
                                    showSearch
                                    disabled
                                    filterOption={false}
                                    value={this.state.v2}
                                    options={versions2.map(version => {
                                        return {
                                            value: version.appVersion,
                                            label: version.commitMessage
                                        }
                                    })}
                                    onChange={(val) => {
                                        const url = `${this.props.match.url}?appName=${this.state.appName}&v1=${this.state.v1 || -1}&v2=${val  || -1}`;
                                        this.setObjTypeLoading(this.state.activeTabKey, true);
                                        setTimeout(() => {
                                            this.setState({
                                                v2: val,
                                                dataMap: {
                                                    model: null,
                                                    tape: null,
                                                    view: null
                                                },
                                                checkAll: {
                                                    model: false,
                                                    tape: false,
                                                    view: false
                                                },
                                                indeterminate: {
                                                    model: false,
                                                    tape: false,
                                                    view: false
                                                },
                                                check: {
                                                    model: {},
                                                    tape: {},
                                                    view: {}
                                                }
                                            });
                                            setTimeout(() => {
                                                this.props.history.push(url);
                                                this.init();
                                            })
                                        })
                                        
                                    }}
                                    onSearch={(inputValue) => {
                                        this.getVersions2('', inputValue);
                                    }}>
                                </Select>
                                <Tooltip
                                    content="下载已选增量文件包">
                                    <Button
                                        style={{
                                            marginLeft: '10px',
                                            marginTop: '6.5px'
                                        }}
                                        onClick={() => {
                                            this.handleDownload();
                                        }}
                                        icon={<IconSwapDown />}>
                                    </Button>
                                </Tooltip>
                            </div>
                        );
                    }}>
                    {
                        types.map(type => {
                            let defaultActiveKey = [];
                            if (this.state.dataMap[type]) {
                                fileTypes.forEach(fileType => {
                                    defaultActiveKey = defaultActiveKey.concat(this.state.dataMap[type][fileType].map(file => {
                                        return file[0] ? file[0].id : file[1].id;
                                    }))
                                })
                            }
                            let total = 0;
                            fileTypes.forEach((fileType, fileTypeIndex) => {
                                if (dataMap[type]) {
                                    const files = dataMap[type][fileType];
                                    total += files.length;
                                }
                            });
                            const objMap = this.state.dataMap[type];
                            let num = 0;
                            if (objMap) {
                                num = objMap.addedCnt + objMap.deletedCnt + objMap.modifiedCnt;
                            }
                            return (
                                <Tabs.TabPane
                                    key={type}
                                    title={(
                                        <>
                                            <Checkbox
                                                checked={this.state.checkAll[type]}
                                                indeterminate={this.state.indeterminate[type]}
                                                onChange={(val) => {
                                                    let checkAllObj = {};
                                                    checkAllObj[type] = val;
                                                    let indeterminate = {};
                                                    indeterminate[type] = false;
                                                    let checkObj = {};
                                                    checkObj[type] = {};
                                                    let ids = [];
                                                    if (objMap) {
                                                        fileTypes.forEach(fileType => {
                                                            objMap[fileType].forEach(arr => {
                                                                const file = arr[0] || arr[1];
                                                                ids.push(file.id);
                                                                checkObj[type][file.id] = val;
                                                            })
                                                        });
                                                    }
                                                    this.setState({
                                                        indeterminate: {
                                                            ...this.state.indeterminate,
                                                            ...indeterminate
                                                        },
                                                        checkAll: {
                                                            ...this.state.checkAll,
                                                            ...checkAllObj
                                                        },
                                                        check: {
                                                            ...this.state.check,
                                                            ...checkObj
                                                        }
                                                    });
                                                }}>
                                            </Checkbox>
                                            {this.attrMap[type].icon}
                                            <span style={{ marginLeft: 4 }}>
                                                {this.attrMap[type].label}
                                            </span>
                                            <span
                                                className={"num " + (num === 0 ? 'disabled' : '')}>
                                                {num}
                                            </span>
                                        </>
                                    )}>
                                    <Spin
                                        loading={this.state.loadingMap[type] && this.state.activeTabKey === type}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            height: '100%'
                                        }}>
                                        {
                                            this.state.dataMap[type] ? (
                                                <>
                                                    <div
                                                        className="collapse-top"
                                                        style={{
                                                            padding: '10px 12px'
                                                        }}>
                                                        <Typography.Text
                                                            type='primary'
                                                            style={{
                                                                marginRight: '10px'
                                                            }}>
                                                            变更文件：
                                                            {this.state.dataMap[type].modifiedCnt}
                                                        </Typography.Text>
                                                        <Typography.Text
                                                            type='success'
                                                            style={{
                                                                marginRight: '10px'
                                                            }}>
                                                            新增文件：
                                                            {this.state.dataMap[type].addedCnt}
                                                        </Typography.Text>
                                                        <Typography.Text
                                                            type='error'>
                                                            删除文件：
                                                            {this.state.dataMap[type].deletedCnt}
                                                        </Typography.Text>
                                                    </div>
                                                    {total > 0 && <Collapse
                                                        defaultActiveKey={defaultActiveKey}
                                                        style={{
                                                            width: 'calc(100% - 26px)',
                                                            margin: '0px 12px'
                                                        }}>
                                                        {
                                                            fileTypes.map((fileType, fileTypeIndex) => {
                                                                const files = dataMap[type][fileType];
                                                                return files.map((file, index) => {
                                                                    this.getJson(file[0], file[1], type);
                                                                    let code1 = '';
                                                                    let code2 = '';
                                                                    const currentFile = file[0] || file[1];
                                                                    if (fileType === 'modified') {
                                                                        code1 = JSON.stringify(file[0], null, 4);
                                                                        code2 = JSON.stringify(file[1], null, 4);
                                                                    } else if (fileType === 'added') {
                                                                        code2 = JSON.stringify(file[1], null, 4);
                                                                    } else {
                                                                        code1 = JSON.stringify(file[0], null, 4);
                                                                    }
                                                                    return (
                                                                        <Collapse.Item
                                                                            contentStyle={customStyle}
                                                                            key={currentFile.id}
                                                                            header={(
                                                                                <>
                                                                                    <Checkbox
                                                                                        checked={this.state.check[type][currentFile.id]}
                                                                                        onChange={(val) => {
                                                                                            let checkObj = {};
                                                                                            checkObj[type] = {};
                                                                                            if (objMap) {
                                                                                                fileTypes.forEach(fileType => {
                                                                                                    objMap[fileType].forEach(arr => {
                                                                                                        const file = arr[0] || arr[1];
                                                                                                        checkObj[type][file.id] = this.state.check[type][file.id];
                                                                                                    })
                                                                                                });
                                                                                            }
                                                                                            checkObj[type][currentFile.id] = val;
                                                                                            let checkAll = {};
                                                                                            checkAll[type] = true;
                                                                                            let indeterminate = {};
                                                                                            indeterminate[type] = false;
                                                                                            for (let key in checkObj[type]) {
                                                                                                if (!checkObj[type][key]) {
                                                                                                    checkAll[type] = false;
                                                                                                }
                                                                                                if (checkObj[type][key]) {
                                                                                                    indeterminate[type] = true;
                                                                                                }
                                                                                            }
                                                                                            if (checkAll[type]) {
                                                                                                indeterminate[type] = false;
                                                                                            }
                                                                                            this.setState({
                                                                                                checkAll: {
                                                                                                    ...this.state.checkAll,
                                                                                                    ...checkAll
                                                                                                },
                                                                                                indeterminate: {
                                                                                                    ...this.state.indeterminate,
                                                                                                    ...indeterminate
                                                                                                },
                                                                                                check: {
                                                                                                    ...this.state.check,
                                                                                                    ...checkObj
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                        }}>
                                                                                    </Checkbox>
                                                                                    { fileTypeIndex === 0 && <IconFileEditLine
                                                                                        style={{
                                                                                            color: 'var(--color-arcoblue-6)'
                                                                                        }}/>
                                                                                    }
                                                                                    { fileTypeIndex === 1 && <IconPlusFill
                                                                                        style={{
                                                                                            color: 'var(--color-green-6)'
                                                                                        }}/>
                                                                                    }
                                                                                    { fileTypeIndex === 2 && <IconMinusFill
                                                                                        style={{
                                                                                            color: 'var(--color-red-6)'
                                                                                        }}/>
                                                                                    }
                                                                                    <span
                                                                                        style={{
                                                                                            marginLeft: '4px'
                                                                                        }}>
                                                                                        { currentFile[this.attrMap[type].labelAttr] }
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                            name={currentFile.id}
                                                                            extra={(
                                                                                <div
                                                                                    className="collapse-extra">
                                                                                    <ArcoTag
                                                                                        checkable
                                                                                        checked={this.state.statusMap[currentFile.id]}
                                                                                        color="arcoblue"
                                                                                        onCheck={(val) => {
                                                                                            let checkObj = {};
                                                                                            checkObj[currentFile.id] = val;
                                                                                            this.setState({
                                                                                                statusMap: {
                                                                                                    ...this.state.statusMap,
                                                                                                    ...checkObj
                                                                                                }
                                                                                            })
                                                                                        }}>
                                                                                        {this.state.statusMap[currentFile.id] ? '已确认' : '未确认'}
                                                                                    </ArcoTag>
                                                                                    { this.state.v2 === '-1' && <Button
                                                                                        size="mini"
                                                                                        type='secondary'
                                                                                        onClick={() => {
                                                                                            this.setState({
                                                                                                code: code2,
                                                                                                codeIndex: index,
                                                                                                codeFileType: fileType,
                                                                                                codeType: type,
                                                                                                visible: true
                                                                                            })
                                                                                        }}>
                                                                                        编辑
                                                                                    </Button> }
                                                                                </div>
                                                                            )}>
                                                                            <div
                                                                                className="diff-editor"
                                                                                style={{
                                                                                    marginBottom: '10px',
                                                                                    border: '1px solid var(--border-color-base)'
                                                                                }}>
                                                                                <DiffEditor
                                                                                    width="100%"
                                                                                    height="400px"
                                                                                    language="json"
                                                                                    original={code1}
                                                                                    modified={code2}
                                                                                    options={options}/>
                                                                            </div>
                                                                        </Collapse.Item>
                                                                    )
                                                                })
                                                            })
                                                        }
                                                    </Collapse>}
                                                </>
                                            ): <div
                                                style={{width: '100%', height: '100%'}}>
                                            </div>
                                        }
                                    </Spin>
                                </Tabs.TabPane>
                            )
                        })
                    }
                </Tabs>
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
