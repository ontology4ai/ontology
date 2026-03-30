import React, { useState, useEffect, useMemo } from 'react';
import { createStore } from 'redux';
import { ConfigProvider } from '@arco-design/web-react';
import { Provider } from 'react-redux';
import useClassLocale from '@/utils/useClassLocale';
import { GlobalContext } from '@/utils/context';
import getDefaultLang from '@/utils/getDefaultLang';
import { connect } from 'react-redux';
import langArcoStore from '@/locale/arco-lang';
import rootReducer from './src/store';
import { Skeleton, Spin } from '@arco-design/web-react';
import { IconLoading } from '@arco-design/web-react/icon';
import Visual from './visual';
import initStore from './src/utils/store';
import transform from './src/utils/transform';
import parseView from './src/utils/parseView';
import View from 'packages/modo-view/core/src/components/Widget/utils/View';
import { getApp, getView } from './src/api';

class Designer extends React.Component {
    constructor(props: any) {
        super(props);

        const store = createStore(rootReducer);
        this.store = store;
        this.state = {
            appName: null,
            viewName: null
        };
        window.$editable = true;
    }
    getApp = async() => {
        const {
            appName,
            fileName
        } = this.props.match.params;

        let app = null;

        await getApp(appName)
        .then(res => {
            app = res.data.data;
        }).catch(e => {
            console.log(e);
        });

        this.setState({
            appName: app.name
        });
        this.props.dispatch({
            type: 'SETAPP',
            data: app
        });
        return app;
    };
    getView = async(app) => {
        const {
            appName,
            fileName
        } = this.props.match.params;
        let view = null;
        await getView(appName, fileName)
        .then(res => {
            view = res.data.data;
            if (!view.parameters) {
                this.store.dispatch({
                    type: 'SETVIEWSTATE',
                    data: 'new'
                });
                view.parameters = JSON.stringify([new View('0', '0', '页面')]);
            } else {
                view.parameters = parseView(view, view.parameters, app);
            }
            document.title = view.label;
        }).catch(e => {
            console.log(e);
        });
        this.setState({
            viewName: view.name
        });
        this.props.dispatch({
            type: 'SETVIEW',
            data: view
        });
    };
    componentDidUpdate(prevProps) {
        const {
            appMap,
            viewMap,
            lang
        } = this.props;
        const {
            prevAppMap,
            prevViewMap,
            prevLang
        } = prevProps;
        const {
            appName,
            viewName
        } = this.state;
        const {
            app,
            view
        } = this.store.getState();
        const storeApp = appMap[this.state.appName];
        const storeView = viewMap[this.state.viewName];

        if (!view && storeView) {
            this.store.dispatch({
                type: 'SETNODES',
                data: transform(JSON.parse(storeView.parameters))
            });
            this.store.dispatch({
                type: 'SETVIEW',
                data: storeView
            });
        }

        if (!app && storeApp) {
            this.store.dispatch({
                type: 'SETAPP',
                data: storeApp
            });

            this.store.dispatch({
                type: 'SETAPPLANG',
                data: getDefaultLang(`${storeApp.name}-lang`, (storeApp.extConf && storeApp.extConf.defaultLang))
            });
            this.store.dispatch({
                type: 'SETAPPNAME',
                appName: storeApp.name
            });
            this.store.dispatch({
                type: 'SETTAPEPREFIX',
                prefix: storeApp.tapePrefix
            });
        }

        if (lang !== prevLang) {
            this.store.dispatch({
                type: 'SETLANG',
                data: lang
            });
        }
    }
    async componentDidMount() {
        const app = await this.getApp();
        await this.getView(app);
        if (!this.store.getState().globalStore) {
            await this.store.dispatch({
                type: 'SETGLOBALSTORE',
                store: this.props
            });
        }
    }
    render() {
        const { lang } = this.props;
        return (
            <>
                <ConfigProvider locale={langArcoStore[lang]}>
                    <Provider store={this.store}>
                        <GlobalContext.Provider
                            value={{
                                lang
                            }}>
                            <Visual></Visual>
                        </GlobalContext.Provider>
                    </Provider>
                </ConfigProvider>
            </>
        );
    }
}

export default connect((state, props) => {
    return {
        appMap: state.appMap || (state.globalStore && state.globalStore.appMap),
        viewMap: state.viewMap || (state.globalStore && state.globalStore.viewMap),
        // viewInstMap: state.viewInstMap || (state.globalStore && state.globalStore.viewInstMap),
        globalStore: state.globalStore,
        lang: state.lang || 'zh-CN'
    }
})(Designer);
