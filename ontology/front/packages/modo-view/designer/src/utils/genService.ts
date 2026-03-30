import execExpression from './execExpression';
import execMethod from './execMethod';
import axios from 'modo-plugin-common/src/core/src/http';
import parseRequest from 'modo-plugin-common/src/core/src/http/parseRequest';
import parseParams from 'modo-plugin-common/src/core/src/http/parseParams';
import { Modal } from '@arco-design/web-react';
import eventBus from '@/core/src/utils/eventBus';

let redirectConfirm = true;

export default function(view, service, modelName) {
  const {
    app,
    appServiceMap,
    appModelMap
  } = view.props;
  const item = appServiceMap[service.serviceId];

  const instance = axios.create();

  instance.interceptors.request.use(function (config) {
    let url = config.url;
    const appService = appServiceMap[url];
    let method = config.method;

    if (appService.type === 'tape') {
      const { tapePrefix } = app;
      config.url = tapePrefix ?  `/${tapePrefix}/${appService.url}` : `/${appService.url}`;
      config.method = appService.methodType;
    }

    config = parseRequest(config, app.name);
    const data = execExpression({$this: view.props.get$this()}, service.dataBindVar);

    const currentData = {};
    if (config.method.toLocaleLowerCase() === 'get') {
      currentData.params = {
        ...data,
        ...config.data
      };
      delete config.data;
    } else {
      if (Array.isArray(config.data)) {
        currentData.data = [...config.data];
      } else {
        currentData.data = {
          ...data,
          ...config.data
        };
      }
    }

    execMethod({$this: view.props.get$this()}, service.before, currentData, config, service);
    config = {
      ...config,
      ...currentData
    };
    let placeholders = service.placeholders || [];
    if (typeof service.placeholders === 'string') {
      placeholders = JSON.parse(service.placeholders) || [];
    }
    placeholders.forEach(placeholder => {
      let value = execMethod({$this: view.props.get$this()}, placeholder.value);
      if (config.placeholder) {
        const key = placeholder.key.split('{')[1].split('}')[0];
        value = value || config.placeholder[key];
      }
      config.url = config.url.replace(placeholder.key, value);
    });
    delete config.placeholder;

    config = parseParams(config, service, appServiceMap, appModelMap);
    return config;
  }, function (error) {
    return Promise.reject(error);
  });

  instance.interceptors.response.use(
    response => {
      const { redirect } = response.headers;
      if (redirectConfirm && redirect === 'true' && window.location.href.indexOf('/login') < 0) {
        const { redirecturl } = response.headers;
        if (redirecturl) {
          redirectConfirm = false;
          Modal.confirm({
            title: '提示',
            content:
              '即将前往登录页?',
            okButtonProps: {
              status: 'primary',
            },
            onOk: () => {
              window.location.href = redirecturl;
            }
          });

          setTimeout(() => {
            redirectConfirm = true;
          }, 60000);
        }
      }
      return response
    },
    error => {
      const { message } = error;
      const { data } = error;
      console.warn(message, data, error);
      if (message) {
      }

      return Promise.reject(error);
    },
  );

  const { stateName } = service;

  if (stateName) {
    view.props.dispatch({
      type: 'SETSTATE',
      name: stateName,
      value: execExpression({$this: view.props.get$this()}, service.value)
    });

    const uName = stateName.substring(0, 1).toLocaleUpperCase() + stateName.substring(1);

    view.props.dispatch({
      type: 'SETACTION',
      name: `set${uName}`,
      value: (value) => {
        view.props.dispatch({
          type: 'SETSTATE',
          name: stateName,
          value
        });
      }
    });
  }


  const load = (requestData, placeholder, resolve, reject) => {

    if (service.stateName && !requestData) {
    }
    return instance({
      method: service.method,
      url: service.serviceId,
      data: requestData,
      placeholder: placeholder
    }).then(res => {
      if (res.data && res.data.success) {
        const value = execMethod({$this: view.props.get$this()}, service.success, res.data);
        if (service.stateName) {
          view.props.dispatch({
            type: 'SETSTATE',
            name: service.stateName,
            value
          });
        }
      } else {
        execMethod({$this: view.props.get$this()}, service.fail, res);
      }
      if (modelName) {
        eventBus.dispatch(view.props.viewKey, modelName, service.name, res.data);
      }
      typeof resolve === 'function' && resolve(res);
    }).catch(err => {
      console.log(err);
      execMethod({$this: view.props.get$this()}, service.fail, err);
      if (modelName) {
        eventBus.dispatch(view.props.viewKey, modelName, service.name, err);
      }
      typeof reject === 'function' && reject(err);
    })
  };
  return (requestData, placeholder) => {
    return new Promise((resolve, reject) => {
      if (service.callback) {
        execMethod({$this: view.props.get$this()}, service.callback, function(data) {
          if (service.serviceId) {
            return load(requestData, placeholder, resolve, reject);
          } else {
            if (modelName) {
              eventBus.dispatch(view.props.viewKey, modelName, service.name, data);
            }
            resolve(null);
            return;
          }
        }, requestData, placeholder);
      } else {
        if (service.serviceId) {
          return load(requestData, placeholder, resolve, reject);
        }
      }
      resolve(null);
      return;
    })
  };
}
