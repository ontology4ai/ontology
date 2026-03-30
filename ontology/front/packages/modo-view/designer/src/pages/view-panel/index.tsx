import React, { useState, useEffect, useMemo } from 'react';
import { ConfigProvider } from '@arco-design/web-react';
import { Provider } from 'react-redux';
import useClassLocale from '@/utils/useClassLocale';
import { GlobalContext } from '@/utils/context';
import langArcoStore from '@/locale/arco-lang';

import { ReactSortable } from "react-sortablejs";
import Widget from 'packages/modo-view/core/src/components/Widget';
import { Table } from '@arco-design/web-react';
import { connect } from 'react-redux';
import getViewChildren from 'packages/modo-view/core/src/utils/getViewChildren';
import locale from '@/locale';
import './style/index.less';
require('static/guid.js');

class ViewPanel extends React.Component {
    constructor(props: any) {
        super(props);
        this.$this = {};
    }
    cloneWidget = (item) => {
        const id = guid();
        return {
            id,
            children: [],
            options: {},
            ...item
        };
    };
    set$this = () => {
        this.$this = {
            ...this.$this,
            ...this.props.$this
        }
    };
    get$this = () => {
        return this.$this;
    };
    componentDidUpdate() {
        this.set$this();
    }
    componentDidMount() {
        this.set$this();
    }
    render() {
        const { nodes, editable } = this.props;

        let list = (
            <>
                {nodes.rootIds.map((id: any) => {
                    return <Widget
                        key={id}
                        nodeKey={id}
                        parentNodeKey={null}
                        editable={editable}
                        setParentChild={this.props.setParentChild}
                        deleteParentChild={this.props.deleteParentChild}
                        viewKey={this.props.viewKey}
                        renderKey={this.props.renderKey}
                        get$this={this.get$this}
                        >
                    </Widget>
                })}
            </>
        );
        if (editable) {
            list = (
                 <ReactSortable
                    className="modo-designer-view-canvas"
                    list={nodes.rootIds}
                    setList={list => {
                        this.props.dispatch({
                            type: 'SETROOTIDS',
                            data: list
                        });
                    }}
                    animation={150}
                    group={{ name: "cloning-group-name" }}
                    clone={this.cloneWidget}
                    sort={true}>
                    {list}
                </ReactSortable>
            )
        }
        const { appLang } = this.props;
        return (
            <ConfigProvider locale={langArcoStore[appLang]}>
                <GlobalContext.Provider
                    value={{
                        lang: appLang
                    }}>
                    <div
                        className="modo-designer-view-panel"
                        style={this.props.style}>
                        {list}
                    </div>
                </GlobalContext.Provider>
            </ConfigProvider>
        );
    }
}

export default connect((state, ownProps) => {
    return {
        nodes: state.nodes,
        appLang: state.appLang,
        $this: {
            ...state.store.state,
            ...state.store.action,
            $refs: state.store.$refs,
            datasourceMap: state.store.datasourceMap,
            ...state.store.modelMap,
            modelMap: state.store.modelMap,
            parent: state.store.parent && state.store.parent.props.get$this(),
            getParent: function() {
                return state.store.parent && state.store.parent.props.get$this();
            },
            getChildren: function(key) {
                return getViewChildren(state.store.children, key);
            },
            utils: state.store.utils,
            close: state.store.close,
            appName: state.app.name,
            tapePrefix: state.app.tapePrefix,
            i18n: function(key) {
                let lang = state.lang || 'zh-CN';
                if (/\/modo\/([^\/]+)\/(design|render)\/([^\/]+)/.test(window.location.pathname)) {
                    lang = state.appLang || lang;
                }
                const viewI18n = state.store.i18n[lang] || {};
                const globalI18n = locale[lang] || {};
                return viewI18n[key] || globalI18n[key] || key;
            }
        }
    }
})(ViewPanel);
