import React, { useState, useEffect, useMemo } from 'react';
import { Message, Button} from '@arco-design/web-react';
import Editor from '@/components/Editor';
import SqlMarkdown from '../SqlMarkdown';
import { loader, DiffEditor } from "@monaco-editor/react";
import axios from 'modo-plugin-common/src/core/src/http';
import eventBus from 'modo-plugin-common/src/core/src/utils/modoEventBus';
import aiPng from 'modo-plugin-common/src/components/CopilotBtn/imgs/ai.png';
import getAppName from '@/core/src/utils/getAppName';
import {
    IconCopyColor
} from "modo-design/icon";
const global = require('global');
import './style/index.less';

const env = process.env.NODE_ENV;
const rootPath = env === 'production' ? `_resource_` : 'static';
const host=`${window.location.host}/`;
const protocol=`${window.location.protocol}`;
if (rootPath == '_resource_') {
    loader.config({ paths: { vs: `${protocol}//${host}${getAppName()}/ext${rootPath}/monaco-editor-0.33.0/package/min/vs` } });
} else {
    loader.config({ paths: { vs: `/${rootPath}/monaco-editor-0.33.0/package/min/vs` } });
}
loader.config({ "vs/nls": { availableLanguages: { "*": "zh-cn" } } });
const getCells = function () {
    let graph = mxClient.selectGraph;
    if(!graph) {
      return []
    }
    const { root } = graph.getModel();
    const cells = [];
    const getChildren = function (cell) {
      cells.push(cell);
      if (Array.isArray(cell.children)) {
        for (const value of cell.children) {
          getChildren(value);
        }
      }
    };
    getChildren(root);
    return cells;
  };

