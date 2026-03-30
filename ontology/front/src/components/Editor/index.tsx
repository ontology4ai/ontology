import React, { useState, useEffect, useMemo } from 'react';
import Editor, { loader } from "@monaco-editor/react";
import {Message, Modal, Popover, Select, Spin, Tooltip, Trigger, Menu, Tag} from '@arco-design/web-react';
import { format } from './modules/sql-formatter/lib/index.js';
import {
    IconFullscreen,
    IconFullscreenExit,
    IconDataDevelop,
    IconBrush,
    IconSearch,
    IconSynchronous,
    IconGuide,
    IconHelp,
    IconDatabase,
    IconCopyColor,
    IconPasteColor,
    IconCutColor,
    IconComputerColor,
    IconChronusdbColor,
    IconDifferenceAnalyse
} from "modo-design/icon";
import ResizeObserver from '@arco-design/web-react/es/_util/resizeObserver';
import getAppName from '@/core/src/utils/getAppName';

import './style/index.less';
import {getDataSources,getDatasourceInfo} from './api'
const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;
const Option = Select.Option;
const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? `_resource_` : 'static';
const host=`${window.location.host}/`;
const protocol=`${window.location.protocol}`;
if(rootPath=='_resource_'){
    loader.config({ paths: { vs: `${protocol}//${host}${getAppName()}/${rootPath}/monaco-editor-0.33.0/package/min/vs` } });
}else{
    loader.config({ paths: { vs: `/${rootPath}/monaco-editor-0.33.0/package/min/vs` } });
}
loader.config({ "vs/nls": { availableLanguages: { "*": "zh-cn" } } });
class ModoEditor extends React.Component {
    constructor(props: any) {
        super(props);
        const hasPaste = window.location.hostname === 'localhost';
        this.state = {
            value: `function callback() {}`,
            helpMsg: `xxx \n ccc \n mmmmm`,
            height: 0,
            search: false,
            replace: false,
            format: false,
            fullscreen: false,
            dataSourceModalVisible:false,   //数据源查询弹窗
            dataSourcesList:[],
            datasource:'',
            dsInfoLoading:false,
            infoContents:[],
            contextMenuVisible: false,
            hasSelection: false,
            contextmenus: [
                {
                    icon: <IconCopyColor/>,
                    name: 'editor.action.clipboardCopyAction',
                    label: '复制',
                    keyBind: 'ctrl+F2'
                },
                ...(hasPaste ? [{
                    icon: <IconCopyColor/>,
                    name: 'editor.action.clipboardPasteAction',
                    label: '粘贴',
                    keyBind: 'ctrl+F2'
                }] : []),
                {
                    icon: <IconCutColor/>,
                    name: 'editor.action.clipboardCutAction',
                    label: '剪切',
                    keyBind: 'ctrl+F2'
                },
                // {
                //     icon: <IconComputerColor />,
                //     label: '命令面板',
                //     name: 'editor.action.quickCommand',
                //     keyBind: 'F1'
                // },
                // {
                //     icon: <IconChronusdbColor />,
                //     label: '更改所有匹配项',
                //     name: 'editor.action.changeAll',
                //     keyBind: 'ctrl+F2'
                // },
            ],
            popupStyle: {
                top: 0,
                left: 0
            }
        };
        this.triggerRef = React.createRef();
        this.editorRef = React.createRef();
        this.resizeRef = React.createRef();
        this.parentRef = React.createRef();
        this.indexRef = React.createRef();
    }
    onWrapperResize = (entry) => {
        if (entry && entry.length) {
            const height = this.props.operDisabled ? 0 : 30;
            this.setState({
                height: entry[0].contentRect.height - height + 'px'
            })
        }
    }
    onChange = (value, e) => {
        const { onChange } = this.props;
        onChange && onChange(value, e);
    }
    // 定义一个处理聚焦事件的函数
    handleEditorDidFocus = () => {
        console.log('Editor received focus');
        window.editorFocusKey = this.props.tabKey;
    };
    // 定义一个处理失去焦点事件的函数
    handleEditorDidBlur = () => {
        console.log('Editor lost focus');
        window.editorFocusKey = null;
    };
    handleEditorDidMount = (editor, monaco) => {
        this.editorRef.current = editor;
         // 在编辑器挂载后添加事件监听器
         editor.onDidFocusEditorText(this.handleEditorDidFocus);
         editor.onDidBlurEditorText(this.handleEditorDidBlur);
        if (Array.isArray(this.props.extraActions)) {
            this.props.extraActions.forEach(action => {
                editor.addAction({
                    ...action
                })
            })
        }
        editor.addAction({
            id: 'editor.action.clipboardCutAction',
            label: 'Cut',
            run: () => {
                editor?.focus()
                document.execCommand('cut')
            },
        })
        editor.addAction({
            id: 'editor.action.clipboardCopyAction',
            label: 'Copy',
            run: () => {
                editor?.focus()
                document.execCommand('copy')
            },
        })
        editor.addAction({
            id: 'editor.action.clipboardPasteAction',
            label: 'Paste',
            run: async() => {
                editor?.focus();
                const text = await navigator.clipboard.readText();

                const selection = editor.getSelection();
                if (!selection) {
                    return;
                }

                editor.executeEdits("clipboard", [{
                    range: selection,
                    text: text,
                    forceMoveMarkers: true,
                }]);
            }
        })
        editor.onDidChangeCursorSelection(() => {
            const selection = editor.getSelection();
            this.setState({
                hasSelection: !selection.isEmpty(),
                contextMenuVisible: false
            })
            editor.createContextKey('hasSelection', !selection.isEmpty());
        }); 
        editor.onDidFocusEditorWidget((e) => {  
            this.setState({
                contextMenuVisible: false
            }) 
        });
        editor.onContextMenu((e,) => {
            e.event.preventDefault();
            e.event.stopPropagation();
            this.setState(() => {
                return {
                    contextMenuVisible: true,
                    popupStyle: {
                        top: e?.event?.pos?.y || 0,
                        left: e?.event?.pos?.x || 0
                    }
                }
            }, () => {
            })
        });

        /*let viewZoneId = null;
        editor.changeViewZones((changeAccessor) => {
            this.changeAccessor = changeAccessor;
            var domNode = document.createElement("div");
            domNode.innerHTML = `<div
    class="modo-editor-hint">
    <pre>
select
    *
from
    dacp_meta_tab
</pre>
<div
    class="modo-editor-hint-toolbar">
    <button>接受</button>
    <button>不接受</button>
</div>
</div>`;
            viewZoneId = changeAccessor.addZone({
                afterLineNumber: 3,
                heightInLines: 4,
                domNode: domNode,
            });
        }); */

        /* const language = this.props.language || 'javascript';
        if (language === 'javascript') {
            var libSource = [
                'declare class Facts {',
                '    static next():string',
                '}'
            ].join('\n');
            var libUri = 'ts:filename/facts.d.ts';
            monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
        } else if (language === 'css') {
            const defModel = monaco.editor.createModel(
                `:root {
                    --color-gray-2: gray;
                    --color-red-2: red;
                }`,
                "css"
            );

            editor.setModel(defModel);
        } */

        if (this.props.value) {
            editor.getAction('editor.action.formatDocument').run();
        }
    }
    handleGoToLine = () => {
        const editor = this.editorRef.current
        editor.focus();
        editor.getAction('editor.action.gotoLine').run();
    }
    handleFormat = () => {
         const editor = this.editorRef.current;
        if (this.props.language === 'sql') {
            editor.setValue(
                format(editor.getValue(), {
                    tabWidth: 4,
                    language: 'sql'
                }),
            )
        } else {
            editor.focus();
            editor.getAction('editor.action.formatDocument').run();
        }
    }
    handleSearch = () => {
        const editor = this.editorRef.current
        editor.focus();
        editor.getAction('actions.find').run();
    }
    handleReplace = () => {
        const editor = this.editorRef.current;
        editor.focus();
        editor.getAction('editor.action.startFindReplaceAction').run();
    }
    handleFullScreen = () => {
        const wrapper = this.props.wrapper || document.body;
        this.parentRef.current = this.resizeRef.current.parentNode;
        this.indexRef.current = [...this.parentRef.current.childNodes].indexOf(this.resizeRef.current)
        wrapper.appendChild(this.resizeRef.current);
        this.setState({
            fullscreen: true
        })
    }
    handleFullScreenExit = () => {
        this.parentRef.current.insertBefore(this.resizeRef.current, this.parentRef.current.childNodes[this.indexRef.current]);
        this.setState({
            fullscreen: false
        })
    }
    componentDidUpdate(prevProps, prevState) {
        /* const editor = this.editorRef.current;
        if (editor) {
            console.log(this.props.value, editor.getValue());
        } */
    }
    getDSInfoByDatasource=(datasource:string)=>{
        this.setState({datasource});
        this.setState({infoLoading:true});
        const dsId = this.state.dataSourcesList.find((item) => {
            return item.dsName == datasource;
        })?.dsId;
        getDatasourceInfo({
            dsId,
            dsName: datasource
        }).then((res)=>{
            if(res.data.success){
                this.setState({infoContents:res.data.data})

            }else{
                Message.error(`获取数据源字段描述信息失败,${res.data.message}`)
            }
        }).catch(err=>{
            console.log(err);
            Message.error(`获取数据源字段描述信息失败！`)
        }).finally(()=>{
            this.setState({infoLoading:false});
        })
    }
    componentDidMount() {
        if(this.props.hasDataSourceoper){
            const workspaceId =location.href.includes('/datadev_ide/')? location.pathname.split('/').pop():'';
            getDataSources(workspaceId).then(res=>{
                if(res.data.success && res.data.data){
                    this.setState({dataSourcesList:res.data.data.workspaceDsVoList||[]});
                }
            }).catch((err)=>{
                console.log(err);
                Message.error('查询数据源失败');
            })
        }
    }
    render() {
        const language = this.props.language || 'javascript';
        let classNames = [ 'modo-editor' ];
        if (this.state.fullscreen) {
            classNames.push('fullscreen');
        }
        const {dataSourceModalVisible,datasource,dsInfoLoading,infoContents} = this.state;
        return (
          <>
            <ResizeObserver
                onResize={this.onWrapperResize}>
                <div
                    ref={this.resizeRef}
                    className={classNames.join(' ')}
                    style={{
                        width: this.state.fullscreen ? '100%' : this.props.width,
                        height: this.state.fullscreen ? '100%' : (this.props.height || '200px')
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log(e);
                        const { onClick } = this.props;
                        if (typeof onClick === 'function') {
                            onClick(e);
                        }
                    }}>
                    {
                        this.props.operDisabled ? null :
                        (
                            <div className="modo-editor-header">
                                <div
                                    className="pos-left">
                                    {/*<IconDataDevelop />*/}
                                    {this.props.noFormat ? '' : <Tooltip
                                      content='格式化'>
                                        <IconBrush
                                          onClick={this.handleFormat}/>
                                    </Tooltip>}
                                    <Tooltip
                                        content='搜索'>
                                        <IconSearch
                                            onClick={this.handleSearch}/>
                                    </Tooltip>
                                    <Tooltip
                                        content='替换'>
                                        <IconSynchronous
                                            onClick={this.handleReplace}/>
                                    </Tooltip>
                                    <Tooltip
                                        content='定位到行'>
                                        <IconGuide
                                            onClick={this.handleGoToLine}/>
                                    </Tooltip>
                                    <Popover
                                        title="帮助"
                                        position="rt"
                                        content={
                                            <ModoEditor
                                                width="300px"
                                                height="200px"
                                                value={this.state.helpMsg}
                                                operDisabled/>
                                        }>
                                        <IconHelp />
                                    </Popover>
                                    <Tag
                                        icon={<IconDifferenceAnalyse />}
                                        closable
                                        visible={this.props.diffVisible}
                                        onClose={() => {
                                            const { onDiffVisibleChange } = this.props;
                                            if (typeof onDiffVisibleChange === 'function') {
                                                onDiffVisibleChange(false)
                                            }
                                        }}>
                                        对比选中内容
                                    </Tag>
                                    {this.props.hasDataSourceoper?<Tooltip
                                      content='数据源查询'>
                                        <IconDatabase
                                          onClick={()=>this.setState({dataSourceModalVisible:true})}/>
                                    </Tooltip>:''}

                                </div>
                                <div className="pos-right">
                                    {
                                        !this.state.fullscreen ?
                                        <IconFullscreen
                                            onClick={this.handleFullScreen}/>:
                                        <IconFullscreenExit
                                            onClick={this.handleFullScreenExit}/>
                                    }
                                </div>
                            </div>
                        )
                    }
                    <Trigger
                        ref={this.triggerRef}
                        alignPoint
                        popupVisible={this.state.contextMenuVisible}
                        popupStyle={this.state.popupStyle}
                        trigger='contextMenu'
                        position='bl'
                        onClickOutside={() => {
                            this.setState({
                                contextMenuVisible: false
                            })
                        }}
                        popup={() => {
                            let extraMenus = this.props.extraContextMenus || [];
                            extraMenus = extraMenus.filter(item => {
                                return item.precondition === 'hasSelection' ?  this.state.hasSelection : true
                            })
                            return (
                                <Menu
                                    className="modo-editor-context-menu"
                                    style={{ width: 124 }}
                                    mode='pop'
                                    onClickMenuItem={(key, e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.editorRef.current.focus();
                                        const action = this.editorRef.current.getAction(key);
                                        if (action) {
                                            action.run();
                                        } else {
                                            this.editorRef.current.trigger('source', key)
                                        }
                                        this.setState({
                                            contextMenuVisible: false
                                        })
                                    }}>
                                    {extraMenus.concat(this.state.contextmenus).map(item => {
                                        if (item.children) {
                                            return (
                                                <SubMenu    
                                                    className="modo-editor-context-menu-item"
                                                    key={item.name}
                                                    title={
                                                        <>
                                                          {item.icon}
                                                          {item.label}
                                                        </>
                                                    }>
                                                    {
                                                        item.children.map(child => {
                                                            return (
                                                                <MenuItem
                                                                    className="modo-editor-context-menu-item"
                                                                    key={child.name}>
                                                                    {child.icon}
                                                                    {child.label}
                                                                </MenuItem>
                                                            )
                                                        })
                                                    }
                                                </SubMenu>
                                            )
                                        }
                                        return (
                                            <MenuItem
                                                className="modo-editor-context-menu-item"
                                                key={item.name}>
                                                {item.icon}
                                                {item.label}
                                            </MenuItem>
                                        )
                                    })}
                                </Menu>
                            )
                        }}>
                        {!this.props.diffVisible ? <Editor
                            height={this.state.fullscreen ? '100%' : this.state.height}
                            language={language}
                            value={this.props.value}
                            onChange={this.onChange}
                            onContextMenu={() => {
                                
                            }}
                            options={{
                                contextmenu: false,
                                lineDecorationsWidth: 0,
                                glyphMargin: 0,
                                padding: 0,
                                fontSize: 12,
                                readOnly: this.props.operDisabled,
                                lineNumbers: this.props.lineNumbers,
                                wordWrap: this.props.wordWrap
                            }}
                            onMount={this.handleEditorDidMount}
                        /> : this.props.diff}
                    </Trigger>
                </div>
            </ResizeObserver>
              {this.props.hasDataSourceoper ? <Modal
                title='数据源'
                style={{width:'500px'}}
                footer={null}
                visible={dataSourceModalVisible}
                onOk={() => {
                    this.setState({dataSourceModalVisible: false})
                }}
                onCancel={() => {
                    this.setState({dataSourceModalVisible: false})
                }}
                autoFocus={false}
                focusLock={true}
              >
                 <div className="ds-container">
                     <Select
                       value={datasource}
                       showSearch
                       placeholder='请选择数据源'
                       size='mini'
                       renderFormat={(option, value) => {
                           return value;
                       }}
                       onChange={(val)=>{
                           this.getDSInfoByDatasource(val)
                       }}
                     >
                         {this.state.dataSourcesList?.map((option) => (
                           <Option  key={option.id}  value={option.dsName}>
                               {option.dsName}
                           </Option>
                         ))}
                     </Select>
                     <div className={`example-info-container`}>
                         <Spin loading={dsInfoLoading} style={{display: 'block',minHeight:'100px'}}>
                             {infoContents.map(item => {
                                 return (
                                   <p>
                                       <span className='text-bracket'>{'${'}</span>
                                       {datasource}
                                       <span
                                         className='text-bracket'>.{item.name}</span><span className='text-bracket'>{'}'}</span>：{item.label};
                                   </p>
                                 )
                             })}
                         </Spin>
                     </div>

                 </div>
              </Modal> : ''}

          </>
        );
    }
}

export default ModoEditor;
