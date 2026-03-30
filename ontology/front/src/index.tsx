import 'globalthis/auto';
import 'polyfill-object.fromentries';

import * as Arco from '@arco-design/web-react';
import * as ArcoIcon from '@arco-design/web-react/icon';
import _ from 'underscore';
import { Tag, Face, Empty, Result, SelectInput, DatePickerGroup, Tex } from 'modo-design';
import * as ModoIcon from 'modo-design/icon';

import 'modo-plugin-common/src/theme';
import 'modo-plugin-common/src/style/index.less';
import React, { useEffect } from 'react';

import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { ConfigProvider } from '@arco-design/web-react';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';
import enUS from '@arco-design/web-react/es/locale/en-US';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { GlobalContext } from 'modo-plugin-common/src/utils/context';
import useStorage from 'modo-plugin-common/src/utils/useStorage';
import changeTheme from 'modo-plugin-common/src/utils/changeTheme';
import rootReducer from 'modo-plugin-common/src/store';
import routes from './router';
import simulateLogin from 'modo-plugin-common/src/core/src/utils/simulateLogin';
import getGlobalVar from 'modo-plugin-common/src/core/src/utils/getGlobalVar';
import getMenuData from 'modo-plugin-common/src/core/src/utils/getMenuData';
import RouteWithSubRoutes from 'modo-plugin-common/src/router/RouteWithSubRoutes';
import axios from 'modo-plugin-common/src/core/src/http';
import getAppName from 'modo-plugin-common/src/core/src/utils/getAppName';
const Modo = {
  Tag,
  Face,
  Empty,
  Result,
  SelectInput,
  DatePickerGroup,
  Tex,
};

const global = require('global');

global.Arco = Arco;
global.ArcoIcon = ArcoIcon;
global.Modo = Modo;
global.ModoIcon = ModoIcon;
global.React = React;
global._ = _;
global.NODE_ENV = process.env.NODE_ENV;

window.viewInstMap = {};
window.nodeVarMap = {};
window.nodeRenderer = {};
window.stateChange = {};
const store = createStore(rootReducer);

function Index(props) {
  const [lang, setLang] = useStorage('modo-lang', 'zh-CN');
  const [theme, setTheme] = useStorage('modo-theme', 'modo');

  function getArcoLocale() {
    switch (lang) {
      case 'zh-CN':
        return zhCN;
      case 'en-US':
        return enUS;
      default:
        return zhCN;
    }
  }

  useEffect(() => {
    changeTheme(theme);
  }, [theme]);

  const contextValue = {
    lang,
    setLang,
    theme,
    setTheme,
  };
  const componentConfig = {
    Modal: {
      maskClosable: false,
    },
    Drawer: {
      maskClosable: false,
    },
  };
  return (
    <BrowserRouter>
      <ConfigProvider componentConfig={componentConfig}>
        <Provider store={store}>
          <GlobalContext.Provider value={contextValue}>
            <Switch>
              {routes.map(route => {
                return <RouteWithSubRoutes key={route.name} {...route} />;
              })}
            </Switch>
          </GlobalContext.Provider>
        </Provider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

(async function processAsync() {
  const APP_NAME = 'ontology';
  await axios.post(`/${APP_NAME}/_api/login/`, {
    userId: 'luchao',
    pwd: 'sys.123',
    //  userId: 'luchao',
    // pwd: 'sys.123'
  });
  await axios.post(`/${APP_NAME}/_api/_/team/changeTeam`, { teamName: 'ontology_dev' });
  const data = await getGlobalVar(`/${APP_NAME}/_api/_/platform/identity/${APP_NAME}`);
  store.dispatch({
    type: 'update-identity',
    data: data,
  });
  ReactDOM.render(<Index />, document.getElementById('root'));
})();
