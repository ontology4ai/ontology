import React, { useState, useEffect, useMemo } from 'react';
import { createStore } from 'redux';
import { ConfigProvider } from '@arco-design/web-react';
import { Provider } from 'react-redux';
import useClassLocale from '@/utils/useClassLocale';
import { GlobalContext } from '@/utils/context';
import getDefaultLang from '@/utils/getDefaultLang';
import { connect } from 'react-redux';
import langArcoStore from '@/locale/arco-lang';
import rootReducer from 'packages/modo-view/designer/src/store';
import { Spin } from '@arco-design/web-react';
import { IconLoading } from '@arco-design/web-react/icon';
import Visual from './visual';
import initStore from 'packages/modo-view/designer/src/utils/store';
import transform from 'packages/modo-view/designer/src/utils/transform';
import parseView from 'packages/modo-view/designer/src/utils/parseView';
import View from 'packages/modo-view/core/src/components/Widget/utils/View';
import { getApp, getView } from 'packages/modo-view/designer/src/api';

class Renderer extends React.Component {
    constructor(props: any) {
        super(props);

        const store = createStore(rootReducer);
        store.subscribe(() =>{
            // console.log('change-store', store.getState());
        });
        this.store = store;
        this.state = {
            appName: null,
            viewName: null,
            status: '1',
        }
    }
     getApp = async(appName, fileName) => {
        let app = null;

        await getApp(appName)
        .then(res => {
            if (res.data.data) {
                app = res.data.data;
            } else {
                this.setState({
                    status: '0'
                })
            }
        }).catch(e => {
            console.log(e);
        });

        if (app) {
            this.setState({
                appName: app.name
            });
            if (this.props.globalStore) {
                this.props.globalStore.dispatch({
                    type: 'SETAPP',
                    data: app
                });
            } else {
                this.props.dispatch({
                    type: 'SETAPP',
                    data: app
                });
            }
        }
        return app;
    };
    getView = async(appName, fileName, app) => {
        if (!app) {
            return;
        }
        let view = null;
        await getView(appName, fileName)
        .then(res => {
            view = res.data.data;
            if (view) {
                if (!view.parameters) {
                    view.parameters = JSON.stringify([new View('0', '0', '页面')]);
                } else {
                    view.parameters = parseView(view, view.parameters, app);
                }
                if (!this.props.parentViewKey) {
                    document.title = view.label;
                }
            } else {
                this.setState({
                    status: '0'
                })
            }
        }).catch(e => {
            console.log(e);
        });
        if (view) {
            this.setState({
                viewName: view.name
            });
            if (this.props.globalStore) {
                this.props.globalStore.dispatch({
                    type: 'SETVIEW',
                    data: view
                });
            } else {
                this.props.dispatch({
                    type: 'SETVIEW',
                    data: view
                });
            }
        }
    };
    setParentChild = (view, viewKey) => {
        this.props.dispatch({
            type: 'SETCHILD',
            data: {
                key: viewKey,
                view
            }
        })
    };
    deleteParentChild = (view, viewKey) => {
        this.props.dispatch({
            type: 'DELETECHILD',
            data: {
                key: viewKey,
                view
            }
        })
    };
    componentDidUpdate(prevProps) {


        this.store.dispatch({
            type: 'SETGLOBALSTORE',
            store: this.props.globalStore || this.props
        });

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
        if (this.props.location && this.props.location.state) {
            this.store.dispatch({
                type: 'SETPARAMS',
                data: this.props.location.state
            })
        }
        if (this.props.params) {
            this.store.dispatch({
                type: 'SETPARAMS',
                data: this.props.params
            })
        }
        if (this.props.close) {
            this.store.dispatch({
                type: 'SETCLOSE',
                method: this.props.close
            })
        }
        if (lang !== prevLang) {
            this.store.dispatch({
                type: 'SETLANG',
                data: lang
            });
            if (window.location.href.indexOf('/frame/') > -1) {
                this.store.dispatch({
                    type: 'SETAPPLANG',
                    data: lang
                });
            }
        }
    }
    async componentDidMount() {
        let {
            appName,
            fileName
        } = (this.props.match && this.props.match.params) || this.props;
        if (this.props.state && this.props.state.fileName) {
            fileName = this.props.state.fileName;
            appName = this.props.state.appName || appName;
        }
        const currentAppName = this.props.appName || appName;
        const currentViewName = (this.props.fileName && this.props.fileName.split('.')[0]) || fileName.split('.')[0];
        const {
            appMap,
            viewMap
        } = this.props;
        let app = appMap[currentAppName];
        if (appMap && appMap[currentAppName]) {
            this.setState({
                appName: currentAppName
            })
        } else {
            app =  await this.getApp(appName, fileName);
        }
        if (viewMap && viewMap[currentViewName]) {
            this.setState({
                viewName: currentViewName
            })
        } else {
            await this.getView(appName, fileName, app);
        }
        this.store.dispatch({
            type: 'SETGLOBALSTORE',
            store: this.props.globalStore || this.props
        });
        if (this.props.parentViewKey) {
            this.store.dispatch({
                type: 'SETPARENTVIEWKEY',
                data: this.props.parentViewKey
            });
            console.log('set-parent', this.props.parentViewKey, window.viewInstMap);
            this.store.dispatch({
                type: 'SETPARENT',
                data: window.viewInstMap && window.viewInstMap[this.props.parentViewKey]
            })
        }
    }
    componentWillUnmount() {
        this.store.dispatch({
            type: 'SETGLOBALSTORE',
            store: null
        });
        if (this.props.parentViewKey) {
            this.store.dispatch({
                type: 'SETPARENTVIEWKEY',
                data: null
            });
            this.store.dispatch({
                type: 'SETPARENT',
                data: null
            })
        }
    }
    render() {
        const lang = this.store.getState().appLang;
        return (
            <ConfigProvider locale={langArcoStore[lang]}>
                <Provider store={this.store}>
                    <GlobalContext.Provider
                        value={{
                            lang
                        }}>
                        <Visual
                            {...this.props}
                            setParentChild={this.props.parentViewKey ? this.setParentChild : null}
                            deleteParentChild={this.props.parentViewKey ? this.deleteParentChild : null}
                            renderKey={this.props.renderKey}
                            status={this.state.status}></Visual>
                    </GlobalContext.Provider>
                </Provider>
            </ConfigProvider>
        );
    }
}

Renderer.contextType = GlobalContext;

export default connect((state, props) => {
    return {
        appMap: state.appMap || (state.globalStore && state.globalStore.appMap) || {},
        viewMap: state.viewMap || (state.globalStore && state.globalStore.viewMap) || {},
        globalStore: state.globalStore,
        lang: state.lang || 'zh-CN'
    }
}, null, null, {forwardRef: true})(Renderer);