class ModoEditor extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            key: new Date().getTime(),
            aiIcon: <div className="ai-btn-small"><img src={aiPng}/></div>,
            diffVisible: false,
            diffOriginText: ``,
            diffText: ``,
            diffRange: null,
            commandMap: {
              'SQL_EXPLAIN': '帮我对选中SQL进行解释',
              'SQL_ANNOTATION': '帮我对选中SQL添加注释',
              'SQL_DEBUG': '帮我对选中SQL进行纠错',
              'SQL_COMPLETION': '帮我对选中SQL进行续写',
              'SQL_OPTIMIZATION': '帮我对选中SQL进行优化',
            }
        };
        this.editorRef = React.createRef();

    }

    handleInsertTextAtPosition = (editor, textToInsert, lineNumber, column) => {
        const model = editor.getModel();
        const currentValue = model.getValue();
        const lines = currentValue.split(/\r\n|\r|\n/);

        // 在指定的行和列插入文本
        lines[lineNumber] = lines[lineNumber].slice(0, column) + textToInsert + lines[lineNumber].slice(column);

        // 重新组合成新的字符串并设置到编辑器模型中
        const newValue = lines.join('\n');
        model.setValue(newValue);
    }
    onChange = (value, e) => {
        const { onChange } = this.props;
        onChange && onChange(value, e);
    }
    execCommand = (type, data) => {
        const $appCopilot = global.parent.$appCopilot || global.$appCopilot;
        if (!$appCopilot) {
            return;
        }
        let relaData = {};
        if(data){
          relaData = data;
        }else if(this.editorRef.current){
          const editor = this.editorRef.current.editorRef.current;
          relaData =  {
              editorKey: this.state.key,
              range: editor.getSelection(),
              text: editor.getModel().getValueInRange(editor.getSelection()),
              fullText: editor.getValue()
          }
        }
        $appCopilot.execCommand(
            type,
            this.state.commandMap[type],
            '正在执行中',
            relaData
        )
        const taskId = new Date().getTime();

        const startEventSource = (taskId) => {
            let answer = '';
            let source = new EventSource('/dmg_copilot/_api/sse/connect/' + taskId);
            $appCopilot.sseSource = source;
            source.addEventListener('message', (event) => {
                let sseData = JSON.parse(event.data);
                answer += sseData.bmAnswer;
                clearTimeout(this.printAni);
                this.printAni = setTimeout(() => {
                    $appCopilot.updateLastMessage({
                        data: answer,
                        type: 'sql-markdown',
                        chatHistoryId: sseData.chatHistoryId,
                    })
                })
                if (sseData.isEnd) {
                  if (!$appCopilot.state.activeHistoryId) {
                    $appCopilot.updateHistoryList();
                  }
                    $appCopilot.endSearching();
                    source.close();
                }
            });

            // 处理连接错误
            source.onerror = (event) => {
                console.error('EventSource error:', event);
                source.close();
                $appCopilot.updateLastMessage({
                    type: 'text',
                    data: '请求失败!',
                    loading: false
                })
                $appCopilot.endSearching();
                Message.warning('请求失败');
            };

            source.addEventListener('close', (event) => {
                console.log('EventSource closed');
                $appCopilot.endSearching();
            });
            return source;
        }

        startEventSource(taskId);
        //  const { messages } = $appCopilot.appCopilot.current.state;
            // let demandWelcomeMsg = messages[0].inputData || [];
            const appExternRef = $appCopilot.appCopilot.current.externRef?.current || {};
            let extern =  {
            }
            let cells =  getCells();
            // debugger;
            if (cells.length > 0) {
                let history:any[] = [];
                cells.forEach((cell:any,index:number) => {
                let modelData = {};
                if(cell?.modelData instanceof Object ) {
                    modelData = cell?.modelData;
                }else{
                    modelData = JSON.parse(cell?.modelData || '{}');
                }
                if (cell.stepInst === "sql") {
                    history.push(
                    {
                        "seq": index,
                        "type": 'sql',
                        "data": {
                        'sql': modelData.sql,
                        "dsName":  modelData.dsName,
                        }
                    }
                    )
                }
                if (cell.stepInst === "crtTab") {
                    history.push(
                    {
                        "seq": index,
                        "type": 'createTab',
                        "data": {
                        'model': modelData.model,
                        "dsName":  modelData.tableName,
                        "xmlId": modelData.modelId
                        }
                    }
                    )
                }
                });
                extern = {
                // "tabs": demandWelcomeMsg.map((it:any)=> it.tabId||it.id),
                tabs: appExternRef.tabs || [],
                "is_published":"0",
                "history": history
                }
            }else{
                extern = {
                "tabs": [],
                "is_published":"0",
                "history":[]
                }
            }
        axios.post(window.location.origin + '/dmg_copilot/api/open/copilotData', {
            conversationId:$appCopilot.state.conversationId,
            taskId,
            userId: global.$identity && global.$identity.userId,
            activePage: window.location.pathname,
            question: this.state.commandMap[type],
            aiRole: $appCopilot.state.activeAiRoleName,
            command: type,
            extern: {
                sql: relaData.text || relaData.fullText,
                ...extern
            },
            source: 'dataos/home'
        },{
          timeout: 180000,
        }).then(function (res) {
          if (res?.data?.success === false){
            $appCopilot.sseSource.close();
            $appCopilot.endSearching();
            Message.warning('请求失败');
            $appCopilot.updateLastMessage({
              type: 'text',
              data: '请求失败!',
              loading: false,
            });
          }
        }).catch(function (e) {
            $appCopilot.sseSource.close();
            $appCopilot.endSearching();
            $appCopilot.updateLastMessage({
              type: 'text',
              data: '请求失败!',
              loading: false,
            });
        });
    }
    registCommand = () => {
        const $appCopilot = global.parent.$appCopilot || global.$appCopilot;
        if (!$appCopilot) {
            return;
        }
        // $appCopilot.updateCommands([]);
        $appCopilot.registCommandType('SQL_EXPLAIN', (data) => {
            this.execCommand('SQL_EXPLAIN', data);
        })
        $appCopilot.registCommandType('SQL_ANNOTATION', (data) => {
            this.execCommand('SQL_ANNOTATION', data);
        })
        $appCopilot.registCommandType('SQL_DEBUG', (data) => {
            this.execCommand('SQL_DEBUG', data);
        })
        $appCopilot.registCommandType('SQL_COMPLETION', (data) => {
            this.execCommand('SQL_COMPLETION', data);
        });
      $appCopilot.registCommandType('SQL_OPTIMIZATION', (data) => {
        execCommand('SQL_OPTIMIZATION', data);
      })

        $appCopilot.registMessageType('sql-markdown', (msg) => {
            const { messages } = $appCopilot.appCopilot.current.state;
            const preMessage = messages[messages.indexOf(msg) - 1];
            // debugger
            return <SqlMarkdown
                content={msg.data}
                originText={preMessage.rela.text}
                range={preMessage.rela.range}
                editorKey={preMessage.rela.editorKey}
                insertVisible={true}
                onDiff={(text, originText, range) => {
                    this.setState({
                        diffVisible: true,
                        diffOriginText: originText,
                        diffRange: range,
                        diffText: text
                    });
                }}
                onInsert={(text) => {
                    try{
                      const editor = this.editorRef.current.editorRef.current;
                      const range = editor.getSelection();
                      this.handleInsertTextAtPosition(editor, text, range.endLineNumber - 1, range.endColumn)
                    }catch(e){
                      // console.log(e)
                    }
                }}
                />
        })
    }
    copilotInit = () => {
        this.registCommand();
    }
    componentDidMount() {
        this.copilotInit();
        eventBus.bind({
            key: this.state.key,
            type: 'sql-deitor',
            method: 'insert-text'
        }, (data) => {
            const editor = this.editorRef.current.editorRef.current;
            const range = editor.getSelection();
            this.handleInsertTextAtPosition(editor, data.text, range.endLineNumber - 1, range.endColumn)
            window.editorFocusKey = null;
            return {};
        })
        eventBus.bind({
            key: this.state.key,
            type: 'sql-deitor',
            method: 'diff-text'
        }, (data) => {
            const { text, originText, range } = data;
            const editor = this.editorRef.current.editorRef.current;
            const selection = editor.getSelection();
            if (selection) {
            const model = editor.getModel();
            const selectedText = model?.getValueInRange(selection);
            console.log('Selected Text:', selectedText);
            this.setState({
                diffVisible: true,
                diffOriginText: selectedText,
                diffRange: range,
                diffText: text
            });
            }
        })
    }
    render() {
        const {
            aiIcon,
            diffVisible
        } = this.state;
        const hasCopilot = global.$identity?.extConf?.hasCopilot && global.$identity?.extConf?.dmg_copilot === '1' ;
        let editorheight =  'calc(100vh - 350px)';
        return (
            <Editor
                ref={this.editorRef}
                {...this.props}
                onClick={() => {
                    this.copilotInit();
                }}
                tabKey={this.state.key}
                height={(editorheight)}
                wordWrap={true}
                wrapper={document.querySelector('.mo-workbench')}
                diffVisible={diffVisible}
                onDiffVisibleChange={visible => {
                    this.setState({
                        diffVisible: visible
                    })
                }}
                extraContextMenus={this.props.language === 'sql' && hasCopilot? [{
                    icon: aiIcon,
                    label: 'Copilot',
                    name: 'copilot',
                    precondition: 'hasSelection',
                    children: [
                        {
                            icon: aiIcon,
                            label: 'SQL解释',
                            name: 'SQL_EXPLAIN',
                            keyBind: '',
                            precondition: 'hasSelection',
                        },
                        {
                            icon: aiIcon,
                            label: 'SQL注释',
                            name: 'SQL_ANNOTATION',
                            keyBind: '',
                            precondition: 'hasSelection',
                        },
                        {
                            icon: aiIcon,
                            label: 'SQL纠错',
                            name: 'sqlrevise',
                            keyBind: '',
                            precondition: 'hasSelection',
                        },
                        {
                            icon: aiIcon,
                            label: 'SQL续写',
                            name: 'SQL_COMPLETION',
                            keyBind: '',
                            precondition: 'hasSelection',
                        },
                      {
                        icon: aiIcon,
                        label: 'SQL优化',
                        name: 'SQL_OPTIMIZATION',
                        keyBind: '',
                        precondition: 'hasSelection',
                      }
                    ]
                }] : []}
                extraActions={this.props.language === 'sql' && hasCopilot ? [
                    {
                        id: 'SQL_EXPLAIN',
                        label: 'SQL解释',
                        keybindings: [],
                        contextMenuGroupId: 'navigation',
                        contextMenuOrder: 1,
                        run: (editor) => {
                            this.execCommand('SQL_EXPLAIN');
                        },
                        precondition: 'hasSelection',
                    },
                    {
                        id: 'SQL_ANNOTATION',
                        label: 'SQL注释',
                        keybindings: [],
                        contextMenuGroupId: 'navigation',
                        contextMenuOrder: 2,
                        run: (editor) => {
                            this.execCommand('SQL_ANNOTATION');
                        },
                        precondition: 'hasSelection',
                    },
                    {
                        id: 'sqlrevise',
                        label: 'SQL纠错',
                        keybindings: [],
                        contextMenuGroupId: 'navigation',
                        contextMenuOrder: 3,
                        run: (editor) => {
                            this.execCommand('SQL_DEBUG');
                        },
                        precondition: 'hasSelection',
                    },
                    {
                        id: 'SQL_COMPLETION',
                        label: 'SQL续写',
                        keybindings: [],
                        contextMenuGroupId: 'navigation',
                        contextMenuOrder: 4,
                        run: (editor) => {
                            this.execCommand('SQL_COMPLETION');
                        },
                        precondition: 'hasSelection',
                    },
                    {
                      id: 'SQL_OPTIMIZATION',
                      label: 'SQL优化',
                      keybindings: [],
                      contextMenuGroupId: 'navigation',
                      contextMenuOrder: 5,
                      run: (editor) => {
                        this.execCommand('SQL_OPTIMIZATION');
                      },
                      // precondition: 'hasSelection',
                    }
                ]:
                []}
                diff={(
                  <div style={{height: 'calc(100% - 31px)'}}>
                    <DiffEditor
                        className="modo-diff-editor"
                        width="100%"
                        height="calc(100% - 35px)"
                        language={this.props.language}
                        original={this.state.diffOriginText}
                        modified={this.state.diffText}
                        onChange={this.onChange}
                        options={{
                            contextmenu: false,
                            lineDecorationsWidth: 0,
                            glyphMargin: 0,
                            padding: 0,
                            fontSize: 12,
                            readOnly: false,
                            lineNumbers: this.props.lineNumbers,
                            wordWrap: true
                        }}/>
                    <div className="diff-editor-button" >
                      <Button type="secondary" size="mini" onClick={()=>{
                        this.setState({
                          diffVisible: false
                        })
                      }}>
                       取消
                      </Button>
                      <Button type="primary" size="mini" onClick={()=>{
                         this.setState({
                          diffVisible: false
                         },()=>{
                          setTimeout(()=>{
                            const editor = this.editorRef.current.editorRef.current;
                            editor.executeEdits("", [{
                               range: this.state.diffRange,
                               text: this.state.diffText,
                               forceMoveMarkers: true,
                            }]);
                          }, 100)
                         })
                      }}>
                      替换
                      </Button>
                    </div>
                  </div>
                )}>
            </Editor>
        );
    }
}

export default ModoEditor;
