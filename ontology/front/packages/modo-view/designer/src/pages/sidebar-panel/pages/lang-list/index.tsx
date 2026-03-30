import React, { useState, useEffect, useMemo } from 'react';
import { Tree, Button, Tabs, Tooltip, Select } from '@arco-design/web-react';
import { IconHelp } from 'modo-design/icon';
import TableForm from '@/components/TableForm';
import { connect } from 'react-redux';
import Editor from '@/components/Editor';
import langOptions from 'packages/modo-platform/app-manager/conf/lang';
import locale from '@/locale';
import './style/index.less';

const TabPane = Tabs.TabPane;
let langMap = {};

for (let item of langOptions) {
    langMap[item.value] = item.label;
}

class LangList extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            model: {
                fields: [
                    {
                        name: 'name',
                        valueType: 'string',
                        defaultValue: '',
                        label: '变量名',
                        type: 'input',
                        options: {
                            rows: 1,
                            autoSize: true
                        }
                    },
                    {
                        name: 'zh',
                        valueType: 'string',
                        defaultValue: '',
                        label: '中文名',
                        type: 'textArea',
                        options: {
                            rows: 1,
                            autoSize: true
                        }
                    },
                    {
                        name: 'en',
                        valueType: 'string',
                        defaultValue: '',
                        label: '英文名',
                        type: 'textArea',
                        options: {
                            rows: 1,
                            autoSize: true
                        }
                    }
                ]
            },
            value: [],
            i18n: {

            }
        }
    }
    getDefaultI18n = () => {
        const langObj = {};
        let langs = this.props.app.extConf.langs || [];
        langs.forEach(lang => {
            langObj[lang] = `{}`;
        });
        return langObj;
    };
    setI18n = (val) => {
        const { view } = this.props;
        const i18n = val || view.options.i18n;
        if (i18n) {
            view.options.i18n = {...i18n};
        } else {
            view.options.i18n = this.getDefaultI18n();
        }
        this.props.dispatch({
            type: 'SETNODE',
            nodeKey: view.id,
            currentNode: view
        });
        let storeI18n = {};
        if (i18n) {
            for (let lang in i18n) {
                try {
                    storeI18n[lang] = JSON.parse(i18n[lang]);
                } catch(e) {
                    storeI18n[lang] = {};
                }
            }
        }

        this.props.dispatch({
            type: 'SETSTORE',
            store: {
                i18n: storeI18n
            }
        });
    };
    componentDidMount() {
        let {
            i18n
        } = this.props;
        if (!i18n) {
            this.setI18n();
        }
    }
    render() {
        const { visible } = this.props;

        let {
            i18n,
        } = this.props;
        i18n = i18n || this.getDefaultI18n();

        let langs = this.props.app.extConf.langs || [];

        return (
            <div
                className="modo-lang-list"
                style={{
                    display: visible ? 'block' : 'none'
                }}>
                <div
                    className="header">
                    多语言文案管理

                    <Tooltip
                        className="global-lang-tooltip"
                        position="rt"
                        trigger="hover"
                        color="var(--color-white)"
                        unmountOnExit={false}
                        content={(
                            <>
                                <div
                                    className="header">
                                    全局多语言文案
                                </div>
                                <Tabs
                                    defaultActiveTab={langs[0]}>
                                    {
                                        langs.map(lang => {
                                            return (
                                                <TabPane
                                                    key={lang}
                                                    title={langMap[lang]}>
                                                    <Editor
                                                        language="json"
                                                        operDisabled={true}
                                                        value={JSON.stringify(locale[lang], null, 4)}
                                                        height="300px"
                                                        onChange={(val) => {
                                                            i18n[lang] = val;
                                                            this.setI18n(i18n);
                                                        }}/>
                                                </TabPane>
                                            )
                                        })
                                    }
                                </Tabs>
                            </>
                        )}>

                        <IconHelp
                            style={{
                                cursor: 'pointer',
                                float: 'right',
                                marginTop: '8px'
                            }}/>
                    </Tooltip>
                    <Select
                        size="mini"
                        className="lang-select"
                        defaultValue={this.props.appLang}
                        placeholder="请选择应用语言"
                        showSearch={{
                            retainInputValue: true
                        }}
                        filterOption={(inputValue, option) =>
                            option.props.value.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0 ||
                            option.props.children.toLowerCase().indexOf(inputValue.toLowerCase()) >= 0
                        }
                        options={langOptions.filter(item => langs.indexOf(item.value) > -1)}
                        onChange={val => {
                            this.props.dispatch({
                                type: 'SETAPPLANG',
                                data: val
                            });
                            localStorage.setItem(`${this.props.app.name}-lang`, val);
                        }}>
                    </Select>
                </div>
                <div
                    className="content">
                    <Tabs
                        defaultActiveTab={langs[0]}>
                        {
                            langs.map(lang => {
                                return (
                                    <TabPane
                                        key={lang}
                                        title={langMap[lang]}>
                                        <Editor
                                            language="json"
                                            value={i18n[lang]}
                                            height="100%"
                                            onChange={(val) => {
                                                i18n[lang] = val;
                                                this.setI18n(i18n);
                                            }}/>
                                    </TabPane>
                                )
                            })
                        }
                    </Tabs>
                    {/*<TableForm
                        value={i18n}
                        model={this.state.model}
                        pagination={false}
                        sortable={false}
                        rowKey="name"
                        operWidth={44}
                        onChange={val => {
                            this.setI18n(val)
                        }}/>*/}
                </div>
            </div>
        );
    }
}

export default connect((state, ownProps) => {
    const view = state.nodes.byId[state.nodes.rootIds[0]];
    return {
        app: state.app,
        view,
        i18n: view.options.i18n,
        appLang: state.appLang
    }
})(LangList);
